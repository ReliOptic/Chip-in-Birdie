# S1E01 — production draft, not a finished episode

English VO: 469.882 seconds (7:49.882), 1,029 script words. This first draft falls in the authorized 6–12-minute range: it completes the foundry dilemma without stretching to eight minutes. Independent editorial review identifies that it still needs a verified historical decision scene, tighter repetition and claim-level sources before script lock. It is not the final documentary narration.

Actual assets: full English narration WAV/MP3, word timestamps from tiny.en ASR, six-second animated wafer handoff in an offline-capable WebGL player, Blender scene and reproducible source. The handoff is an illustrative contemporary fab, not historical TSMC footage. Remaining full-film scenes are not rendered.

Core timing: excerpt 221.55–225.85 seconds of the actual narration, then 1.7 seconds intentional silence. Approximate observed word timings in hero-timing.json drive captions; physical motion approaches the cassette, deposits the wafer and retracts the supported robot blade. Clock follows real media playback. Deterministic seek also supported.

Reproduce with Blender 4.3.2 and a local output directory:

    mkdir -p /path/to/assets/web
    blender -b -t 6 -P hero.py -- /path/to/assets --skip-still

Omit --skip-still for the Cycles still. No denoiser required (this build lacks OpenImageDenoise). For VO install kokoro-onnx and soundfile in a local venv; obtain the openly licensed v1.0 model/voices described in rights.md:

    python synthesize.py --models /path/to/models --out /path/to/assets

Use player.html with the generated scene.glb, narration.mp3, hero-vo.mp3 and local Three.js 0.170.0 modules from the deliverable bundle. Serve with `python3 -m http.server 8765`. A separate standalone HTML deliverable embeds the runtime assets for file-based playback. Source code is stored in Git; media binaries are delivered separately with SHA-256 manifest.

Observed failures: OIDN unavailable; Eevee headless EGL_BAD_MATCH; no xvfb-run installed; initial soundfile Vorbis encoding segfault after successful WAV write (recovered with FFmpeg; source now uses FFmpeg for encoding); faster-whisper/PyAV keyword mismatch (recovered by feeding FFmpeg-decoded float samples). Original logs retained. YouTube reference access blocked by proxy, no reference-frame inspection claim.

QA is scoped: browser seek/playback and audio file decode are measured, not human listening or viewer approval. Independent production review remains CHANGES_REQUESTED. Finished episodes: 0. S2E01/S3E01/S4E01 remain NOT_STARTED until the S1E01 full loop passes.
