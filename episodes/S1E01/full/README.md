# 261117 · S1E01 — Someone else's chip

**The complete 8:54 English-narrated 3D documentary is deployed for private review:**

[Watch S1E01 on Sites](https://chip-in-birdie-s1e01-261117.reliqbit.chatgpt.site)

This is `S1E01-full-r4`, continuing [PR #4](https://github.com/ReliOptic/Chip-in-Birdie/pull/4). It is the same full episode, not a new teaser, a slate reset or a report in place of the work. Korean and English captions, chapter navigation, transcript seeking and passage-specific sources are included. Sites may ask the owner to sign in with ChatGPT. The site remains owner-only; no public audience or YouTube release has been created.

## The film

A new factory cannot live on a promise alone. In 1987, TSMC started a business that would depend on other people's chip designs. Would enough customers entrust it with their products—and their next products?

One fictional L-shaped customer layout connects the opening to the ending. The story follows the proposed customers, the capital and resources assembled around the company, its noncompetition boundary, the manufacturing work required behind that promise, and evidence of longer customer commitments. It ends with the customer's next design and the foundry preparing to manufacture it.

| Passage | What the picture now explains |
| --- | --- |
| 00:00 · A factory needs a customer | A layout close-up pulls back to a factory and empty customer places. The customer's original design stays on its side of the boundary. |
| 00:52 · Taiwan, 1985 | Chang's retrospective account is distinguished from a historical reconstruction or a proven ready-made market. |
| 01:56 · An expensive bet | Readable capital proportions and joined resources give the initial promise physical stakes. |
| 02:56 · A boundary around competition | The manufacturer's own competing-product route closes; this does not imply unlimited capacity or an absence of all conflicts. |
| 03:38 · Not a universal printer | A spacing violation and mismatched layer registration become visible engineering conditions. |
| 04:32 · The design becomes physical | Resist development, exposed-metal removal and stripping change actual geometry. The original PR #4 fab is retained. |
| 05:36 · A wafer is not the result | Probe tips meet pads; failed results are marked with crosses as well as color. |
| 06:21 · From spare capacity to commitment | Customer lots arrive at previously empty equipment. Contracts and attributed customer visits connect this to the opening question. |
| 07:32 · The risk changes owners | Three customers share one loadlock: a physical queue exposes finite capacity. |
| 08:14 · The customer's next product | The original layout is visible in an open package; a new design enters the manufacturing relationship. |

The capital proportions derive from cited records. Layouts, process cross-sections, the queue and factory models are explanatory illustrations, not customer designs, actual allocation data, an electrically simulated circuit, or a reconstruction of the 1987 fab. Sources and limitations remain available beside the film.

## What changed from r3

- Reframed the beginning around uncertain customer demand and gave it a concrete ending, rather than an abstract statement of manufacturing responsibility.
- Added macro, overhead, wide and detail compositions tied to particular actions. Tiny document textures no longer carry the essential historical explanation.
- Made process changes, probe contact and capacity competition legible in geometry; fixed the shot that previously showed orders withdrawing while narration described growth.
- Standardized the main Korean identity reference, separated founding history from process explanation and narrowed manufacturing-service wording to avoid implying total product liability.
- Rebuilt the actual English voice and caption timeline: **12,819,344 samples / 24 kHz = 534.139333 seconds**, 61 utterances, ten chapters, 41 named shots and 44 phase beats.
- Replaced generic cue timing with 22 restrained action-linked sound cues. Buffering stops SFX and resumes it from the narration clock; unmuting cannot restart effects alone during a stall.
- Added an explicitly labeled CPU 3D compatibility renderer for browsers where WebGL initialization fails. It rasterizes the actual geometry and camera; it is not equivalent to the primary WebGL/PBR renderer.
- Built a normal relative-asset Sites version, with a 123 KB HTML entry instead of a 16 MB base64 entry. Local Three.js, GLB and MP3 dependencies are included; no runtime CDN is required.

## Reproduction

The repo contains authored source and verification records. The private Sites source repository contains the deployed runtime and its assets. Raw models and audio are not added to this public source repository. Exact asset and deployment provenance is in [media-bundle.json](media-bundle.json).

Using recovered PR #4 assets and the **full-r4** audio directory:

```bash
node episodes/S1E01/full/build.mjs \
  --assets "$S1E01_ASSETS" \
  --audio "$S1E01_AUDIO_R4" \
  --out "$S1E01_OUTPUT" \
  --site "$S1E01_SITE_OUTPUT"

node --experimental-vm-modules episodes/S1E01/full/qa-contract.mjs \
  --bundle "$S1E01_OUTPUT/S1E01-full-documentary.html"

node --experimental-vm-modules episodes/S1E01/full/qa-site.mjs \
  "$S1E01_SITE_OUTPUT"
```

See [audio-env.md](audio-env.md) for local voice regeneration. The build rejects a smoke test, stale script/audio hashes and inconsistent PCM timing. Carry [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) and [rights.md](rights.md) with redistributed work.

## Verification and approval

[verification-r4.md](verification-r4.md) distinguishes actual browser observations, Node geometry/raster checks, isolated contract tests and remaining release checks. [review-r4.md](review-r4.md) records scoped reader/runtime feedback and the exact revisions rechecked. Earlier r3 reports remain historical, not evidence for this revision.

**Private deployment is complete; independent full audiovisual release approval is not.** A generated voice, test pass or live URL does not establish enjoyable viewing, pronunciation quality or release readiness. No MP4 was requested/exported, no YouTube upload occurred and no next episode was started. The repository's finished-episode count remains unchanged.
