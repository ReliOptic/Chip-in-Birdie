# 261122 | S1–S4 Editorial Redesign — Primer-informed documentary, V0 PROPOSAL

> **NOT CANON. REVIEW ONLY.** This file proposes artistic, structural and episode-level redesigns without modifying `editorial/seasons.json`, `editorial/SEASONS.md`, channel policy, current media, or release approvals. All 32 episode IDs and P lineage remain exactly as in main at `eca80f417ece882f92b2fc82c457730ce3090f74`. R8 remains in independent review on [PR #4](https://github.com/ReliOptic/Chip-in-Birdie/pull/4); [PR #6](https://github.com/ReliOptic/Chip-in-Birdie/pull/6) is an unmerged consistency proposal, not yet main policy.

## What changes, what does not

**Changes proposed:** Series-wide information design; four different season story engines; 32 new *candidate* packaging titles and episode-specific physical scenes; season-relative graphic modules; source questions and independent editorial review targets.

**Preserved:** 4 × 8 = 32, episode IDs/source P IDs, cross-season production cycle `S1E01 → S2E01 → S3E01 → S4E01 → E02...`, channel audience, English master, 8–9-minute planning default with story-justified 6–12-minute exception, factual/rights separation, no automatic YouTube upload, original restricted media outside Git. **15–25 minutes is only an unapproved alternative** from the Aside handoff; not a new requirement.

**Creative reference:** Bloomberg Originals, *How AI Is Pushing the Semiconductor Supply Chain to the Limit* (2026-05-06), https://www.youtube.com/watch?v=VdcD6qX8Xrc . The 2026-11-22 Aside research reviewed 133 stills plus transcripts and chapter metadata; stills evidence composition, **not** easing, motion trajectories, VO sync, or licensed footage. Odd Decision remains an optional single-decision story reference; HFE only a bounded market-context lens; unlock_kr is an optional craft-quality benchmark. Do **not** borrow Bloomberg logo/B-bug, particular shots, copy, or its proprietary packaging.

## One channel, four kinds of discovery

| Season | Editorial concept (proposal) | System question | Repeatable viewer reward |
|---|---|---|---|
| S1 · WHO MAKES IT | **THE FACTORY YOU DON'T OWN** | 공장·제품·기술을 누가 소유하고, 누가 제조와 출하 위험을 부담하는가? | A material handoff crosses company boundaries; reveal the liability that did not move. |
| S2 · LIMITS AND THE NEXT MOVE | **THE LIMITS THAT CHANGED COMPUTING** | 물리적·아키텍처적 한계가 다음 설계를 언제 유리하게 만드는가? | Start at a performance puzzle, reveal its physical trace, then the alternative architecture and price. |
| S3 · THE PRICE OF MEMORY | **THE COST OF A BIT** | 비트를 반복해서 만들고 팔 때 실제 비용과 대가는 무엇인가? | Follow the physical bit into a distinct cost ledger: labor, area, yield, qualification, price or learning. |
| S4 · NATIONS AND CHIPS | **THE BORDERS INSIDE A CHIP** | 국가의 조달·협력·규제가 실제 칩, 재료, 공정과 거래를 어떻게 바꾸는가? | Start from an archived decision/document, traverse the affected material or device, compare interests and dated outcomes. |

The seasons share **one channel audience**, not separate target personas. Each film stands on its own; cross-episode returns are rewards, not prerequisites.

**Provenance note:** Five original P IDs are recovered only from PR #1 (`P137`, `P109`, `P120`, `P147`, `P101`); their `main_p_id` remains `null`. The companion JSON retains `source_namespace`, `main_p_id`, and source H IDs, rather than pretending the records are in main's P001–P100 catalogue.

## Style system without a rigid formula

- **Visual grammar:** independent Chip wordmark, charcoal/neutral editorial field, a functional *original* single accent per frame, accessible captions/type, generous space for evidence. Avoid reproducing Bloomberg's yellow brand package, title lockups or top-right mark.
- **Shot labels:** `ACCESS` actual acquired/on-site footage; `CINEMA_BROLL` original or cleared cinematic plate; `MG` data/relationship graphics; `DIAGRAM_3D` reconstructed mechanisms/spaces; `ARCHIVE` attributable/licensed historical record; `STANDUP` actual presenter; `NEWS_MONTAGE` separately rights-cleared reporting.
- **Access-zero cut:** Prefer `MG` + `DIAGRAM_3D` + cleared `ARCHIVE`; never mimic a real unaccessed cleanroom with a false on-site claim. Label explanatory reconstruction `ILLUSTRATIVE`. Source-derived fake UI screens should be credited as recreations, not screenshots.
- **MG kit, optionally:** `VoidStage`, `TypeLockup`, `LogoParticles` (only our identity), `ScalePair`, `DiagramStroke`, `ChipPackage3D`, `MapArc`, `IconBus`, `CompareBars`, `CompositeChrome/LocationCard`. Reuse components, **not identical shots** or mandated screen percentages.
- **Narrative template is a palette:** body/puzzle cold open → scale/stakes → central question → evidence/mechanism/decision nodes → dependency/counterexample → human or industrial payoff. Each episode chooses the useful beats; this is not a universal 7-beat clock. No arbitrary three-metaphor rule, no 15–25-minute inflation to resemble Primer.
- **Core motion test:** Does the object, data, person or obligation visibly change? One well-edited evidence cut can beat a long 3D orbit.

## Season-wide production identities
### S1 — THE FACTORY YOU DON'T OWN

**Series question:** 공장·제품·기술을 누가 소유하고, 누가 제조와 출하 위험을 부담하는가?

**Narrative engine:** A material handoff crosses company boundaries; reveal the liability that did not move.

**Visual character:** Stainless-steel architecture, observed actions, ownership boundaries, dated corporate records; neutral documentary illumination.

**Repeatable visual motif:** carrier→wafer→tested chip; separate contract/data overlay

**Useful kit:** ChipPackage3D, DiagramStroke, IconBus, CompareBars

**Accuracy/production trap:** Keep R8 in-progress film, do not visually imply private factory access or universal foundry contract terms.

### S2 — THE LIMITS THAT CHANGED COMPUTING

**Series question:** 물리적·아키텍처적 한계가 다음 설계를 언제 유리하게 만드는가?

**Narrative engine:** Start at a performance puzzle, reveal its physical trace, then the alternative architecture and price.

**Visual character:** Signal timelines, energy envelopes, transistor cutaways, archival experiment cards; not generic glowing chip loops.

**Repeatable visual motif:** signal→latency→heat→choice; same GPU returns between E01/E06/E08

**Useful kit:** DiagramStroke, ScalePair, CompareBars, ChipPackage3D

**Accuracy/production trap:** E01 and E06 are separated by canon: link by dated experiment callback, not claim identical GPU architecture or hardware.

### S3 — THE COST OF A BIT

**Series question:** 비트를 반복해서 만들고 팔 때 실제 비용과 대가는 무엇인가?

**Narrative engine:** Follow the physical bit into a distinct cost ledger: labor, area, yield, qualification, price or learning.

**Visual character:** Tactile hardware and archival tools, annotated cell geometry, sparse cost comparisons with real units.

**Repeatable visual motif:** one bit→one cell→one wafer→one factory decision

**Useful kit:** ScalePair, DiagramStroke, CompareBars, ChipPackage3D

**Accuracy/production trap:** Do not use one universal cost-per-bit series or imply national outcomes have a single cause.

### S4 — THE BORDERS INSIDE A CHIP

**Series question:** 국가의 조달·협력·규제가 실제 칩, 재료, 공정과 거래를 어떻게 바꾸는가?

**Narrative engine:** Start from an archived decision/document, traverse the affected material or device, compare interests and dated outcomes.

**Visual character:** Dated source plates, clear regional maps, physical qualification gates, restrained institutional document animation.

**Repeatable visual motif:** date→document→material/interface→choice→cost

**Useful kit:** MapArc, TypeLockup, CompareBars, DiagramStroke

**Accuracy/production trap:** No fake intelligence access, fabricated regulators, prediction theater or undated legal status.

## Episode redesign matrix — eight retained stories per season

These are **candidate titles and treatments**, *not* replacements for approved working titles and not claims of completed fact research.

### S1 — THE FACTORY YOU DON'T OWN

| Episode / lineage | Candidate story packaging | Event / decision that moves the film | Distinctive picture and modes | Proof or scope gate |
|---|---|---|---|---|
| **S1E01** · P004 | **The Factory That Doesn't Promise a Chip** | Idle tool versus a wafer still waiting: who can actually deliver a working chip? | One carrier enters a qualified-route gate; the manufacturer/designer obligations diverge over the same physical wafer. **[DIAGRAM_3D + MG + ARCHIVE]** | Respect PR #4 R8 as an IN_REVIEW existing production; use 1997 TSMC and 1998 NVIDIA filings in dated context; no new shot approval. |
| **S1E02** · P061 | **What Eight Resignations Changed** | Leaving an employer is a decision; turning expertise into a repeatable industry is the harder act. | Eight workstations go dark; a dated corporate/organizational map emerges from independently sourced founder records. **[ARCHIVE + MG + DIAGRAM_3D]** | No dramatized removal of proprietary notebooks; distinguish oral histories from signed records. |
| **S1E03** · P073 | **Why AMD Let Go of Its Fabs** | What capital burden and manufacturing dependency remain when a chip business changes its ownership boundary? | A single fab shown as two contractual ledgers: asset ownership leaves, wafer commitments remain. **[ARCHIVE + CompareBars + MG]** | AMD/GlobalFoundries transaction terms and wafer supply terms must be dated; no universal fabless claim. |
| **S1E04** · P066 | **How Taiwan Learned to Repeat a Process** | Technology transfer delivers knowledge, not instant production capability. | Training map leads into successive illustrative qualification lots, with unknown yield values left blank. **[MapArc + ARCHIVE + DIAGRAM_3D]** | Confirm RCA/ITRI records and named engineers; no invented factory footage or numerical yield curve. |
| **S1E05** · P137 | **Independence Has a Process Cost** | What would it cost to own the recipe instead of following someone else's? | Two copper-integration routes enter a reliability-testing fork; a documented/no-evidence ledger stays visible. **[DIAGRAM_3D + MG + ARCHIVE]** | Unverified 'turned down IBM' story stays a research question; no filmed rejection without direct evidence. |
| **S1E06** · P070 | **The Factory Behind a Phone Chip** | Why does a fabless vendor still need a manufacturing network to make a product real? | An illustrative phone circuit separates IC specification, fabrication, package, testing and delivery. **[ChipPackage3D + IconBus + MG]** | Identify any claimed Qualcomm device/fab relationship with public BOM and company sources. |
| **S1E07** · P109 | **When Chip Designs Could Travel** | How did common design rules create an interface between people who draw chips and people who print them? | Several independently authored layouts converge onto an illustrative shared-wafer run and split into different designs. **[DiagramStroke + ScalePair + ARCHIVE]** | Attribute Mead–Conway, multi-project wafer practice and dates specifically; no claim that one textbook invented all design. |
| **S1E08** · P078 | **What Apple Designs—and What It Buys** | What can a system company control with its own silicon without owning a fabrication plant? | One product system opens into design choices, outsourced wafer processing and assembly; two types of control are outlined. **[ChipPackage3D + CompareBars + ARCHIVE]** | Device and partner attribution require exact dates/generations; integrated manufacturing remains a real alternative. |

### S2 — THE LIMITS THAT CHANGED COMPUTING

| Episode / lineage | Candidate story packaging | Event / decision that moves the film | Distinctive picture and modes | Proof or scope gate |
|---|---|---|---|---|
| **S2E01** · P055 | **The GPU Had Another Job** | A chip sold to draw game scenes becomes useful for a different class of parallel computation—what made that possible? | The same conceptual execution lanes shift from shading pixels to processing arrays, with architecture changes flagged. **[DIAGRAM_3D + DiagramStroke + ScalePair]** | Do not claim gaming alone caused AI or that exact hardware/workloads are unchanged; verify product/software chronology. |
| **S2E02** · P011 | **A Working Transistor Wasn't Enough** | Can an impressive laboratory device become a reliable industrial component? | Point-contact amplification succeeds once, then an illustrative repeatability/ruggedness comparison changes the question. **[ARCHIVE + DIAGRAM_3D + CompareBars]** | Device-specific historical records; do not pass reconstructed 'failed tests' off as observed experiments. |
| **S2E03** · P058 | **The Instruction That Left a Trace** | If a CPU discards speculative work, why can traces of that work remain observable? | Two parallel timelines separate architectural results from cache effects; a rejected path leaves a timed trace. **[DiagramStroke + MG]** | Identify affected architectures, demonstrations and mitigations correctly; not 'every secret leaked'. |
| **S2E04** · P091 | **When Speed Wasn't the Only Measure** | How could lower switching power change which chip technology became valuable? | Complementary switching and rest current are compared under stated conditions; power flows instead of magic zero-power claims. **[DIAGRAM_3D + ScalePair + CompareBars]** | Check early CMOS time, speed, leakage and dynamic power; avoid a single 'rejected' decision myth. |
| **S2E05** · P060 | **Free Instructions, Expensive Chips** | What is genuinely open in an ISA—and what still costs years of engineering? | One instruction splits into different cores; verification and physical implementation budgets remain separate. **[DiagramStroke + IconBus + MG]** | Distinguish ISA licensing, core IP, toolchain, verification and foundry expenditures. |
| **S2E06** · P057 | **Two GPUs, One Research Breakthrough** | Why did a particular multi-GPU and software setup matter in an ImageNet benchmark? | A dated experiment's training batches split between two boards; speed/memory assumptions and score labels appear only from original paper. **[ARCHIVE + MG + DIAGRAM_3D]** | Use original 2012 AlexNet paper and ImageNet evaluation; not 'beat every AI lab'. |
| **S2E07** · P010 | **When a Forecast Became a Deadline** | How can an expectation about future density synchronize firms that compete? | One date-stamped forecast becomes independently dated equipment/process/roadmap commitments; a late tool reveals tradeoffs. **[ARCHIVE + MapArc + CompareBars]** | Separate Moore's 1965 claim from later industry roadmaps; coordination is interpretation, not a universal causal proof. |
| **S2E08** · P099 | **The Heat at the End of Faster** | When more switching ceases to be an affordable route, where does performance go? | Temperature and power envelopes constrain a CPU path; work migrates to parallelism, memory and software. **[DIAGRAM_3D + CompareBars + IconBus]** | Use qualitative simulations unless validated device/thermal numbers are sourced; do not imply all chips share one power wall. |

### S3 — THE COST OF A BIT

| Episode / lineage | Candidate story packaging | Event / decision that moves the film | Distinctive picture and modes | Proof or scope gate |
|---|---|---|---|---|
| **S3E01** · P046 | **Why Intel Left DRAM** | A manufacturer cannot spend the same capacity twice: which business gets the next wafer start? | One factory allocation board has two products and a constrained capacity slot; historical accounts are overlaid separately. **[ARCHIVE + CompareBars + MG]** | Intel product and management histories; separate historical managerial recollection and contemporary financial records. |
| **S3E02** · P041 | **When a Bit Was Woven by Hand** | What did storing one bit demand from a human hand, a machine and a budget? | A thread passes through ferrite rings; a read pulse reveals the physical work of memory, without posing as archival footage. **[DIAGRAM_3D + ScalePair + ARCHIVE]** | Confirm destructive read/restore for the illustrated core design, era and labor source. |
| **S3E03** · P120 | **Japan's Memory Bet Met a New Customer** | Why can superior qualification in one market fail to guarantee sales in a changing market? | Two dated customer requirement sheets flank a changing price/product-mix ledger; no single-cause verdict. **[ARCHIVE + CompareBars + MG]** | Do not assert 'quality caused decline'; test PC-market demand, currency, trade and product strategy as competing factors. |
| **S3E04** · P025 | **The Gate That Defined Its Own Edges** | How does self-alignment change what a production process can repeat? | A single gate defines the subsequent boundary; overlay error in two schematic routes is contrasted without invented yield. **[DIAGRAM_3D + DiagramStroke]** | Use actual silicon-gate process/patent history; distinguish geometry benefit from downstream commercialization. |
| **S3E05** · P045 | **Samsung's Cost of Learning DRAM** | Why would a late entrant keep spending before the next wafer becomes reliable? | An illustrative yield-improvement process is shown against a dated investment/learning timeline, with measured values only if sourced. **[ARCHIVE + MG + DIAGRAM_3D]** | Verify specific 'told it would fail' quotation; no fabricated Samsung yield numbers. |
| **S3E06** · P147 | **The Memory Chip With a Window** | Why would opening a package to light make software and hardware development easier? | UV reaches an illustrated EPROM die through quartz, then erase/program cycles make iteration visible. **[DIAGRAM_3D + ScalePair + ARCHIVE]** | Distinguish UV EPROM from EEPROM/flash; avoid inventor dialogue without records. |
| **S3E07** · P042 | **The Bit That Keeps Forgetting** | How does a tiny capacitor hold a bit only by being continually cared for? | Charge leaks, a sense amplifier reads and restores, refresh repeats; die-area comparison is labeled illustrative. **[DIAGRAM_3D + DiagramStroke + CompareBars]** | Verify classic 1T1C technical sources; no source-free cost-per-bit figures. |
| **S3E08** · P044 | **Inventing Flash Was Only the Beginning** | Why do a patent, a stable manufacturing process and a profitable market award value to different players? | An erase block is tested across reliability gates; product and customer pathways fork from invention. **[ARCHIVE + ChipPackage3D + MG]** | Separate early invention, NOR/NAND versions, manufacturing actors and market outcomes with dated sources. |

### S4 — THE BORDERS INSIDE A CHIP

| Episode / lineage | Candidate story packaging | Event / decision that moves the film | Distinctive picture and modes | Proof or scope gate |
|---|---|---|---|---|
| **S4E01** · P089 | **The Rules Written Into an AI Chip** | How can a dated export-control threshold alter a product's configuration before shipment? | A historical rule sheet overlays an illustrative product-parameter card; classification changes across explicit dated versions. **[ARCHIVE + DiagramStroke + MG]** | Find official 2022–23 provisions/revisions and scope; make no unverified claim about legality in Nov 2026. |
| **S4E02** · P022 | **The Crystal Behind Wartime Radar** | What did a defense buyer need from material purity and reliable detection? | A radar pulse weakens at a detector; one physical crystal/metal contact is studied as a labeled mechanism. **[ARCHIVE + DIAGRAM_3D + ScalePair]** | War-period specific research and components; do not make radar the sole origin of the chip industry. |
| **S4E03** · P083 | **When a Material Exists but Isn't Qualified** | What is the time lag between getting a substitute chemical and running it safely in a process? | Material flows across a dated licensing line, then waits at a technical qualification gate before illustrative fab use. **[MapArc + ARCHIVE + DiagramStroke]** | 2019 Japanese licensing is not a blanket global ban; dates, material types and adoption evidence required. |
| **S4E04** · P101 | **Copying the Chip Doesn't Copy the System** | What could replicating a specific device do—and what supporting capability remained difficult? | Two dated device photos/spec sheets meet a traced schematic; production capability is shown as a distinct chain. **[ARCHIVE + DIAGRAM_3D + MG]** | No invented single nationwide order; verify specific Soviet products, documentation and dependencies. |
| **S4E05** · P068 | **The Manufacturing Problem Rivals Shared** | What problem can competing chipmakers cooperate on without abandoning competition? | Separate fab samples arrive at one generic precompetitive test setup, then leave in different product lines. **[ARCHIVE + IconBus + MG]** | SEMATECH charter, membership and funding chronology; 'shared secrets' remains illustrative language. |
| **S4E06** · P067 | **Japan's Shared Research, Separate Companies** | Why does a shared R&D program not create one unified chipmaker? | An archival program map splits common research from proprietary manufacturing lines; compare precisely with SEMATECH. **[ARCHIVE + MapArc + CompareBars]** | Use VLSI project records; do not claim all rivals shared one physical laboratory. |
| **S4E07** · P074 | **A Government That Bought Reliability** | How could the requirements of a demanding public customer reshape component adoption? | An illustrative purchased IC passes a documented test sequence before entering a system integration drawing. **[ARCHIVE + DIAGRAM_3D + MG]** | Distinguish NASA versus DoD procurement, device types and their separate historical roles. |
| **S4E08** · P076 | **How a Memory Price Became a Trade Case** | When did the price of a DRAM become evidence in an international dispute? | Dated price comparators enter an agreement and enforcement timeline; transaction, legal test and consequence split. **[ARCHIVE + CompareBars + MapArc]** | Use original US–Japan agreement and trade case records; avoid treating contested price formulas as objective universal cost. |


## First full-film cycle — four E01 pilots

| Pilot | Opening (editable concept, not shot approval) | Turning point | Non-forecast closing payoff |
|---|---|---|---|
| **S1E01 / PR #4 R8** | An idle factory tool while one wafer waits; show room/airflow/carrier with truthful reconstruction label | Access to tools ≠ qualified route ≠ working shipped chip; then the dated foundry transaction | Ask which product a new fab can make, at what quality, and when—retain the active R8 editorial thesis |
| **S2E01** | A game scene and an array calculation approach the same conceptual parallel hardware | Memory, programmability, software and market investment explain when the transfer becomes useful | Games created one economic route into a different compute ecosystem, not a one-step 'AI invented by gaming' story |
| **S3E01** | One capacity allocation board, two competing product demands | DRAM economics versus processor opportunity; management chooses which demand to serve | A bit's price depends on the factory slot and alternative value, not only the cell physics |
| **S4E01** | A dated export-control rule and an AI chip's technical parameters | Product choices, jurisdiction and the then-applicable classification move together | The rule can change a chip design, but a historical legal snapshot is not a claim about current legality |

## S1E01 R8 — candidate re-edit crosswalk, not a rewrite

**Actual branch evidence:** R8 477.357 s, 45 English passages, 65 shots (36 spatial/27 reporting/2 photos), Sites v5 deployed, independent full viewing/listening and final rights/editorial approval still open. Classifying the 45 edit rows by actual timeline gives approximately 39.8% spatial time, 58.1% reporting graphics, 2.0% photographs. **58.1% reporting graphics is not synonymous with Primer-grade MG.**

| R8 existing time/content | Preserve | Primer-informed editorial option | Do not infer |
|---|---|---|---|
| 00:00–01:00 idle tool, room, carrier | Physical scene and qualified-capacity question | Add one tactile/scale contrast anchored to actually sourced facts; let room sound and object tell the question | Fake presenter/factory access |
| 01:00–02:15 OHT→loadport→wafer | Shared event clock and physical handoff | Sharper editorial cuts, minimal labels on **actions** rather than decorative orbit | Exact surveyed tool process |
| 02:15–03:25 eligible tools, queues, cycle time | Good decision problem | Split queue/eligibility mechanism and investment choice into one visual comparison | Invented numerical factory KPI |
| 03:25–05:06 metrology, design feedback | Engineering mechanism | Material/report → observed constraint → decision → information shared across firms | False screenshots of a client portal |
| 05:06–06:44 TSMC 1997, NVIDIA 1998 | Dated corporate/historical record | Paper→contract→economic risk connection; stronger counter-choice IDM beat | Present-day terms generalized from 1998 |
| 06:44–07:57 package and fab closing | Useful industrial payoff | Human-scale/industrial soft close; keep three fab-expansion questions | Unapproved new release title or total duration |

**Editorial hypothesis to test:** S1's main weakness is not insufficient total MG time; it is insufficient *variation between evidence, mechanical consequence, human/industrial stakes, and visual tempo*. An independent viewer needs to determine whether the new edit communicates better. Source inspection is not that review.

## Production interfaces — no new policy

A shot-specific worksheet may refer to existing `templates/shots.csv` and `templates/claims.csv` and carry: `episode_id / beat / shot_mode / observable_action / claim_ref / source_ref / asset_rights / illustrative_scope / edit_rationale`. These are **suggested production notes**, not mandatory schema or a rewrite of `ops/WORKFLOW.md`.

Optional 60–90-second access-zero vertical slice uses only MG kit A–H from one of the E01 story engines. No user-supplied Bloomberg image/video or trademark, no fabricated factory footage, no fake company confidential data.

## Explicit decisions required before promotion into canon

1. Are the four **story concepts** better as secondary editorial subtitles while retaining existing season names? This proposal assumes yes.
2. Which candidate titles/visual approaches improve each film and survive source verification? Do not bulk-approve titles.
3. Keep the existing 32 IDs, original source mappings and production order unless a later explicit decision changes them.
4. Keep R8's exact `IN_REVIEW` revision separate; its already-produced film is a baseline, not automatically remade or released.
5. If a longer episode is actually justified, approve it **per episode**; no blanket Primer-length mandate.

**Completion boundary:** This is a planned editorial slate and visual grammar. No 32 screenplays, shot renders, media rights clearance, independent viewing session, or publication is implied.
