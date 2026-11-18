# 261118 · S1E01 R8 verification boundaries

**IN_REVIEW. Sites version 5 deployed. Final CPU-browser continuous playback and production smoke check observed. No independent release approval.**

This continues the full S1E01 and PR #4, not a separate factory-tour demo: **477.357333 seconds, 45 English-master/Korean-subtitle passages, six chapters, 65 shots—36 spatial, 27 reporting and two photographs**. Inventory is not evidence of cinematic quality or engagement.

## Viewer takeaway and evidence boundaries

The question is what a designer gains from a foundry, and why neither company can turn an order into working chips alone. Physical manufacturing is connected to product-specific qualification, process stability and customer coordination. The intended payoff is a way to read a fab-expansion headline: **which products can it make, at what quality, and from when can it deliver?** Buildings, installed tools and qualified production are distinct milestones. Integrated manufacturing remains a valid alternative; specialization is not hands-off manufacturing or universally superior.

- The fab is a new explanatory reconstruction, not footage or a surveyed model of a named TSMC factory, customer status or the 1997 incident. Event clocks preserve one action across cuts; prior R1–R7 scene modules/archive compositions are not active R8 shot sources.
- Sampled official TSMC 2026 video informed aisle scale, overhead tracks and yellow-lit areas. Those samples did **not** show a complete carrier-to-wafer handoff. Daifuku's inspected film was manufacturer **CG**, not live factory footage. Neither film's frames are distributed.
- Muratec transport descriptions, TDK load-port documents, Entegris carrier dimensions and Intel's airflow/subfab explanation inform mechanisms and spaces. They do not certify this model. Process sections are enlarged/simplified, not actual recipes or an EUV optical model. Geometry checks are not complete collision/physics certification.
- ASML/INFICON/TSMC primary sources support process and coordination claims. TSMC's 1997 annual report and NVIDIA's 6 March 1998 S-1 are dated records. December 1997 low yields, filing-time capacity constraint and the initial wafer-price obligation remain distinct; historic contract terms are not generalized. `claims.json` maps 45 passages to 19 sources.
- The two new CC BY 2.0 photographs each appear once: **UCL research lithography laboratory, 2013** and **Intel D1X construction, 2011**. Neither is TSMC production footage. Credits, dates, license links and crop/scale/overlay notices accompany the originals. Licensing is not endorsement; see `archive-manifest-r8.json` and delivered notices.

## Checks and observations

| Evidence | Result and limit |
|---|---|
| `qa-fab-edit-r8.json` | **2,191/2,191** final-source contracts passed on recorded source/timeline/geometry/Canvas hashes. The final rail/contact correction is included. Not GPU or viewing approval. |
| `r8-contact-evidence/fab-r8-geometry.json` | **5,749** geometry/contact checks passed. All 100 wafer/shelf pairs have actual overlapping contact surfaces; all 100 shelf/housing pairs are attached. 900 probe locations/1,800 actual mesh rays test housing attachment. Sampled OHT routes retain zero detected intersections. Scoped checks, not a complete physics certification. |
| `qa-player-r8-results.json` | **40/40** final exact-delivery checks passed, `changedSources: []`. Earlier credit-notice mismatch was corrected and the final bundle rebuilt. Mock DOM/media/renderer checks plus actual bytes; not browser or real decoding evidence. |
| Reporting graphics | All 13 previously static shots differ at progress .15/.85; **81** fresh-versus-cross-scene Canvas comparisons match. Three bounded CPU frames inspected. This tests state/seek behavior, not film quality. |
| Audio | 11,456,576 finite PCM samples at 24 kHz; zero clipped samples. Passage boundaries use generated samples. MP3 duration includes codec padding. ASR proxy completed; **human listening and word alignment not performed**. |
| Managed browser | Actual **CPU fallback**, WebGL2 unavailable. Earlier selected views covered hall, airflow/subfab, process, metrology, reporting, packaging and exterior; play/pause/reverse seek, paused restoration, captions and CSS Cinema worked. Final-source selected frames at 32/82.8/86 s show the long hall and corrected wafer/robot mechanism. The final automatic run started at zero, progressed through 51.01/361.8/448.02 s checkpoints and reached natural **07:57 end**, observed at 10:14:30Z. No seek interrupted that run. This is transport/progression evidence, not every-frame human scrutiny or listening. |
| Production URL | R8/07:57 ready state, actual forward playback to 28.81 s, pause at 43.92 s, reverse seek to 32 s, Korean captions and Cinema view observed. Production was a smoke check, not a second full run. Screenshot in `verification/S1E01-r8/cleanroom-live.jpg`; full preview end in `verification/S1E01-r8/natural-end-preview.jpg`. |
| Repository | Schema validation, original catalog/proposal lineage/link checks and **33 workflow unit tests passed**. These do not certify factual or cinematic quality. |

The final standalone is **20,043,866 bytes**, SHA-256 `2da3d20c010d89eaf15944731ca4c3184ddb4d57d28a1b3fb3a09129d63c83be`; script `7b87d7d8c0f485291a5caad044ea2befe3b0d070447008c4a0f774370bbc3939`; narration `206332f7712f1be83591eb9e80391ebcbd5298c8eb2def9ea8538bca40e0f5dc`. Sites source commit is `63c4445af5faf07e8100fe45731cfad1a8a0c370`; deployed index SHA is `f3d8f5913d10b5da8746a45b44acd7ce487736b12159aac393453a0495073a7e`. Earlier draft hashes and tests are superseded, not carried forward as final evidence.

## Open gates

GPU quality/performance; iPad/Safari/touch; human English pronunciation and Korean meaning/sync review; independent full-film factual, rights, editorial and viewer QA remain open. Programmatic progression and selected frame inspection are not a claim of uninterrupted human viewing or listening. The producing actor has not approved its own release.

Sites **version 5** was saved from that exact pushed source and deployment `appgdep_6afd791fb52c8191acac56555e88a4b5` succeeded at **2026-11-18T10:08:56.040207+00:00**, at the same [production address](https://chip-in-birdie-s1e01-261117.reliqbit.chatgpt.site). Existing public access revision 2 was preserved. No YouTube upload, MP4 export, audience change, release-ready status or next episode is claimed.
