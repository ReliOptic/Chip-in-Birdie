# 261117 · S1E01 R7 verification boundaries

This revision continues PR #4 and the existing Site. Its source uses causal 3D sequences alongside the previous archival evidence and the unchanged 384.411333-second narration. No R6 runtime pass is promoted to an R7 pass.

## Observed and corrected

The managed Chromium preview could not create WebGL2. The following observations therefore concern the actual CPU-3D compatibility renderer, not the normal GPU path:

- The empty PC slot and room appeared. During forward playback, factory carts advanced through arrival and return views; the subsequent empty hall retained its equipment.
- At 198.62 seconds the PC connector was inspected. A prior version reported installation while leaving its gold fingers visibly above the opening. The card was lowered by 19 mm and checked again with its fingers inside the connector. The bounded source test also checks actual finger world bounds, not just a boolean state.
- The desk pen had obscured the notebook and behaved like an unsupported animated prop. It now rests alongside the notebook. The design insert was reframed around the drawing and board rather than empty tabletop.
- At 284.8 seconds the lab showed separate specimens during exchange. The original bridged specimen leaves intact; a second specimen is brought in. The probe is not touching while the specimens move.
- At approximately 289.7 seconds an audio error appeared during seeking. The old UI did not expose its underlying error code, so an HTTP Range/route issue is only a possible cause, not a diagnosis.

The player was then changed to fetch the complete MP3, check its byte count and SHA-256 when WebCrypto is available, and load it through a local Blob. Error messages now include the media error category. **This final correction has not been replayed in a browser.** The browser subsequently rejected reloading under its security policy. That stop was respected; no alternate tab, browser, raw protocol or indirect route was used to evade it.

The saved JPEG `review/r7/contact-preview.jpg` in the Sites source is an actual browser observation at 198.62 seconds, before the final audio-loader and persistent PC-date-footer changes. It is not a frame from the exact final artifact or a GPU render.

## Executable checks

`qa-cinematic-r7.mjs` runs the actual scene factories, pinned Three.js r170 and shot plan in Node with NAPI Canvas for authored texture creation. Its 11 contracts passed:

- 83 shots cover 0–384.411333 seconds with no timeline gaps or overlaps; 45 are spatial shots. These counts are inventory, not visual-quality evidence.
- 16 shared event clocks continue across 25 camera seams and nine sentence seams. Ending shots do not restart card insertion.
- 225 sampled spatial states are finite; reverse, interleaved and fresh-construction comparisons agree in 675 cases.
- 2,002 inspection samples preserve counts: the initial illustration has two working / four hold; the later illustration has six working / zero hold. These are not historical yields.
- 1,001 specimen-swap samples have no probe contact while moving; the initial specimen's bridge remains intact.
- 1,001 PC insertion samples preserve the alignment of 24 actual gold fingers inside the authored slot envelope, monotonic 0.31 m travel and power-on after seating. This is not a complete mesh-collision certification.
- Hidden desk state restores consistently after unrelated seeks. Input source hashes were unchanged during that test run.

`qa-cinematic-runtime.mjs` separately exercises production player logic with mock DOM/media/renderer objects and audits the delivered module graph and asset bytes. **38/38 contracts passed**, including complete fetch/SHA/Blob, HTTP/network/truncation/hash failures, explicit retry, play cancellation, paused restoration, mock fullscreen and the exact final 11-module/17-image delivery graph. It does not establish actual browser decoding, playback, rendering or audio perception. Results are retained in `qa-r7-runtime.json`. If WebCrypto is unavailable the player explicitly reports an unverified full-length load; that branch is not recorded as SHA success.

Eight final frames were also rendered from the exact production `cinematic-director.mjs` in Node/NAPI software mode at 2, 105.6, 113, 198.62, 199.6, 284.8, 335 and 382 seconds. The final presentation canvas is 1600×900 with the actual CPU raster capped at 800×450. None was blank or fully occluded. The seated-card / unpowered state at 198.62 changes to a lit display at 199.6; separate specimens and raised probe are visible at 284.8. At 335 the incoming cart is outside the wide framing while the installed equipment is visible; this frame alone is not evidence of an arrival action. Small trolley lettering is difficult to read at the CPU resolution. Fourteen input hashes were stable across rendering, and the eight images were byte-identical on a second render. This is a selected CPU-frame check, **not a browser, GPU, motion or artistic pass**. Images and the exact inspection report are retained under `review/r7` in the Sites source.

Repository validation covers the local schema, artifact links and workflow tests. An initial catalog check caught the then-missing link to this verification document; the final run follows document creation. No whole-product CI or unrelated repository workflows are required by this content revision.

## Not yet verified

- Final R7 browser playback after the audio-loading correction, including seek/retry, audio sync and natural ending.
- Actual WebGL2 image quality, material response, shadow artifacts, performance and mobile memory use.
- iPad/iPhone/Safari and real touch interaction.
- Complete human listening and pronunciation/translation assessment. R6's existing narration/ASR caveats remain.
- Independent full-film historical, editorial, viewer and audiovisual release approval.
- Whether the revised staging is genuinely enjoyable or has the production quality the director requested.

Native Sites **version 4** deployed successfully on 2026-11-17. Source commit: `c9fd70c3afbe2a735fab879c3f81ae730fa8331d`; deployment: `appgdep_6afcb0da25808191bf0d5ef5254b542e`. The standalone is 20,258,871 bytes, SHA-256 `e47164cbda0ee80dd045e61e1b0c15e6908e3c0b2d370d6763815a498a95190f`. These are publication and byte-identity observations, not a post-deployment browser pass.

Native Sites publication proves deployment of a version, not any of the above. The work remains **IN_REVIEW, not READY/DONE**. No YouTube upload, MP4 export, audience change or next episode is claimed.
