# 261117 · S1E01 — Who pays for the factory?

[Watch the existing private Site](https://chip-in-birdie-s1e01-261117.reliqbit.chatgpt.site)

**R5 is the same full S1E01, rebuilt around the business exchange.** It continues [PR #4](https://github.com/ReliOptic/Chip-in-Birdie/pull/4), with 6:37.540 of actual English narration and Korean / English captions. The precise deployment revision is recorded in [media-bundle.json](media-bundle.json). The Site stays owner-private.

## What the film now asks

A chip company no longer has to finance its own factory. What does it gain, what does the manufacturer gain, and what commitments can the customer still owe?

The definition takes approximately five seconds. A real customer contract appears at 00:11. The subsequent chapters add a different decision, rather than extending that definition with a long fabrication tour.

| Start | Business consequence | Picture |
| --- | --- | --- |
| 00:00 | Production access can be bought separately from ownership | Factory-ownership invoice leaves; a production order remains beside the product |
| 00:20 | Product risk need not also require factory financing; costs and exceptions remain | Product plan and cutaway construction, residual cost receipts, make-or-buy choice |
| 01:04 | Someone must capitalize the manufacturer | Approximate $220m starting investment; proportional 48/27/25 foundations; 98 transferred professionals |
| 01:59 | Compatible customers can fill common assets, but downturns and transient overflow remain | Mechanical booking board, fixed-capacity spine, incompatible key, withdrawing orders |
| 03:15 | A manufacturer need not become its customer's product rival | Shipment counter and withdrawn own-product catalogue; commercial controls remain |
| 03:57 | A higher production quote can buy a lower usable-chip cost | Brief preserved PR #4 fab handoff, then independent A/B production trays |
| 04:40 | Supply access can retain capital and unused-capacity obligations | Cirrus filing, future advance schedule, seven bought / two resold / one unsold illustrative units |
| 05:55 | Product and manufacturing businesses have complementary—not identical—returns and risks | Distinct audio, graphics and network objects, launches and remaining exposures |

### The numerical decision

An explicitly invented teaching comparison uses A: cost 100 / 60 usable chips and B: cost 120 / 90 usable chips. B has a 20% higher processing quote but a 20% lower processing cost per usable chip: 1.67 versus 1.33. These are not TSMC prices or yields; test, packaging and other differences are excluded. The two runs retain separate die identities.

The Cirrus contract is a different kind of evidence: an actual FY1997 filing. The film distinguishes the future $118m advance commitment, its incomplete renegotiation, and the shortfall clauses in the FY1993/FY1996 agreements. It does not claim that the $118m was already paid, that a penalty was actually incurred, or that Cirrus was a pure fabless company.

## What changed from R4

- Removed the repeated L-shaped circuit/wafer motif and the long layout / lithography / probing tour from the active edit. The old source remains in Git history and the repository; it is no longer imported by the player.
- Eight new scene worlds carry different physical actions. Only the brief original fab handoff remains in the active film.
- Reduced 8:54.139 to **6:37.540** through rewriting and removing repeated argument, not merely speeding playback.
- Replaced blanket headlines with brief object-led labels, stronger chapter entrances and numeric inserts.
- Rebuilt the actual narration: **9,540,960 samples at 24 kHz**, 40 measured utterances, eight chapters. No estimated word timings are presented as alignment.
- Preserved pause, seek, restart, restoration, language selection, passage evidence, buffering recovery and an explicitly labeled CPU compatibility path.

## Reproduce

Use the recovered original GLB / exact Three.js r170 assets and the matching full-r5 audio:

```bash
node episodes/S1E01/full/build.mjs \
  --assets /path/to/assets --audio /path/to/audio/full-r5 \
  --out /path/to/output --site /path/to/site/dist

node --experimental-vm-modules episodes/S1E01/full/qa-contract.mjs \
  --bundle /path/to/output/S1E01-full-documentary.html
node --experimental-vm-modules episodes/S1E01/full/qa-site.mjs /path/to/site/dist
node episodes/S1E01/full/qa-worlds-r5.mjs \
  --assets /path/to/assets --out /path/to/world-results.json
```

The build rejects stale script/audio hashes and inconsistent PCM timing. Raw media lives in the private Site source, not the public GitHub repository. The single-file HTML is also built for archival use.

## Evidence and approval boundary

See [direction-r5.md](direction-r5.md), [verification-r5.md](verification-r5.md), [claims.json](claims.json) and [sources.json](sources.json). R3/R4 reports remain historical and do not certify R5.

A live Site, deterministic scene test or decoded voice does not prove enjoyable viewing or pronunciation quality. Independent full audiovisual release approval remains separate. No public audience change, YouTube release, MP4 export or next episode is included.
