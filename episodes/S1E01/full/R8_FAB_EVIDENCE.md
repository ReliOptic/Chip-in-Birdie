# 261118 | R8 fab evidence and reconstruction limits

Research actor/session: `/root/r8_fab_research`. Scope: public manufacturer/operator material and two new licensed photographs. This is source research, **not finished-film QA or publication approval**. R7 footage and photographs are not cleared for reuse as R8 shots by this document.

## What was actually inspected

### TSMC — real fab footage, not a CG reference

- Official index: https://pr.tsmc.com/english/gallery-videos
- Public MP4 linked in that page: https://www.tsmc.com/sites/dcom/2026-08/2026_tsmc_corporate_video_en.mp4
- Probed media: H.264, 1920 × 1080, 29.97 fps, 287.189 seconds.
- Method: ffmpeg frame sampling; the frames below were extracted with `-copyts -ss` and their decoded source PTS read from `showinfo`. Each listed still was directly visually inspected. This does **not** mean the complete film or its audio was watched.
- Rights: publicly accessible corporate film; no reuse license verified. These extracted frames are private research references only. They are not in the distributable archive.

| Exact decoded source PTS | Directly visible evidence | Research still |
|---|---|---|
| 64.030633 s / 01:04.031 | Yellow-lit tool aisle; long vanishing point; enclosed equipment fronts with unequal heights, vents, viewing windows and operator terminal; ceiling rail above the aisle. The promotional data overlays are not independently verified manufacturing measurements. | `/tmp/r8_fab_research.OBwUBL/t64.jpg` |
| 147.013533 s / 02:27.014 | Low upward view of multiple OHT vehicles hanging beneath rails; wheel/track zone above the vehicle; central overhead truss/service structure; dense infrastructure, not empty hangar air. | `/tmp/r8_fab_research.OBwUBL/t147.jpg` |
| 151.017533 s / 02:31.018 | Close vehicle fronts with ID labels, small green status displays, recessed panels and slightly rounded housings. This frame does not prove a loadport handoff. | `/tmp/r8_fab_research.OBwUBL/t151.jpg` |
| 156.022533 s / 02:36.023 | Real enclosed wafer-handling mechanism: horizontal wafer, fork-like end-effectors, central rotary mechanism, adjacent stations, cables and guides. Model identity and complete motion cycle not established. | `/tmp/r8_fab_research.OBwUBL/t156.jpg` |
| 159.025533 s / 02:39.026 | Closer horizontal-wafer handling view with hard mechanical supports beneath the wafer; no evidence for free-floating or flipping wafers. Exact grasp/contact design is not resolved. | `/tmp/r8_fab_research.OBwUBL/t159.jpg` |

Additional inspected contact sheets: `tsmc_cleanroom_review.png` (samples over 55–71 s), `tsmc_tool_review.png` (136–152 s), `tsmc_transfer_review.png` (150–166 s), all under the same `/tmp/r8_fab_research.OBwUBL/` directory. Contact-sheet labels are resampled times and can differ by roughly half a sampling interval; use the decoded PTS above for exact citations, not the montage label.

### Daifuku — manufacturer animation, explicitly not real factory footage

- Official page: https://www.daifuku.com/pro/cr/
- Public film: https://pro.suzhou-dsa.com/daifukuquality/CR_EUV_201029_4MB.mp4 (283.884 s, 1920 × 1080).
- Second public film: https://pro.suzhou-dsa.com/daifukuquality/Semiconductor_2019_1118_CR4MB.mp4 (180.920 s, 1920 × 1080).
- Directly inspected sampled CG frames show suspended rail networks, overhead vehicles, side buffers, tall stockers, vertical belt-suspended carrier transfers, and separately identified reticle handling. These support layout and mechanism interpretation, **not a claim that the reconstruction depicts a filmed TSMC operation**.
- Contact sheets: `daifuku_overview.png`, `daifuku_transfer.png`, `daifuku_solution_review.png` under the research temp directory. The montage timestamps are only approximate selectors, not exact observed phase boundaries.
- No uninterrupted arrival → landing → release → hoist return → vehicle departure sequence was visually verified. No license for incorporating these film frames into R8 was verified.

## Primary-source constraints for modeling

| Source | Verified text/drawing | Implementation consequence and limit |
|---|---|---|
| Intel, [cleanroom](https://virtualmuseum.intel.com/fabtour/cleanroom.html) | A reconfigurable ballroom-style cleanroom; overhead AMHS; utilities supplied from subfab through raised floor. Intel describes equipment diversity and large individual tools. | Show a long hall with intersecting bays and varied equipment envelopes. The room dimensions in R8 remain design assumptions, not surveyed Intel or TSMC measurements. |
| Intel, [airflow](https://virtualmuseum.intel.com/fabtour/airflow.html) | Conditioned/filtered air enters through ceiling, passes through perforated floor into subfab, returns laterally and up for filtration/recirculation. | Architectural section can explain a vertical environmental system. Do not render decorative visible mist in the occupied room or label a simple arrow model as CFD. |
| Muratec, [transport systems](https://www.muratec.com/cfa/products/trans.php) | Overhead track with belt-driven hoist; transfers carriers among process loadports, stockers and temporary buffers. AGV and conveyor systems are separate products. | Vehicle remains constrained to rail while hoist translates vertically; retain carrier orientation. It is not a floor-running robot or a floating box. |
| Muratec, [catalog](https://logistics.muratec.net/media/catalog/pdf/1_LA01E_AboutLA_1910.pdf) | SRC350 grips the FOUP top flange; side-transfer/buffer arrangement is supported. | The carrier is attached through its top flange. Do not present the exact proprietary gripper internals as known. |
| Entegris, [A300 FOUP](https://www.entegris.com/shop/en/USD/products/wafer-handling/wafer-processing/300-mm-front-opening-unified-pods-%28foups%29/A300-FOUPs/p/A300FOUPs) | A300 25-slot configuration: 426 W × 355 D × 338 H mm, 10 mm wafer pitch; empty 5.4 kg, loaded 8.2 kg. A 13-slot variant also exists. | Use these dimensions only for the chosen A300-like reference, not every FOUP. Closed carrier protects wafers during transport. Do not confuse FOSB shipping containers with FOUPs. |
| TDK, [TAS300 Type J1 PDF](https://product.tdk.com/en/system/files/dam/doc/product/fa/fa/foup/catalog/fa_foup_tas300-j1_en.pdf) | **Drawing visually inspected.** 1386 mm height, 472 mm width, 493 mm depth from BOLTS plane; horizontal loading datum 900 mm above floor; 70 mm docking stroke. Obstacle detection and FOUP-position detection are listed. E84 optical I/O is an option. | Slim front interface: protruding docking table, FIMS door behind carrier, service cover below. The table moves toward the equipment after placement. E84 signal order was not established. Listed 8/11-second load operation is loadport timing, **not OHT transfer time**. |
| Daifuku, [reliability/productivity](https://www.daifuku.com/th/daifuku-square/article/000999/) | Overhead transport frees floor area; sealed carriers, low-particle design and non-contact power; buffering and route management. | Use overhead automation to explain protected movement and scheduling, not as proof that transport alone causes all fab delay. Rail-length/fleet claims apply to described installations, not a universal fab. |
| ASML, [NXE:3800E](https://www.asml.com/en/products/euv-lithography-systems/twinscan-nxe-3800e) | Distinct wafer handler/stage platform and in-situ metrology functions. | Scanner cannot be represented by the same anonymous box as every etcher. Product internals/CAD were not verified here; no exact-machine cutaway claim. |
| Lam, [Kiyo family](https://www.lamresearch.com/product/kiyo-product-family/) | Conductor etch uses reactive-ion-etch process/chamber control, including electrostatic chuck functions. | Chamber process is not OHT transport. A generic explanatory chamber must be labeled reconstruction, not an exact Kiyo engineering drawing. |

## Transfer-state contract: supported reconstruction, not an observed full cycle

The available vendor evidence supports the following physically coherent **proposed animation contract**. The complete timing and control sequence have not been filmed/verified here.

1. Vehicle travels on rail with hoist and loaded carrier raised. Local motion uses acceleration/deceleration; route geometry is continuous.
2. Vehicle stops above a clear destination loadport. No horizontal travel while the carrier is lowered in the proposed shot.
3. Belts lower the top-flange gripper and closed FOUP together. Carrier stays level and clear of tool enclosure/personnel.
4. FOUP lands on the loading table. Gripper releases **only after support is established**; then rises empty. No simultaneous unsupported carrier jump.
5. After the hoist is clear, vehicle may depart; loadport separately clamps/docks the carrier and handles the front door into the equipment interface.
6. Wafer transfer occurs on the equipment side of the interface. Its kinematics and exact interlocks are separate from the OHT move.

Do not display exact E84 handshake bits, the actual time of every phase, a specific vendor grip mechanism or numerical safety clearance as if verified. Tool recipe qualification, equipment condition and dispatch are separate production constraints; a moving carrier is not proof that its destination can process it.

## New reusable photographs and exclusions

The separate `archive-manifest-r8.json` contains two new, directly inspected CC BY 2.0 files with hashes. Original bytes are in `/workspace/scratch/204e2295d8fd/s1e01-r8-media/archive`.

- **UCL LCN photolithography research laboratory, 2013:** real yellow light, suited operators, wet bench, controls and small instruments. It illustrates contamination/light discipline; it must not stand in for a modern TSMC 300 mm production line.
- **Intel D1X construction, 2011:** large steel frame and cranes. Suitable for physical investment scale, with the date and construction state visible. Not an operating cleanroom.

Rejected: ST manufacturing-video screenshot/film (Commons says CC BY 3.0 but underlying license review is still pending, as R7 already recorded); TSMC gallery high-resolution photos behind permission/form terms; modern generated-looking uploads with unverified real-world provenance; all reused R7 shots. The two licensed photos do not solve the absence of cleared contemporary 300 mm production footage. Source-informed original 3D and explicit archive labels remain necessary.

## Verification boundary

Completed: source text/drawing inspection, selected real and CG video-frame inspection, exact PTS for five TSMC frames, two image downloads/decodes/visual review/rights-page review/hash checks. Not completed: continuous full OHT handoff video inspection, proprietary controller behavior, facility-specific spatial survey, finished-film synchronization, production-runtime playback, or independent release approval.
