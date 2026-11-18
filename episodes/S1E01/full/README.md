# 261118 · S1E01 — Inside the factory a chip designer doesn't own

[Watch the existing Site](https://chip-in-birdie-s1e01-261117.reliqbit.chatgpt.site) · [PR #4](https://github.com/ReliOptic/Chip-in-Birdie/pull/4)

R8 continues the same full episode. Its measured English narration is **7:57.357**, with 45 passages, six chapters and Korean / English / off captions. The picture is newly authored: 36 spatial shots, 27 reporting shots and two dated photographs. R1–R7 scenes and photo compositions are not in the active R8 import graph. Earlier deliveries remain in history.

The question is not “what is fabless?” It is: **what does a design company gain by accessing a specialist manufacturer, and why can neither company turn an order into working chips alone?**

## Picture and argument

| Passage | New picture | What it establishes |
| --- | --- | --- |
| 00:00–01:00 | An idle tool, a long cleanroom hall, a dated research-lab photograph, cleanroom/subfab section and ceiling transport | Empty equipment is not automatically usable capacity; the room and services are part of production |
| 01:00–02:15 | OHT stop/lower/support/release, loadport docking, EFEM cutaways, supported wafer handling and selected surface operations | Transportation supplies the process; it cannot replace processing or qualification |
| 02:15–03:25 | Tool eligibility, queues, cycle time versus throughput, construction evidence and readiness milestones | Capacity depends on the product's usable routes, not simply a building or equipment count |
| 03:25–05:06 | Metrology, design/printed-shape comparison, a qualitative process envelope, eFoundry's public collaboration categories | Product and process engineering continue across the company boundary |
| 05:06–06:44 | Dated TSMC company/report summaries, customer commitments and NVIDIA's 1998 risk disclosure | Foundry access reduces the need to own a manufacturing organization; it does not remove yield, payment or delivery risk |
| 06:44–07:57 | Supported package assembly, outgoing material, a different final hall view and a commissioned exterior | Ask what a new fab can make, at what quality, and when the output can actually ship |

The definition of foundry/fabless occupies one passage, roughly ten seconds. The historical document screens are attributed summaries, not fabricated scans. Their internal reveals follow the argument, not decorative movement.

## Sources, footage and rights

[Fab/video research](R8_FAB_EVIDENCE.md) · [45 passage claims](claims.json) · [19 primary-source entries](sources.json) · [New image rights](archive-manifest-r8.json)

- TSMC's official corporate video was sampled at five decoded timestamps to study cleanroom depth, overhead transport and supported wafer handling. The complete hoist transfer cycle was not observed in those samples.
- FOUP/loadport dimensions and functional order use public manufacturer material. Intel's public fab tour supports the cleanroom-to-subfab airflow explanation.
- Original 3D scenes are explanatory reconstructions. They are not footage or surveyed CAD of a named fab, confidential production status, a certified digital twin or a calibrated process simulation. Internal cutaways deliberately omit obscuring housings and identify that omission.
- Both new photographs are CC BY 2.0 and appear once: UCL's research photolithography lab (2013), and Intel D1X under construction (2011). Neither is labelled as a current TSMC production fab.
- TSMC/Daifuku reference video frames are research-only; they are not redistributed in the film.
- The NVIDIA claim is dated to its S-1 filed 6 March 1998. Its initial wafer-payment terms are not presented as today's universal foundry contract.
- Process layers are enlarged. A measurement does not heal a defective specimen, and a process change is not animated as automatic successful recovery.

## Implementation

The active R8 modules are `fab-director-r8.mjs`, `fab-shotplan-r8.mjs`, `fab-hardware-r8.mjs`, `fab-hall-r8.mjs`, `fab-process-r8.mjs`, `fab-facility-r8.mjs`, `fab-editorial-r8.mjs`, the retained `software-renderer.mjs` and `film.mjs`.

Shared event clocks carry the OHT/loadport/EFEM actions across cuts. Poses and reporting graphics are functions of time, so backward seeking restores state. Contact, aperture clearance and camera-framing tests are distinct: a mathematically valid camera can still show the wrong thing, so selected actual browser frames are reviewed separately.

The player retains play/pause, arbitrary seek, restart, paused restoration, mute, transcript, passage-specific evidence, retry states and fullscreen/Cinema view. The centre play button no longer obscures a paused mid-film frame. Narration is fully fetched and hash-checked where WebCrypto is available before playback. No runtime CDN or paid service is required.

## Reproduce

Use the two source JPEGs listed in `archive-manifest-r8.json`, matching full-r8 narration/timeline and the pinned Three.js r170 module. The exact media and standalone HTML are kept in the authorized Sites source, not duplicated in GitHub.

```bash
node episodes/S1E01/full/build.mjs \
  --archive /path/to/r8/archive --audio /path/to/r8/audio \
  --three /path/to/vendor/three.module.js \
  --out /path/to/output --site /path/to/site/dist

node episodes/S1E01/full/qa-fab-edit-r8.mjs \
  --three /path/to/vendor/three.module.js \
  --timeline /path/to/r8/audio/timeline.json \
  --assets /path/to/r8/archive

node --experimental-vm-modules episodes/S1E01/full/qa-player-r8.mjs \
  --archive /path/to/r8/archive \
  --bundle /path/to/output/S1E01-full-documentary.html \
  --site /path/to/site/dist --timeline /path/to/r8/audio/timeline.json
```

## Verification and publication are different

See [R8 verification](verification-r8.md), [integration contract results](qa-fab-edit-r8.json), [player mock results](qa-player-r8-results.json), [actual browser observations](qa-browser-r8.json) and [exact media/deployment identifiers](media-bundle.json).

WebGL2 is the preferred renderer. The managed review browser exposed no WebGL2 context, so its observed frames and playback use the lower-detail CPU compatibility renderer; they are **not GPU/PBR, mobile Safari or touch-device certification**. Source/geometry tests and a successful deployment do not prove the film is enjoyable. Full independent viewing/listening and the user's artistic acceptance remain separate. Task status is **IN_REVIEW, not READY or DONE**. No YouTube upload or audience-permission change is part of R8.
