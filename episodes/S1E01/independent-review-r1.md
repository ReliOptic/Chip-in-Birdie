# S1E01 production review — draft assets

Reviewer: `/root/slate_review`, actual model `gpt-6.1-sol`, separate reviewer session. Date: 2026-11-14 Asia/Seoul. Scope: script/editorial and observed still-image/scene-code issues before full documentary expansion. **CHANGES_REQUESTED, draft only.** This is not a release review.

## Artifacts actually inspected

Read `/workspace/work/chip/episodes/S1E01/script.en.txt`, `facts.md`, `hero.py`, `production.md` and `player.html`. Viewed the actual image files `/workspace/work/media/S1E01/hero-still.png` (r1), `/workspace/work/media/S1E01/web/scene-3.png`, then `/workspace/work/media/S1E01/hero-still-r2.png` when it appeared. No video playback or audio listening was performed in this review. No reference-channel video was inspected by this reviewer. Findings about motion are derived from the authored code, not claimed playback observation.

## Script/editorial changes before full expansion

1. **A historical documentary needs a verified decision and consequence, not only a business-model explanation.** `script.en.txt:7` names Chang and 1987, but the remainder uses an explicitly hypothetical team and qualitative arguments. The script does not yet stage a sourced historical situation, obstacle, actual choice and resulting change. The current draft is 1,029 whitespace-separated words; expanding this explanation to 8–9 minutes without a concrete event risks padding. Recover at least one primary historical account that establishes what Chang or an early customer faced, what alternatives were available, and what changed after an actual decision. Keep invented dialogue out. Give the decision a visible action and a before/after condition, while leaving RCA learning and the later IBM premise to their assigned episodes.

2. **Repeated payoff weakens progression.** Lines 25–39 restate coordination, specialization, interdependence, the competition boundary and the finished device. The same central insight lands several times without new evidence or changed stakes. Combine these into one limitation beat followed by one decisive return to the opening object. Reassign the recovered time to the verified historical event or a physically demonstrable process constraint. The mechanism at lines 21–23 should alter a choice, not become a tour of a generic fab.

3. **The through-object promise currently disagrees with the opening.** `production.md` calls one wafer the through-object and line 35 says “Our opening wafer,” but the spoken opening presents a ready design, not a wafer. If a finished wafer appears immediately, distinguish it from the unmanufactured design so the causal sequence remains legible. Prefer one recognizable customer layout or test die carried from design, through compatibility/production constraints, to returned usable output. Do not visually imply that a finished wafer precedes the manufacturing decision.

4. **Separate current corporate statements from founding-era facts.** Line 7 attaches establishment in 1987 and Hsinchu headquarters in one sentence. The ledger cites a modern annual report; it does not yet establish that every current fact is a contemporaneous 1987 condition. Phrase separately (“Established in 1987. Today…”) unless a founding-era source verifies the location. The report's declared noncompetition policy supports an attributed principle, not the independent causal claim at line 39 that this boundary caused fabless companies' growth. Keep that causal conclusion explicitly interpretive or add historical evidence.

5. **Avoid implied reconstructed speech.** Line 5's “We will manufacture… We will not sell…” is an effective proposition but could sound like quoted Chang dialogue when spoken over a person. Introduce it as a paraphrase of the model, or retain a narrator viewpoint. It is not a sourced historical utterance.

6. **Fact ledger is still aggregate, not claim-addressable.** `facts.md:3–7` bundles history, present policy and mechanisms under broad page ranges. Assign claim IDs tied to script paragraphs, exact source pages/sections and factual versus inferential classification. The final status still says SECOND_TECHNICAL_SOURCE_REQUIRED although line 5 records a second source already read; update to the actual remaining need (independent review plus source support for testing/yield and historical decision). No independent source verification was performed by this reviewer.

## Observed image/physical changes before expansion

1. **ENV/CAM — TSMC identity is outside the usable frame.** In r2 and `web/scene-3.png`, the top of the white identity sign is cropped so the viewer sees “TAIWAN / HSINCHU” but not the `tsmc` word above it. The image otherwise shows an anonymous machine bay. Lower/reframe the sign into the safe frame or use a separate establishing composition with a sourced, recognizable Taiwan/Hsinchu/TSMC context. A tiny plaque alone should not carry the whole episode's location and institutional identity.

2. **SHD/POST — web and Cycles surfaces materially disagree.** In r2 Cycles the hero wafer is a noisy copper/bronze reflective disk; in `web/scene-3.png` the hero and stacked wafers are bright, almost white disks with little silicon or patterned-die identity. `hero.py:61–62` uses a procedural noise/ramp that the GLB material does not reproduce, and the player changes a material by an assumed exported name. Bake or recreate the material deliberately for the playback renderer; inspect that renderer's stills. Make etched die streets legible without turning every wafer into a uniform gold grid. Fix clipped white highlights and balance the key/environment before adding effects. A Cycles still alone cannot validate the delivered HTML look.

3. **ENV/physical scale — r1 oversized wafer was partially corrected.** R1's wafer extends far beyond the cassette width; r2's reduced wafer now roughly matches the stored disks. This is an observed improvement, not a complete physical pass. Document a consistent carrier/wafer scale and verify the wafer edge clears slots throughout the move; the present stills do not show contact/clearance across the entire path. Include a wafer orientation notch if this contemporary illustrative wafer type calls for it.

4. **MOT/physical support — wrist has no visible support and transfer has no handoff.** `hero.py:74–81` moves blade, wafer and wrist together along a single axis. There is no modeled rail or linked arm supporting the wrist, and no separate wafer deposit, release or blade withdrawal. In the viewed stills the cylindrical wrist appears suspended before the cassette. Connect the wrist to a physically plausible support, complete an approach/align/deposit/retract cycle, and animate wafer motion separately after contact. Avoid representing a cassette as accepting a wafer through solid rails or a closed process door.

5. **CAM/MOT — authored camera does not yet reveal a consequence.** The code provides a modest push toward a wafer that moves with its support. This can serve as a brief insert; it does not by itself demonstrate the design/factory conflict or the foundry promise. Give the shot a visible task completion that makes the cut necessary, then cut to the decision-bearing action. Do not extend six seconds of wafer travel into the full episode's repeated visual vocabulary.

6. **POST — current still noise is conspicuous.** Both Cycles stills show dense render grain over flat panels and the wafer (`hero.py` sets 48 samples and disables denoising). Raise effective quality or use a conservative denoise pass with a checked close crop; preserve etched detail and contact shadows. Also retain foreground/midground/background separation in the actual HTML renderer, which currently looks flatter and lacks the Cycles focus treatment. Triangle/prop counts do not resolve these visible issues.

## What is working and can be retained

The explicit reconstruction labels correctly avoid presenting this as footage of TSMC's actual line or an archival 1987 factory. The script qualifies the company's own policy and acknowledges that the promise does not remove every commercial conflict. The cassette slots, load-port housing, material contrasts and contact shadows establish an authored manufacturing space beyond a text slide. R2 reduces the r1 scale mismatch. Preserve these elements while fixing the concrete failures above.

## Next bounded verification

After local corrections, inspect one still and a 5–10 second actual playback of the completed physical handoff in the delivered renderer; seek to approach, contact, release and withdrawal. Compare the same frames between renderer and exported code. Separately listen to the real English VO for name pronunciation, breathing, emphasis and phrasing, then drive cuts from the actual timings. This review provides no listening claim, no inference of audio quality from transcription, and no approval of the scene or full episode as complete. Finished episode count remains **0**.

## Artifact identities at initial read

- script.en.txt SHA-256: `2510a4e5ba2cf489f9340886b60f749f8a27443f713b215601ec862b739b5ed1`
- facts.md SHA-256: `1143382a69fc7d66ce1885a32e9a692ef81aa555e44f87465d21007a8b68fea7`
- hero.py SHA-256: `8dc420cfb925e90e7010006b6b22c43e6bf91acadfae16058d85ebc9c21a4b04`
- hero-still.png SHA-256: `24a5a0868ae5ab1b69d381772ab798185bd0d0ca24fafcb6625853e8581c83e3`
- web/scene-3.png SHA-256: `db926471c07af07204da1ed5f89532db6d614422030d66d64e2cf91c8a0ddf53`

These files were in active production; later changes need their own focused recheck.
