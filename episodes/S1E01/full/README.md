# 261117 · S1E01 — NVIDIA needed chips. TSMC needed customers.

[Watch the existing Site](https://chip-in-birdie-s1e01-261117.reliqbit.chatgpt.site)

**R7 continues the same full S1E01 and [PR #4](https://github.com/ReliOptic/Chip-in-Birdie/pull/4).** Duration remains **6:24.411**, with measured English narration, Korean / English / off captions and six chapters. R6's archival evidence remains; R7 restores 3D as actions with consequences. This is a revised review candidate, not an assertion of cinematic quality or release approval.

## What now happens on screen

| Passage | Spatial event | Business meaning |
| --- | --- | --- |
| Opening and ending | An unpopulated PC slot / silent screen is later answered by a seated graphics card and operating display | A design becomes useful only when a manufacturable product reaches the customer |
| 01:36–01:56 | External-work carts enter the factory, then leave when the customer takes its work back; equipment remains idle | Temporary overflow orders do not provide dependable factory demand |
| 03:13–03:20 | A board enters the connector, the contacts seat, then the screen powers on | Component businesses obtain a place inside a larger product ecosystem |
| 04:30–05:12 | A probe tests parts; a failed specimen is withdrawn; a separate specimen is inserted and tested; a later batch can proceed | Buying manufacturing capacity does not itself guarantee usable output |
| 05:27–05:40 | Empty capacity gives way to installed equipment, arriving work and loaded carriers | Forecasts must become investment commitments before future orders can ship |
| Final minute | A shipping cart exits, and the operating PC returns as the outcome, not another insertion replay | Design, manufacturing reliability and demand have to meet |

The timing table identifies sequences, not a claim that every moment contains action. Short office and notebook shots provide context. The same action clock continues across camera and narration cuts; seeking backward reconstructs the same state.

The film still starts from NVIDIA's manufacturing constraint, then rewinds to the commercial risk of TSMC's founding. The viewer follows who finances a fab, why a customer with its own factory may withdraw overflow work, why a design business can enter without owning a fab, why wafer purchasing is not a guarantee of good chips, and whose forecasts justify more capacity. A prolonged foundry/fabless definition is not the destination.

## Evidence and reconstruction boundaries

- Photographs, preserved objects and documentary excerpts remain distinct from original 3D illustrations. Seventeen photographic assets are packaged with creator, source, license, date and change notices.
- The generic 1990s PC is not the photographed IBM 5150, an identified RIVA board or footage of a historical assembly. The date is also printed on PC shots.
- Factory layouts, specimen exchange, inspection counts, desk and notebook are illustrative. They are not surveyed TSMC facilities, NVIDIA's diagnosed 1997 defect, historical yields or invented numerical forecasts.
- The broken bridge remains on specimen A while a different specimen B replaces it. A wire does not magically heal while being measured.
- Product era and photograph date remain separate. The Erfurt factory photograph is East Germany; modern portraits/buildings retain their dates.
- Both photographed RIVA packages show ST marks. Neither is represented as a proven TSMC-made unit.
- Typeset documentary pages are summaries or short excerpts, not facsimile contracts. The black-book story is a later visit recalled in 2007, not the first 1997 meeting.
- The 2006 joint milestone is 500 million processors, including GeForce GPUs and nForce media and communications processors, not 500 million GPUs.

[Claims](claims.json) · [Primary sources](sources.json) · [Delivered image register](archive-manifest.json) · [Third-party notices](THIRD_PARTY_NOTICES.txt) · [Audio report](audio-r6-report.json) · [R7 verification](verification-r7.md) · [Exact bundle / deployment](media-bundle.json)

## Reproduce

Use the exact R7 WebP derivatives and matching full-r6 narration. The build checks script/audio hashes, text, sample timing and asset integrity. It includes pinned Three.js r170; it does not fetch a runtime CDN.

```bash
node episodes/S1E01/full/build.mjs \
  --archive /path/to/assets-r7/archive --audio /path/to/audio/full-r6 \
  --three /path/to/vendor/three.module.js \
  --out /path/to/output --site /path/to/site/dist

node episodes/S1E01/full/qa-cinematic-r7.mjs \
  --three /path/to/vendor/three.module.js \
  --timeline /path/to/audio/full-r6/timeline.json \
  --out /path/to/qa-cinematic-r7-contract.json

node --experimental-vm-modules episodes/S1E01/full/qa-cinematic-runtime.mjs \
  --archive /path/to/assets-r7/archive \
  --bundle /path/to/output/S1E01-full-documentary.html \
  --site /path/to/site/dist
```

WebGL2 is used when available. Otherwise the same scene geometry and cameras use the CPU compatibility renderer, whose resolution and material fidelity are lower. Selected browser observations in this revision used CPU mode, **not GPU/PBR validation**.

The player retains pause, seek, restart, paused restoration, mute, transcript, passage-specific evidence, loading recovery and CSS Cinema view when native fullscreen is unavailable. Captions have a separate area. Narration is fetched in full and its SHA-256 checked when WebCrypto is available before a local audio Blob is loaded. That final audio-loading correction has Node control tests, but was not replayed in the browser after the security block.

Original media and the self-contained HTML remain in the authorized Sites source, not this GitHub repository. R7's smaller archive derivatives reduce transfer size without inventing period imagery.

## Review and publication

The latest request retains cinematic 3D storytelling **and** real archival evidence. It does not authorize removing one to avoid implementing the other. Existing public Site access (revision 2) is preserved; no sharing mutation or YouTube upload is part of this work.

Selected browser shots revealed and led to corrections of an unseated card and an obstructing pen. An audio error then occurred during seeking. The complete-download/hash-verification correction was implemented, but the browser subsequently rejected reloading by security policy. No alternate browser or route was used to evade that block.

Full R7 start-to-end playback, final audio listening, final browser audio retry, actual GPU appearance, iPad/iPhone/Safari/touch and independent audiovisual review remain open. R6's earlier full-playback pass is not carried forward as an R7 pass. Geometry counts, passing contracts, a build or a deployed URL do not establish that the film is enjoyable. **IN_REVIEW, not READY or DONE.**
