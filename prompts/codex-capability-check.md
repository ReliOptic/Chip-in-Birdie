# Codex 모션그래픽 종합 검진

예고편 제작 전에 한 번 돌린다. 저장소의 다른 문서에 기대지 않는 독립 프롬프트다. 같은 프롬프트를 GPT-6.1 Sol과 GPT-6 Astra에 각각 보내고 `diagnostics/` 아래 두 결과를 비교한다.

```text
You are being evaluated on code-as-video motion graphics. This is a capability
check, not a production task. Be exact about what worked and what did not; a
truthful FAIL is worth more to us than a polished claim.

Work in this repository on a new branch `diagnostics/<your-model-id>`.
Write everything under `diagnostics/<your-model-id>/`. Touch nothing else.
Do not ask questions. If something is impossible in your environment, record it
and move on.

GLOBAL RULES (apply to every test)
- Output is HTML that plays in a browser. No MP4, GIF or WebM. PNG snapshots only.
- Every frame is a pure function of time t: no Math.random, Date, timers, CSS
  transitions or requestAnimationFrame-driven state. Seeded random only, heavy work
  baked once in setup().
- Each test page exposes window.__seek(t), window.__meta = {title, duration, fps},
  window.__ready = true, and hides UI when the URL hash is #headless.
- 16:9 canvas, 30 fps. English text only. No real company logos, no real people.
- You cannot hear. Never describe how audio sounds. Report numbers only.
- No explanatory labels or titles on screen ("03 / DEPTH STUDY"); only captions and
  the text a test asks for. Captions are plain text on the picture, no boxes or pills.
- Never write that something "looks good". For each snapshot, write one line saying
  what is literally visible.

T0 ENVIRONMENT (no creative work)
Record in env.json: OS, CPU count, RAM, headless browser and version, whether WebGL
works (renderer string), node and python versions, ffmpeg present, outbound network
to cdnjs.cloudflare.com and raw.githubusercontent.com, whether you can pip/npm
install, whether a local TTS (try kokoro-onnx, then piper, then espeak-ng) and a
local speech-to-text (try faster-whisper) can be installed and run. Record the exact
command and error for anything that fails.

T1 HARNESS
Build kit/harness.js (stage sizing with devicePixelRatio, clock, tap to pause, 2px
scrub bar, seeded rand/hash, spring and easing helpers, __seek/__meta/__ready) and
kit/verify.mjs, which for a given test folder: loads the page headless, checks for
console errors, renders t = 8 evenly spaced times to shots/*.png, renders the first
time twice and compares bytes, measures seek-to-pixels time over 20 seeks (report
median and p95 in ms), and writes result.json. Frame time is recorded, not judged:
the environment is likely software WebGL and the output is rendered offline, so do
not fail a test on speed unless p95 exceeds 250 ms. verify.mjs must exit non-zero on
any other failure. All later tests use this kit.

T2 TYPE IN MOTION (8 s, Canvas 2D)
Sentence: "The company that makes everyone's chips sells none of its own."
Word-timed captions driven by one table [[word, start, end, emphasis]]. Emphasised
words must change weight or scale on their own start time. No fade-up-per-line.

T3 2.5D MULTIPLANE (8 s)
A factory skyline in five depth layers with parallax from a slow camera truck and
depth-dependent blur. Flat shapes only.

T4 3D DIORAMA (10 s, three.js from cdnjs) — the most important test
A clay-toy miniature on a cream tabletop: one small factory building, one round
wafer the size of a coin leaning beside it for scale, soft shadows.
Required: (a) tilt-shift depth of field as a final full-screen pass computed from
the depth buffer; (b) props animate stepped at 15 Hz while the camera moves in
continuous time; (c) one camera push-in and one focus rack from building to wafer;
(d) between 30k and 200k triangles, no per-frame geometry rebuild; (e) the table is
dressed: at least 12 distinct props besides the two heroes, so no frame is an object
alone on an empty field; (f) scene and depth rendered at full canvas resolution.
Report triangle count, prop count and p95 frame time.

T5 BAKED SIMULATION (6 s)
400 dust particles settling onto a wafer surface with collisions against the
surface. Simulate once in setup() with a fixed seed and fixed dt; frame(t) only
reads the baked table.

T6 SHADER (6 s, one fragment shader)
Light passing through a mask slit and spreading onto a surface below, built from
signed-distance shapes and a procedural falloff. No textures.

T7 EDITING (12 s, reuse T4 scene or 2D)
Five shots with a written shot list {start, length, size, camera move, cut type,
reason, sound cue}. Must include one match cut, the shortest shot immediately
before the peak, and a 60 ms hit-stop at the peak implemented as a time warp, not
a pause.

T8 SOUND (attach to T7)
Synthesize all audio with OfflineAudioContext: at most 6 kinds of effect, 8-12 cues
tied to visible events on the same frame, one motif stated three times with
variation, 0.3-0.5 s of silence before the peak. Bake each cue in its own context
and sum in fixed order in JS. Bake twice and compare a hash. Report cue table, hash
equality, peak and RMS level in dBFS.

T9 NARRATION (attach to T7)
Narration text (35 words): "Nvidia designs the chip. Apple designs the chip. Neither
of them makes it. One company does, on one island, and it has never sold a chip
under its own name. Why would anyone trust it?"
Use the local TTS from T0. Save vo/*.ogg and vo/timeline.json with word start/end
times. Transcribe it back with the local speech-to-text and report word match rate.
Cuts and captions in T7 must then follow timeline.json. Duck music under speech.
If the narration must fit a duration, re-synthesize at a different speed; never
resample in a way that changes pitch.
If no TTS could be installed, mark T9 as BLOCKED with the reason; do not fake it.

T10 TECHNIQUE BORROWING
Open https://github.com/kstost/cokacmotion, pick ONE demo, read its NOTES.md, and
rebuild only its technique on a different subject (a silicon wafer). In borrow.md
state the demo id, the technique in one sentence with the demo's subject removed,
and list what you deliberately did not carry over (subject, layout, text, colours).
If the repository is unreachable, mark BLOCKED.

T11 MINI TRAILER (15 s) — integration
Combine T4 look + T7 editing + T8 sound + T9 narration into one piece about the
narration text above. One protagonist object (a wafer with blank logo spaces) stays
in every shot. End on the question as on-screen text.
Before coding the full piece, build one hero shot (<= 5 s), take a full-size still
and a zoomed crop, write what is visible, fix, and repeat at least twice. Keep the
three hero iterations in hero/ so we can see what changed.

T12 SELF-AUDIT
For T2-T11 run verify.mjs and paste result.json verbatim into REPORT.md. Then list:
(a) every rule above you broke, with the file and line; (b) everything you could
not verify and why; (c) the three weakest frames in T11 by timestamp, with what is
wrong on screen. Do not rank your own work as strong or weak overall.

DELIVERABLES
- diagnostics/<model-id>/index.html : a grid of all tests; each cell plays on tap.
  Show verify status by shape and position, not by sentences.
- diagnostics/<model-id>/REPORT.md with exactly this table, then T12:

  | Test | Status (PASS/FAIL/BLOCKED) | Deterministic | p95 ms | Console errors | What is on screen at mid-point |

- env.json, kit/, one folder per test with index.html, shots/, result.json.
- Wall-clock time and, if you can read it, token usage per test.
Commit, push the branch, and open a pull request titled
"Diagnostics: <model-id> motion capability check". Reply with the REPORT.md table
only.
```

## 결과를 읽는 법

| 볼 것 | 어디서 | 의미 |
|---|---|---|
| T0 | `env.json` | 음성 합성·받아쓰기·WebGL이 안 되면 예고편 계약을 그 환경에 맞게 고쳐야 한다 |
| T4, T11 | 갤러리에서 직접 재생 | 기준작(7/10)과 나란히 놓고 감독이 채점. 이 두 개가 룩의 상한이다 |
| T7–T9 | 샷 리스트, 큐 표, 일치율 | 편집과 소리를 설계로 하는지, 덧붙이는지 |
| T10 | `borrow.md` | 기법만 가져오는 규칙을 지키는지 |
| T12 | `REPORT.md` | 스스로 어긴 규칙과 못 한 검증을 적었는지. `result.json`과 표가 다르면 그 모델의 자기 보고는 믿지 않는다 |
| 두 모델 비교 | 두 PR | T4·T11의 화면, p95, BLOCKED 수, 걸린 시간. 차이가 작으면 Sol로 간다 |

검진 결과에 따라 [예고편 계약](../production/TRAILERS.md)의 음성·3D 예산·검증 항목을 조정한 뒤 예고편 0단계로 넘어간다.
