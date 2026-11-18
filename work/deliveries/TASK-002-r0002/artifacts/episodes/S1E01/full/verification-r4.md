# 261117 · S1E01 r4 verification boundaries

The revised **8:54.139 full film is privately deployed on Sites**. This record separates deployed code, generated audio, CPU state/pixels, real browser observations and release approval. The episode is not marked READY by these checks.

## Exact delivery

| Input | Value |
| --- | --- |
| Script revision | `S1E01-full-r4` |
| Script SHA-256 | `277e2e129bb4e3f3752a0acdb2829b91e9918fe38e15586110f51cf9d231c42e` |
| Duration | `12819344 / 24000 = 534.1393333333333` seconds |
| Standalone HTML SHA-256 | `9387f1081487248b355e4009be9a02b02afc914875a3b9d59aeb12e3f0458329` |
| Standalone bytes | `16,145,305` |
| Sites index SHA-256 | `d508ab4e59af4a2635aaae3ba1a8eccb07424cdb89f695a24055cc523c1babad` |
| Sites index bytes | `123,412` |
| MP3 SHA-256 | `7b6751377802e88a529cf0035084ec47775ff8b2900880302371a4e9b28daa9b` |
| WAV SHA-256 | `91a2216839b223ac3608898d379848841a194a905e5a0cc06af45cbf5dbf044b` |
| Timeline SHA-256 | `e919cf231ee194b3cbcc32388414ffac0c66af24414985b8778d38a96db7173d` |
| Original PR #4 GLB SHA-256 | `b7acf29ebead45e17ad6b70496ed7bea8951f70ea883dccbe8f1ec6aee551cd0` |
| Sites source commit | `ed86b10c66c549ed283a7476d1a6ee4afe45fd0c` |

The runtime source and its assets are retained in the private Sites source repository. They are not a public distribution of raw unpublished media. Earlier r3 artifacts and reports remain historical and must not be substituted for these hashes.

## Completed non-browser checks

| Area | Observed result | Limit |
| --- | --- | --- |
| Full narration | 61 utterances; 12,819,344 finite PCM samples; peak 0.7928429842; zero clipped samples; MP3 decode checked | Not pronunciation, expressiveness or final listening approval |
| Unprompted ASR | tiny.en raw token distance 91/1,180 (7.71%); reference/recognition tokenization differs for names and abbreviations | Not an audible error rate or a quality score |
| Static/mock contracts | `qa-contract-r4.json`: 24/24 PASS, including play cancellation, restore, buffering/SFX guards, failure/retry, caption bounds and ending/replay | Mock DOM/media/audio objects, not a browser |
| Sites asset graph | `qa-site-r4.json`: 9 modules / 13 files; current source matches; no unresolved local modules or external GLB resources; each static asset below 25 MiB | No HTTP availability, rendering or real decoding in this check |
| World state | `qa-worlds-r4-results.json`: 220 baseline samples and 440 exact reverse/fresh-shuffled comparisons across 44 phase beats | Geometry/camera/material state, not GPU pixels |
| Probe contact | 28 tip/pad pairs; maximum error 4.266918992e-8 scene units against 1e-6 tolerance | Illustrative geometry, not an electrical/physical metrology result |
| CPU rasterizer | `qa-software-r4-results.json`: 9 selected scene/phase cases; reverse-order pixels and readback match; actual depth, transforms, instancing, inherited visibility, texture orientation and near clipping checked | Node Canvas pixels at 960×540, not browser/WebGL pixels or playback |
| Scoped review | Three reader findings and three runtime findings corrected and rechecked at final source hashes; see `review-r4.md` | Neither full viewing nor independent release approval |

The Node renderer's individual timing measurements are environment-specific. They are not browser frame-rate promises. The CPU fallback uses reduced resolution, approximate shading and a bounded redraw cadence. It must never be reported as the high-quality WebGL/PBR renderer.

## Actual browser and hosting

Native Sites deployment returned **succeeded** for the exact source commit on 2026-11-17. The private URL was opened and displayed the normal ChatGPT sign-in gate. No authentication was bypassed, no credentials were extracted and no audience was expanded. Consequently, private production playback behind that gate was not observed in the agent's browser.

The managed preview serves the exact deployed source/assets. An earlier stale tab stopped responding; opening a fresh tab in the same selected browser restored ordinary access. The app reported unavailable WebGL and used its explicitly labeled CPU 3D compatibility renderer. The following checks used actual UI controls and browser frame/audio readback, not a local browser substitute.

| Real-browser check | Observation |
| --- | --- |
| Full uninterrupted progression | UI Play at 00:00; no intervention until **08:54 / 08:54**, status **Finished · replay available**. Selected intermediate observations included 00:20, 01:53, 05:14, 07:16, 07:48 and 08:38. This is not every-frame inspection or listening approval. |
| Natural replay | UI Play after natural end returned to chapter 1, time 0.11 and Playing. |
| Pause and reload | Paused at 27.75 seconds; reload restored exactly 27.75 and Restored · paused. |
| Chapter and transcript navigation | Chapter 06:21 selected the 381.44-second growth passage; transcript 08:30 selected 510.57 seconds. |
| Keyboard and restart | Focused ArrowLeft moved 510.57 → 505.57 seconds while paused; Restart returned to zero. |
| Captions and evidence | English/Korean switching and current s45 → H08 → CHM printed p. 14 source/limit appeared correctly. Korean text was visibly readable at inspected process/ending shots. |
| Actual CPU frame readback | Eleven selected film times at 800×450 produced identical pixel hashes when revisited in reverse order; diagnostic runtime error list empty. This is **not GPU pixel verification**. |
| Actual OfflineAudioContext | Two independent 22-cue bakes produced exactly equal 12,819,344-sample arrays; finite samples, FNV-1a 7cedc125. This is **not listening approval**. |
| Desktop bounds | Document scroll width 1348 at viewport inner width 1363; no horizontal overflow at that observed size. |
| Fullscreen request | Browser reported Full screen is unavailable in this browser. The fallback message appeared; fullscreen layout/interaction remains unverified. |

Raw browser diagnostics are in `qa-browser-r4-diagnostics.json`; scoped interaction observations are in `qa-browser-r4.json`. The mean and p95 times (77.78 / 212.20 ms) measure selected seek/draw/readback operations in compatibility mode, not playback FPS. A screenshot from about 08:44 shows the actual browser cutaway/ending and Korean caption; it is neither a WebGL nor Blender frame. The expected WebGL startup errors and browser-extension metadata errors are not hidden by the empty application diagnostic-error list.

## Remaining release checks

- Actual primary WebGL picture quality and complete playback on a WebGL-capable browser/device.
- Real iOS/Safari gesture policy, fullscreen and touch behavior; comprehensive desktop/mobile accessibility and caption readability.
- Full listening and pronunciation review, including names and acronyms; final cue/mix listening and translation review.
- Independent audiovisual editorial/release review of the exact deployed revision and any resulting corrections.

The existing diagnostics panel is enabled by `?qa`. Its real CPU readback and real OfflineAudioContext double-bake were executed as recorded above. The same panel must still be run on the primary WebGL renderer. All diagnostic results remain distinct from listening and release approval.

Private Sites publication is the requested review delivery. It is not a YouTube publication or a READY decision. No MP4 was requested/exported, no next episode was started and the finished-episode count is unchanged.
