#!/usr/bin/env python3
"""Build measured, sentence-boundary VO for S1E01 with local Kokoro.

Audio/model binaries remain outside Git. Sentence times describe the actual
generated PCM, not estimated word alignment or a listening assessment.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import math
import os
# Official full-process 1DS opt-out. This MUST precede any ONNX Runtime import;
# disable_telemetry_events alone can be too late for initialization telemetry.
# https://github.com/microsoft/onnxruntime/blob/main/docs/Privacy.md
os.environ["ORT_DISABLE_TELEMETRY"] = "1"
from pathlib import Path
import platform
import re
import subprocess
import sys

DEFAULT_PRONUNCIATION = {
    "TSMC": "T S M C",
    "ITRI": "I T R I",
    "K. T. Li": "K T Lee",
    "Hsinchu": "Shin choo",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def atomic_json(path: Path, value: object) -> None:
    temporary = path.with_name(path.name + ".part")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    temporary.replace(path)


def read_script(path: Path) -> list[dict]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    rows = raw if isinstance(raw, list) else raw.get("sentences")
    if not isinstance(rows, list) or not rows:
        raise ValueError("script must be a non-empty array, or {sentences: [...]}.")
    ids: set[str] = set()
    for index, row in enumerate(rows):
        if not isinstance(row, dict) or not isinstance(row.get("en"), str) or not row["en"].strip():
            raise ValueError(f"row {index}: non-empty English text in en is required")
        if "id" not in row:
            raise ValueError(f"row {index}: explicit stable id is required")
        item_id = str(row["id"])
        if item_id in ids:
            raise ValueError(f"duplicate id: {item_id}")
        ids.add(item_id)
        for key in ("pause_after", "pause_before"):
            if key in row and (not isinstance(row[key], (int, float)) or not math.isfinite(row[key]) or row[key] < 0):
                raise ValueError(f"row {item_id}: {key} must be a non-negative finite number")
    return rows


def asr_proxy(wav: Path, out: Path, models: Path, rows: list[dict], threads: int) -> dict:
    """Transcribe without a script prompt. Do not treat this as listening QA."""
    import numpy as np
    from faster_whisper import WhisperModel

    pcm = np.frombuffer(subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(wav), "-ar", "16000", "-ac", "1", "-f", "f32le", "-"
    ]), dtype=np.float32)
    model = WhisperModel("tiny.en", device="cpu", compute_type="int8", cpu_threads=threads,
                         download_root=str(models / "asr"), local_files_only=True)
    observed, _ = model.transcribe(pcm, language="en", beam_size=5, word_timestamps=True,
                                   vad_filter=False, condition_on_previous_text=False)
    segments = []
    for segment in observed:
        segments.append({"start": segment.start, "end": segment.end, "text": segment.text,
                         "avg_logprob": segment.avg_logprob,
                         "words": [{"word": word.word, "start": word.start, "end": word.end,
                                    "probability": word.probability} for word in segment.words or []]})
        print(f"ASR {segment.start:.2f}-{segment.end:.2f}: {segment.text}", flush=True)
    normalize = lambda text: re.findall(r"[a-z0-9]+", text.lower())
    reference = normalize(" ".join(row["narration"] for row in rows))
    hypothesis = normalize(" ".join(segment["text"] for segment in segments))
    previous = list(range(len(hypothesis) + 1))
    for i, token in enumerate(reference, 1):
        current = [i]
        for j, heard in enumerate(hypothesis, 1):
            current.append(min(previous[j] + 1, current[j - 1] + 1,
                               previous[j - 1] + (token != heard)))
        previous = current
    comparison = {"reference_words": len(reference), "asr_words": len(hypothesis),
                  "token_edit_distance": previous[-1], "raw_wer": previous[-1] / max(1, len(reference)),
                  "note": "Raw lowercased alphanumeric-token comparison. Names, numerals, and spelled abbreviations count as disagreements; these are not necessarily audible errors."}
    report = {"audio_sha256": sha256_file(wav), "model": "tiny.en", "engine": "faster-whisper",
              "engine_version": importlib.metadata.version("faster-whisper"), "compute_type": "int8",
              "device": "cpu", "method": "Free ASR of actual audio, no script prompt",
              "sample_rate": 16000, "duration": len(pcm) / 16000,
              "human_listening": False, "forced_alignment": False,
              "comparison": comparison, "segments": segments}
    atomic_json(out / "asr-proxy.json", report)
    return {"status": "COMPLETED_PROXY_NOT_LISTENING", "path": "asr-proxy.json",
            "sha256": sha256_file(out / "asr-proxy.json"), "comparison": comparison}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--script", type=Path, required=True)
    parser.add_argument("--models", type=Path, required=True, help="Directory with kokoro.onnx and voices.bin")
    parser.add_argument("--out", type=Path, required=True, help="Binary output directory outside Git")
    parser.add_argument("--voice", default="bm_george")
    parser.add_argument("--speed", type=float, default=0.94)
    parser.add_argument("--lang", default="en-us", help="Matches the previous S1E01 VO phonemizer setting")
    parser.add_argument("--pause", type=float, default=0.25, help="Silence between utterances unless row overrides")
    parser.add_argument("--head", type=float, default=0.35, help="Initial silence in seconds")
    parser.add_argument("--tail", type=float, default=1.0, help="Final silence in seconds, in addition to final pause")
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--pronunciation", type=Path, help="Override the episode's default literal replacements with a JSON object; original en remains intact")
    parser.add_argument("--limit", type=int, help="Smoke test only: synthesize first N rows, marked partial")
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--asr", action="store_true", help="Optional tiny.en transcript comparison; requires faster-whisper, not human listening")
    args = parser.parse_args()
    script_hash = sha256_file(args.script)
    rows = read_script(args.script)
    if (any(not math.isfinite(x) for x in (args.speed, args.pause, args.head, args.tail))
            or args.speed <= 0 or args.pause < 0 or args.head < 0 or args.tail < 0 or args.threads < 1):
        raise ValueError("speed/threads must be positive; pause/head/tail cannot be negative")
    if args.limit is not None and args.limit < 1:
        raise ValueError("--limit must be positive")
    replacements = DEFAULT_PRONUNCIATION.copy()
    if args.pronunciation:
        replacements = json.loads(args.pronunciation.read_text(encoding="utf-8"))
        if not isinstance(replacements, dict) or any(not isinstance(k, str) or not isinstance(v, str) for k, v in replacements.items()):
            raise ValueError("pronunciation file must be an object of literal string replacements")
    if args.validate_only:
        print(json.dumps({"validated_rows": len(rows), "words": sum(len(x["en"].split()) for x in rows)}, indent=2))
        return 0
    if args.limit:
        rows = rows[:args.limit]
    os.environ.setdefault("OMP_NUM_THREADS", str(args.threads))
    os.environ.setdefault("OPENBLAS_NUM_THREADS", str(args.threads))
    import numpy as np
    import soundfile as sf
    import onnxruntime as ort
    ort.disable_telemetry_events()
    from kokoro_onnx import Kokoro

    model = args.models / "kokoro.onnx"
    voices = args.models / "voices.bin"
    for path in (model, voices):
        if not path.is_file():
            raise FileNotFoundError(f"Required local model file not found: {path}")
    model_hash = sha256_file(model)
    voices_hash = sha256_file(voices)
    args.out.mkdir(parents=True, exist_ok=True)
    cache = args.out / "utterances"
    cache.mkdir(exist_ok=True)
    options = ort.SessionOptions()
    options.intra_op_num_threads = args.threads
    options.inter_op_num_threads = 1
    options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    session = ort.InferenceSession(str(model), sess_options=options, providers=["CPUExecutionProvider"])
    engine = Kokoro.from_session(session, str(voices))
    sample_rate = 24000
    parts = [np.zeros(round(args.head * sample_rate), dtype=np.float32)]
    cursor = len(parts[0])
    timeline = []
    package_version = importlib.metadata.version("kokoro-onnx")

    for index, row in enumerate(rows):
        spoken = row.get("narration", row["en"])
        if not isinstance(spoken, str) or not spoken.strip():
            raise ValueError(f"row {row['id']}: narration must be non-empty text")
        applied = []
        for before, after in replacements.items():
            if before in spoken:
                spoken = spoken.replace(before, after)
                applied.append({"from": before, "to": after})
        identity = {"text": spoken, "voice": args.voice, "speed": args.speed, "lang": args.lang,
                    "model_sha256": model_hash, "voices_sha256": voices_hash, "kokoro_onnx": package_version}
        key = hashlib.sha256(json.dumps(identity, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", str(row["id"]))[:50]
        wav_path = cache / f"{index:03d}-{safe_id}-{key[:16]}.wav"
        cached = wav_path.is_file()
        if cached:
            samples, rate = sf.read(wav_path, dtype="float32")
        else:
            samples, rate = engine.create(spoken, voice=args.voice, speed=args.speed, lang=args.lang)
            samples = np.asarray(samples, dtype=np.float32)
            temporary = wav_path.with_name(wav_path.name + ".part")
            sf.write(temporary, samples, rate, format="WAV", subtype="FLOAT")
            temporary.replace(wav_path)
        if rate != sample_rate or samples.ndim != 1 or not len(samples) or not np.all(np.isfinite(samples)):
            raise ValueError(f"row {row['id']}: invalid audio rate/shape/samples")
        before_samples = round(float(row.get("pause_before", 0)) * sample_rate)
        if before_samples:
            parts.append(np.zeros(before_samples, dtype=np.float32))
            cursor += before_samples
        start = cursor
        parts.append(samples)
        cursor += len(samples)
        end = cursor
        pause_samples = round(float(row.get("pause_after", args.pause)) * sample_rate)
        parts.append(np.zeros(pause_samples, dtype=np.float32))
        cursor += pause_samples
        timeline.append({**row, "narration": spoken, "pronunciation_replacements": applied,
                         "index": index, "start_sample": start, "end_sample": end,
                         "start": start / sample_rate, "end": end / sample_rate,
                         "duration": len(samples) / sample_rate,
                         "pause_before_samples": before_samples, "pause_after_samples": pause_samples,
                         "word_timing_status": "NOT_ALIGNED",
                         "timing_method": "actual_generated_utterance_sample_boundaries",
                         "utterance_sha256": sha256_file(wav_path), "utterance_path": str(wav_path.relative_to(args.out)),
                         "source_cache_key": key})
        atomic_json(args.out / "progress.json", {"completed_rows": index + 1, "total_rows": len(rows),
                                                 "duration_so_far": cursor / sample_rate,
                                                 "script_sha256": script_hash})
        print(f"{index + 1}/{len(rows)} {row['id']}: {start / sample_rate:.3f}-{end / sample_rate:.3f}s {'cached' if cached else 'synthesized'}", flush=True)

    parts.append(np.zeros(round(args.tail * sample_rate), dtype=np.float32))
    if sha256_file(args.script) != script_hash:
        raise RuntimeError("Source script changed during synthesis; refusing to label mixed revisions as one delivery")
    pcm = np.concatenate(parts)
    raw_peak = float(np.max(np.abs(pcm)))
    gain = min(1.0, 0.95 / raw_peak) if raw_peak else 1.0
    pcm *= gain
    wav = args.out / "narration.wav"
    wav_part = wav.with_name(wav.name + ".part")
    sf.write(wav_part, pcm, sample_rate, format="WAV", subtype="PCM_16")
    wav_part.replace(wav)
    mp3 = args.out / "narration.mp3"
    mp3_part = mp3.with_name(mp3.name + ".part")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-map_metadata", "-1", "-c:a", "libmp3lame",
                    "-b:a", "128k", "-ar", str(sample_rate), "-f", "mp3", str(mp3_part)], check=True)
    mp3_part.replace(mp3)
    probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(mp3)], text=True))
    result = {
        "schema_version": 1, "episode": "S1E01", "source_script_sha256": script_hash,
        "partial_smoke_test": args.limit is not None, "voice": args.voice, "engine": "Kokoro ONNX 1.0",
        "sample_rate": sample_rate, "channels": 1, "total_samples": len(pcm), "duration": len(pcm) / sample_rate,
        "speed": args.speed, "lang": args.lang, "initial_silence_samples": round(args.head * sample_rate),
        "final_silence_samples": round(args.tail * sample_rate), "normalization_gain": gain,
        "source_peak": raw_peak, "peak": float(np.max(np.abs(pcm))), "rms": float(np.sqrt(np.mean(pcm * pcm))),
        "finite_samples": bool(np.all(np.isfinite(pcm))), "clipped_samples": int(np.sum(np.abs(pcm) >= 1)),
        "timing_method": "actual_generated_utterance_sample_boundaries", "word_alignment": "NOT_PERFORMED",
        "human_listening_review": "NOT_PERFORMED", "asr_review": "NOT_PERFORMED",
        "model_sha256": model_hash, "voices_sha256": voices_hash,
        "environment": {"python": platform.python_version(), "kokoro_onnx": package_version,
                        "onnxruntime": ort.__version__, "soundfile": sf.__version__, "numpy": np.__version__,
                        "provider": "CPUExecutionProvider", "threads": args.threads,
                        "ort_disable_telemetry_before_import": True,
                        "telemetry_api_disabled_before_session": True},
        "outputs": {"wav": {"path": wav.name, "bytes": wav.stat().st_size, "sha256": sha256_file(wav)},
                    "mp3": {"path": mp3.name, "bytes": mp3.stat().st_size, "sha256": sha256_file(mp3),
                            "container_duration": float(probe["format"]["duration"]),
                            "note": "Container duration includes codec padding; PCM sample clock is canonical."}},
        "sentences": timeline,
    }
    if args.asr:
        try:
            result["asr_review"] = asr_proxy(wav, args.out, args.models, timeline, args.threads)
        except Exception as error:
            result["asr_review"] = {"status": "FAILED", "error": str(error)}
            print(f"Optional ASR failed; complete narration remains available: {error}", file=sys.stderr, flush=True)
    atomic_json(args.out / "timeline.json", result)
    print(json.dumps({"duration": result["duration"], "sentences": len(timeline), "peak": result["peak"],
                      "clipped_samples": result["clipped_samples"], "outputs": result["outputs"]}, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Audio build failed: {error}", file=sys.stderr, flush=True)
        raise
