# Equipment digital twins (research reconstructions)

Three twins built with the same pipeline: sourced corpus (patents + papers + regulatory) → parametric CAD with per-dimension
source/grade/σ → STEP AP242 (per part + named assembly, CATIA-importable) + GLB → solver / independent oracle / deliberate mutant →
in-scene evidence grammar (Three.js). Build any of them: `DTA=<skill dir> python3 work/_dta-tools/build_cad.py work/<twin>`.

| Twin | Sources | CAD (AP242) | Held-out check | Result |
|---|---|---|---|---|
| `jet-engine-twin` CFM56-7B27 | 56 | 16 parts | rated thrust 121.44 kN, ICAO fuel 1.284 kg/s, blade mass 4.91 kg, §33.73 | +0.9 %, −3.7 %, −7 %, pass |
| `euv-source-twin` NXE:3400 LPP source | 54 | 8 parts | 250 W at IF vs chain upper bound | bound 463 W → 0.54 unmodelled transmission |
| `cmp-polisher-twin` Reflexion LK class | 50 | 11 parts | Cu RR at 1.5 / 2.5 psi (S035) | >6452 ✓ / +9.1 % |

All parts are still E3 (at least one inferred dimension each). Release gate blocked on: corpus <100, exterior photo-match ledger,
blocker-map opacity check (E3 base opacity 0.35 vs check threshold 0.5). Patent-only structures are labelled `patent_proposal`.
