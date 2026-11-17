# 261117 · S1E01 — NVIDIA needed chips. TSMC needed customers.

[Watch the existing Site](https://chip-in-birdie-s1e01-261117.reliqbit.chatgpt.site)

**R6 continues the same full S1E01 and [PR #4](https://github.com/ReliOptic/Chip-in-Birdie/pull/4).** It is an archive-led documentary: 6:24.411 of measured English narration, Korean / English / off captions, 66 authored shots and six chapters. Earlier 3D revisions remain historical; their rotating worlds are not imported by this player.

## The story

NVIDIA had a product people wanted, but manufacturing constrained what it could ship. Its 1998 filing is the opening evidence. The film rewinds to the 1980s: why would someone build a manufacturing company for customers who either already had their own factories or barely existed yet?

The viewer follows the risk on both sides: financing a product without financing a fab; funding the manufacturer; surviving customers' temporary overflow orders; making good chips rather than merely buying wafers; and committing manufacturing capacity against uncertain forecasts. The definition of foundry/fabless is not the film's destination.

| Start | Chapter | Main visual evidence / action |
| --- | --- | --- |
| 00:00 | A hit. Not enough chips. | Huang, RIVA 128, actual ST/NVIDIA package markings and NVIDIA's S-1 |
| 00:42 | 1985: a dangerous business | Intel's DRAM exit, dated factory context, Taiwan locator and Chang |
| 01:44 | Customers that barely existed | Customer demand risk, initial backers and ITRI's technology/personnel transfer |
| 02:55 | A place inside the PC | Preserved IBM PC, actual expansion slots, graphics boards and the 1998 production relationship |
| 04:00 | What the contract could not fix | Wafer payment, illustrative yield/design-process mechanisms and documented customer pilot work |
| 05:11 | Whose future fills the factory? | A later Chang–Huang forecasting anecdote, investment risk and the joint 2006 milestone |

## Picture and evidence boundaries

Sixteen distinct photographic assets appear; seventeen are packaged and credited, with the unused Intel 8088 image retained in the asset register. Portraits, period objects, photographs, documents and limited explanatory graphics have different jobs and compositions. Crops reveal real markings and expansion slots. There are no repeating 3D camera orbits in the active cut.

- Product dates are not photo dates. Modern portraits/buildings are dated; the 1989 factory photograph is Erfurt, East Germany, not TSMC or Taiwan.
- Both photographed RIVA packages carry ST marks. Neither is passed off as a proven TSMC-made unit.
- Documentary pages are labeled source summaries or short typeset excerpts, not scans or facsimiles of original contracts.
- The illustrative bridge/correction animation is not a diagnosis of NVIDIA's 1997 production problem. No invented defect yield is presented as measured.
- Huang's black-book account is a later visit recalled in 2007, not footage or a record of the first 1997 meeting.
- The 2006 joint total is 500 million processors, not 500 million GPUs. It includes GeForce GPUs and nForce media and communications processors.
- Creator, source, license, dates, modifications and limits travel in the film's Sources & credits and [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt).

[Direction](direction-r6.md) · [Claims](claims.json) · [Primary sources](sources.json) · [Archive register](archive-manifest.json) · [Audio report](audio-r6-report.json) · [Verification](verification-r6.md) · [Exact deployed bundle](media-bundle.json)

## Reproduce

Use the exact archived image bytes described by the manifest and matching full-r6 narration. The build rejects stale script hashes, mismatched text/timings and inconsistent PCM duration.

```bash
node episodes/S1E01/full/build.mjs \
  --archive /path/to/archive --audio /path/to/audio/full-r6 \
  --out /path/to/output --site /path/to/site/dist

node --experimental-vm-modules episodes/S1E01/full/qa-archive-runtime.mjs \
  --archive /path/to/archive \
  --bundle /path/to/output/S1E01-full-documentary.html \
  --site /path/to/site/dist
```

The production player needs Canvas 2D, not WebGL. It includes pause, seek, restart, paused restoration, mute, transcript, passage-specific evidence, image-loading recovery and a CSS cinema view if native fullscreen is unavailable. Captions have a separate area and do not cover the image's source labels.

Raw photographs and audio are kept in the authorized Sites source, not duplicated in this GitHub repository. A matching single-file HTML is downloadable from the Site.

## Review and publication

The user's latest direction replaces the all-3D treatment with an archive-led film. The current Site access record is public (revision 2); this work preserves that setting and does not change the audience. Site publication is not YouTube publication.

Earlier R3–R5 validation reports and immutable deliveries apply only to those revisions. R6's final checks and exact delivery are recorded separately. A successful build, natural playback end or repeatable rendering does not establish enjoyable viewing, perfect pronunciation, mobile Safari performance or independent audiovisual release approval. No READY/DONE or YouTube PUBLISHED claim is implied.
