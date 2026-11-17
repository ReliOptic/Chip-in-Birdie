# 261117 · S1E01 full-r3 verification boundaries

Status: **FULL-LENGTH REVIEW BUILD EXISTS / RELEASE QA INCOMPLETE**. This record distinguishes code, generated media, static contracts, geometry inspection and actual audiovisual approval. None of the tests below upgrades the episode to `READY`.

## Exact reviewed inputs

| Input | Value |
| --- | --- |
| Script revision | `S1E01-full-r3` |
| Script SHA-256 | `de62b3087c7406a888a77b1f11af709167e3c2ca32a9739865bcc0944019f61b` |
| Compiled HTML bytes | `16155426` |
| Compiled HTML SHA-256 | `e116142bca3ac27b53270ccbe7d48b55e017f63f97a7a60b3441bb5cbcaff7f3` |
| Canonical duration | `12964240 / 24000 = 540.1766666666666` seconds |
| MP3 SHA-256 | `36129585924f1df3739509b13b337306cf3ab81d7f61433b00ace2885be261fe` |
| WAV SHA-256 | `50453967e1c5104f8da29bdf59e1f23ce7af75e184f563ce9dd9ad6e5d857128` |
| Timeline SHA-256 | `70830b1853d7a76ecc381f7db393d3bfb4a79e2ba990660c727a63d5b4a06afa` |
| Contract result SHA-256 | `f269ac2a9d6cc82874f61949c93270ab608c15d88d43aaecc7d5a83d75fb562d` |
| CPU world result SHA-256 | `1c553d57a8ca98d716e77572363306974444f1c28222dca55d653d1741d9c308` |

The full-r2 voice had a different duration and script. Those historical measurements are retained in `audio-env.md` but are not substituted for r3. The old six-second r1 playback record is not full-film evidence.

## Completed checks and their limits

| Area | Actual observation | What it does not establish |
| --- | --- | --- |
| Narration generation | All 61 utterances generated or reused by identical synthesis-cache key; 13 revised utterances synthesized for r3. WAV and full MP3 decode each contain 12,964,240 finite samples; zero clipped samples. | Pronunciation, comfortable pace, expressive delivery or final mix quality. |
| Audio signal and ASR | WAV −21.69 LUFS, −1.99 dBTP, 1.20 LU LRA. Unprompted tiny.en comparison: 78/1,182 token edits, 6.60%. | ASR is not listening or a quality score. Signal levels are measured, not a broadcast-compliance claim. |
| Final HTML contracts | `qa-contract-results.json`: **22/22 PASS**, no warnings. Seven embedded JS modules resolve; no external GLB resources; exact source and asset hashes match. | No browser was started by these tests. |
| Player state logic | Actual production functions executed with mock DOM/media objects: play cancellation, duplicate play, seek, visibility pause, failure/retry, ending/replay, mute race, saved state and caption boundaries. | Real browser gesture policies, native decoding, fullscreen appearance, keyboard behavior or touch usability. |
| Timing | Ten chapters, 61 utterances, 41 named shots / 44 phase beats; boundaries use actual sentence samples. Phase changes within repeated shot IDs are preserved. | Smooth pacing, absence of visual jump cuts or viewer attention. |
| Source/data integrity | 24 claims connect to 11 source entries; all claim references resolve; source limitations and notices are embedded. Primary-source locations were checked against the spoken historical claims. | Full audiovisual editorial approval, blanket legal clearance or perpetual URL availability. |
| Fresh-viewer reading | Separate context received the audience promise and viewer-facing script, not the producer's research/intent. r3 causal spine and within-episode payoff were understandable. See `review-fresh-viewer.md`. | The reviewer did not watch or listen to r3. No completion/retention claim. |
| CPU state determinism | `results.json`: all eight worlds, 220 baseline samples across 44 beats, 440 exact reverse/fresh-shuffled state comparisons passed. Actual recovered GLTF parser and production fab/camera functions were included. | This compares CPU geometry, transforms, materials, textures and cameras, not GPU pixels. The scene producer ran this test; it is not independent release QA. |
| Probe contact geometry | 28 needle-tip / pad-center pairs passed at seven positions. Maximum error `4.266918992009285e-8` scene units, against `1e-6` tolerance. | No electrical measurement, physical accuracy or yield claim. |
| CPU model inspection | Thirteen selected model configurations, including the recovered fab, were exported from actual Three.js geometry and cameras, rendered and visually inspected with Blender CPU Cycles. | These are **not WebGL screenshots**. Materials, lighting, antialiasing, fonts, canvas UI and animation playback differ. |

The CPU inspection led to larger authored evidence-label text, a lid that clears the wire bonds and remains closed at the ending, and an explicit customer-visit composition. The physical testing model's tips were aligned to actual pad coordinates. These changes were not passed off as device simulation or process validation.

## Source review notes

Historical statements are attributed to the CHM Chang oral history (2007), the Chang/Huang conversation (2007), the TSMC 1994 annual report and ITRI's retrospective. Modern process/interface claims use ASML, TSMC and FormFactor primary material. `claims.json` distinguishes history, mechanisms and editorial inferences.

The customer-visit scene explicitly says **2007 conversation, pp. 5–6**. It is Huang's recollection, not evidence of a first customer, an exact visit date, an invented conversation or a proved motive for choosing TSMC. The Cirrus agreement and customer visits are separate sources and events. The annual report's charter account is not used as proof that every competitive conflict is eliminated. The modern fab model is not presented as the 1987 factory.

The evidence agent reviewed the r3 additions against those primary records. That is a bounded script/source check. It is not independent final-media, pronunciation or rights approval. The narrator pipeline reviewer did not author the player/build and reviewed those contracts separately; that reviewer is **not** an independent approver of its own generated audio.

## Blocked / not performed

The connected browser was unavailable in the originating mobile conversation. Cloud browser attempts to reach the local review server failed. A subsequent browser policy error explicitly prohibited an alternate route to the blocked action. Browser work stopped; no raw protocol, alternate-browser or local-file workaround was used.

These release checks remain open:

1. Full 0 → 540.1767-second **actual WebGL playback**, including film/voice synchronization, decoding, natural end and replay.
2. Real seek-order image comparison at every major state and chapter boundary; no renderer errors, missing assets or blank frames.
3. Real `OfflineAudioContext` cue bake twice with matching samples/checksum, followed by mix listening. Mock scheduling is not this test.
4. Full listening and pronunciation review, including TSMC, ITRI, Cirrus Logic, K. T. Li, Morris Chang and Jensen Huang; Korean translation/caption readability review.
5. Desktop and mobile layouts, pointer/keyboard focus, fullscreen controls and restored sessions on real browsers.
6. Independent audiovisual editorial/release review against this exact HTML/script/audio revision, and any requested fixes.

Useful existing harness endpoints after loading the HTML are `window.__ready`, `window.__state()`, `window.__film`, `window.__seek(t)`, and `window.__meta.audio.verify()`. `#headless` removes review UI; `?qa` avoids restoring saved state. Preserve the exact artifact hash in any future test record.

No MP4 has been exported for r3. Picture confirmation and an explicit final-video export request remain separate from this HTML-first production. No publication operation has occurred. The broader season slate and finished-episode count are unchanged.
