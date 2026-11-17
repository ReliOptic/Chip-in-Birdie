# S1E01 full-film audio pipeline — 2026-11-17

## Scope and limits

`audio-build.py` synthesizes the English master locally with Kokoro ONNX v1.0,
using `bm_george` at speed `0.94` and the same `en-us` phonemizer setting used in
PR #4. This is a bundled synthetic voice, not a clone of a named narrator.
No paid API, upload, or external inference service is used.

The first full-build attempt was stopped by auto-review when the installed
ONNX Runtime tried to contact a Microsoft telemetry endpoint. The unrequested
egress was not approved or bypassed. The build source now sets the official
`ORT_DISABLE_TELEMETRY=1` process-lifetime opt-out **before importing ONNX
Runtime**, and also calls `disable_telemetry_events()` before creating a session.
The [official privacy documentation](https://github.com/microsoft/onnxruntime/blob/main/docs/Privacy.md)
explains why the API alone can miss initialization telemetry. A retry must be a
fresh process with this source, never a resumed instance of the stopped run.

The timeline records **actual generated utterance sample boundaries**. It is not
forced word alignment. The English display text, Korean subtitle text, and any
pronunciation-only narration replacement are separate fields. Model inference,
valid PCM, a decoded MP3, and correct timestamps do not constitute listening
approval, pronunciation approval, or full-film release QA.

## Reproduction

Use a directory outside the Git source tree for models, the venv, caches, and
media outputs. Install `kokoro-onnx==0.6.1` and `soundfile==0.14.0` into that venv.
FFmpeg and FFprobe must be on PATH. No separate system espeak install was needed;
the installed `espeakng-loader` package supplied the runtime library.

Download the following public upstream assets, naming them `kokoro.onnx` and
`voices.bin` in a models directory:

- [Kokoro v1.0 ONNX](https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx)
- [Kokoro v1.0 voices](https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin)

The acquired SHA-256 values were:

| File | SHA-256 |
|---|---|
| `kokoro.onnx` | `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5` |
| `voices.bin` | `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d` |

Example command, with caller-selected absolute directories:

```bash
ORT_DISABLE_TELEMETRY=1 /path/to/venv/bin/python episodes/S1E01/full/audio-build.py \
  --script episodes/S1E01/full/script.json \
  --models /path/to/models \
  --out /path/to/audio-output
```

The input is either an array of rows or an object containing `sentences`.
Each row requires a unique `id` and nonempty `en`; `ko`, `chapter`, `shot`, and
other editorial fields are preserved in the output. Optional `narration`
changes only the spoken rendering, and optional `pause_before` / `pause_after`
are non-negative seconds. `--pronunciation` accepts a JSON object of literal
replacements, overrides the built-in episode defaults, and records the applied
changes. The defaults are `TSMC` → `T S M C`, `ITRI` → `I T R I`, `K. T. Li` →
`K T Lee`, and `Hsinchu` → `Shin choo`; these affect spoken text only and remain
subject to pronunciation review. `--limit 2` produces a marked
partial smoke test; it must not be passed off as a full episode.

Per-utterance float WAV caches are keyed by the spoken text, voice, speed,
language, package version, and both model-file hashes. A failed build retains
finished utterances and `progress.json` for retry. Final files use temporary
`.part` files before replacement. `timeline.json` includes input/output hashes,
the environment, exact sample offsets, signal metrics and explicit unperformed
review fields. The 24 kHz PCM sample clock is canonical; MP3 container duration
can include codec padding.

`--asr` optionally runs an unprompted transcription comparison after synthesis.
It requires `faster-whisper==1.2.1` and a previously acquired `tiny.en` model in
the models directory's `asr` cache. The inference command uses
`local_files_only=True`; it does not download a model during the production
run. The transcript and raw token comparison are saved as `asr-proxy.json`, with
its SHA-256 recorded in `timeline.json`. A failed optional ASR check is explicitly
marked `FAILED` and does not relabel the narration as reviewed.

## Observed environment

Python 3.12.14; FFmpeg 7.1.5-0+deb13u1; CPUExecutionProvider with four intra-op
threads, one inter-op thread, sequential ONNX graph execution.

```text
attrs==26.1.0
cffi==2.1.1
cloudpickle==3.1.2
dlinfo==2.0.0
espeakng-loader==0.2.4
flatbuffers==25.12.19
joblib==1.6.0
kokoro-onnx==0.6.1
numpy==2.5.5
onnxruntime==1.32.0
packaging==26.3
phonemizer==3.6.0
protobuf==7.36.2
pycparser==3.12
soundfile==0.14.0
typing_extensions==4.16.0
```

## Provenance and rights evidence

Checked public primary sources on 2026-11-17:

- [Kokoro ONNX repository](https://github.com/thewh1teagle/kokoro-onnx),
  [implementation license](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE): MIT.
- [Kokoro-82M model card](https://huggingface.co/hexgrad/Kokoro-82M): Apache-2.0
  model weights. Its model-card weight hash is for the upstream model file,
  not the ONNX conversion above; the two are not asserted to match.
- [Upstream voice table](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md):
  `bm_george` is listed among the British English voices. The table warns about
  performance at very short/long utterance lengths; human voice evaluation
  remains necessary. `en-us` is preserved for continuity, not asserted to be a
  linguistically optimal setting for this British voice.

Do not redistribute the model or software without carrying their applicable
licenses/notices. The source repository receives this build code and evidence,
not the binary models or unpublished audio.

## Executed smoke test

Two utterances synthesized successfully at 24 kHz mono: 14.772 seconds including
the specified pauses, peak 0.65560764, zero clipped samples. The first utterance
spans 0.350–5.705 seconds and the second 6.055–13.372 seconds. FFprobe decoded the
MP3 metadata; container duration was 14.832 seconds due to codec framing.
This was a pipeline check, not listening or final narration QA.

A second independent synthesis into a new directory produced the same WAV and
MP3 SHA-256 hashes as the first smoke run in this environment. This is a scoped
two-utterance repeatability result, not a cross-platform determinism claim.
The complete smoke MP3 also decoded successfully with FFmpeg, not only FFprobe.
Decoded MP3 and WAV each contained exactly 354,528 samples at 24 kHz; the
container-padding duration difference did not shift the decoded PCM timeline.

An optional `faster-whisper==1.2.1` / `tiny.en` CPU-int8 transcription of the
smoke audio recovered both sentences. No script was supplied as a prompt.
The raw word-edit comparison was 4/26, caused by the reference's separate
letters `T S M C` versus ASR's `TSMC`. This is evidence of intelligibility for
these two utterances only, not a voice-quality or pronunciation approval.

## Full narration result

The telemetry-disabled production run completed for locked source script
`09d61dcad025f4a8e9e9f7b17c93569017285c6c750e2482e053cc090e898a0a`.
All 61 utterances were assembled into **531.046 seconds (8:51.046)** of 24 kHz
mono PCM: 12,745,104 samples. English display text was not rewritten by the
audio pipeline; TSMC, ITRI, and K. T. Li received separately recorded
pronunciation renderings.

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| narration WAV | 25,490,252 | `eaa7b0bdedc90d96c29f7bdfca05e34e892858f41e172f38e982c6c8cd297307` |
| narration MP3 | 8,497,964 | `cfcdb965c44b1b967464d6ef58e6c55ac62449501cb52aaf6746ed42116d5f6f` |
| measured utterance timeline | 79,084 | `7968f441f4ed50baa1e3a6eabc4f1cfa1acf3101cd7e43f80fedbeb600e4f24a` |
| unprompted ASR proxy | 182,381 | `afbbc2f65bb4b83d86b5987c9fc3baf69a188a54cc0a24eaad60ce7f42683485` |

The complete MP3 decoded to exactly the same 12,745,104-sample length as the WAV.
Decoded MP3 peak was 0.74947757 with zero clipped samples. PCM peak was
0.79284298 with zero clipped samples. These are signal/decode measurements, not
an assessment of pleasantness or narration performance.

FFmpeg loudness measurement of the unmodified WAV reported integrated
-21.69 LUFS, -1.99 dBTP true peak, and 1.20 LU loudness range. No loudness filter
was applied to the delivered files; the hashes above remain the synthesis
outputs. A final film mix, if added, requires its own level and listening check.

The full unprompted `tiny.en` ASR pass completed. Its raw token-edit comparison
was 95/1,165 (8.15%); spelled numbers and abbreviations account for many
differences. ASR also transcribed `fabless` as `fables`, one `Cirrus Logic`
mention as `serious logic`, and some joined words as split forms. These are
**review prompts, not proof that the voice pronounced them incorrectly**.
Priority listening spans are 44.149–53.151 seconds (Chang/K. T. Li),
376.977–386.363 (fabless), 395.631–405.189 (Cirrus Logic International), and
510.647–520.140 (the concluding competition-boundary sentence).

No human listening, pronunciation approval, stereo music/SFX mix, or release
approval is claimed by this audio handoff. The root film producer must verify
playback against this exact timeline and carry the remaining listening checks
into independent release QA.

## Full narration result — r3 (current)

The revised, evidence-reviewed English master contains 61 utterances and 1,121
display-text words. Its locked script SHA-256 is
`de62b3087c7406a888a77b1f11af709167e3c2ca32a9739865bcc0944019f61b`.
The local telemetry-disabled build used the same model, voice, phonemizer,
speed, and pause policy documented above. Thirteen changed utterances were
synthesized (`s07`, `s08`, `s16`, `s19`, `s20`, `s21`, `s25`, `s27`, `s32`,
`s47`, `s48`, `s49`, `s50`); the other 48 reused matching utterance-cache keys.

The new outputs are in the separate `audio/full-r3` media directory. The earlier
`audio/full` directory was not overwritten: its WAV, MP3, and timeline hashes
were checked against the r2 values above after r3 completed and remained
unchanged. The preceding full-result section is retained as historical r2
evidence, not as the current film duration.

The exact r3 PCM clock is **12,964,240 samples at 24 kHz mono**, or
**540.1766666666666 seconds (9:00.177 rounded to milliseconds)**. This is measured
speech plus the declared pauses, not a padded nominal duration. The r3 MP3
container reports 540.240 seconds; complete FFmpeg decoding recovers exactly
the same 12,964,240 samples as the WAV. Utterance offsets must come from this
r3 timeline rather than the earlier 531.046-second timeline.

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| r3 narration WAV | 25,928,524 | `50453967e1c5104f8da29bdf59e1f23ce7af75e184f563ce9dd9ad6e5d857128` |
| r3 narration MP3 | 8,644,268 | `36129585924f1df3739509b13b337306cf3ab81d7f61433b00ace2885be261fe` |
| r3 measured utterance timeline | 79,871 | `70830b1853d7a76ecc381f7db393d3bfb4a79e2ba990660c727a63d5b4a06afa` |
| r3 unprompted ASR proxy | 186,720 | `8ef0611b8ab5ee3bec6e5dca7c556b42cf3f69f41bd966a1a9e666326eb90665` |

Both the WAV PCM and the fully decoded MP3 contained only finite samples and
zero samples at or beyond full scale. Measured file-PCM peaks were 0.79281616
for the 16-bit WAV and 0.75365794 for the decoded MP3. The pre-quantization
synthesis peak recorded in the timeline is 0.79284298; this is a different
measurement from the 16-bit file peak. RMS values were 0.08662292 and
0.08229477 respectively.

FFmpeg measured the unchanged r3 WAV at -21.69 LUFS integrated, -1.99 dBTP true
peak, and 1.20 LU loudness range. The measurement sent its processed output to
the null sink; no normalization was applied to either delivered narration file.
This does not measure the browser's combined narration/SFX mix.

The unprompted local `tiny.en` ASR comparison completed with 78 raw token edits
against 1,182 pronunciation-expanded reference tokens (6.60%). The recognized
text had 1,137 tokens. This is a disagreement proxy, not a listening-quality
score or a forced-alignment result. Among the review prompts, ASR wrote
`PSMC` for one spelled TSMC mention, `Fables` for `fabless`, and `way for`
for `wafer`. Check the actual utterances rather than treating those ASR words
as established narration defects. Useful r3 listening spans include:

- 44.149–54.645 seconds: K. T. Li / Morris Chang and the revised introduction.
- 340.649–351.273 seconds: the actual-yield disclaimer and spelled TSMC.
- 379.579–388.966 seconds: fabless companies and the early-growth account.
- 398.234–418.537 seconds: Cirrus Logic International and wafer products.
- 418.787–439.005 seconds: Jensen Huang's retrospective and wafer planning.

The ASR library emitted a local UCX VFS-socket permission diagnostic but
returned successfully with the complete transcript and comparison; no
permission setting was changed and no bypass was attempted. Human listening,
proper-name pronunciation, real-browser playback, and final release approval
remain **not performed** by this audio producer.
