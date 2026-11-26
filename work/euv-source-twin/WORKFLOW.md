# Workflow — cymer-asml-lpp-euv-source-nxe3400

The twin is the deliverable at every stage; research and CAD exist to make it honest. Run from the project root; `$DTA` is the skill folder.

| Stage | You produce | Command | Gate that checks it |
|---|---|---|---|
| 0 Identity | `research/identity.json` (exact maker/model/year/variant, exclusions, incompatible families) | — | `system_integrity.variant_exclusion` |
| 1 Parts & sources | `research/parts-tree.json` (every visible/critical part with role, parent, unknowns), `research/corpus.json` (100+ rows), excerpts in `research/excerpts/` | `python3 $DTA/scripts/dta_bibliography.py .` → `dist/research.html` | `research_corpus.*` |
| 1b Exterior | `qa/exterior-evidence.json` search-path log + landmarks | `python3 $DTA/scripts/dta_exterior_evidence.py .` | exterior ledger |
| 2 CAD | one `cad/parts/<part_id>.py` per part (copy `_template_part.py`; every dimension → source_id + grade + sigma), `cad/assembly.json` (placement, joints, explode order) | `python3 $DTA/scripts/dta_cad_build.py .` → `cad/step/*.step`, `cad/glb/*.glb`, `cad/parts.json`, `dist/model.glb`, `cad/build-report.json` | `cad_assembly.*` |
| 3 Cards | `ui/part-rationale.json`: one card per part — grade/confidence/sigma from `cad/build-report.json`, `missing[]` for every E3/E4 | `python3 $DTA/scripts/dta_bibliography.py .` (syncs `dist/data/`) | `rationale_experience.*` |
| 4 Physics | `physics/` production solver, independent oracle, deliberate mutant (separate files), `physics/counterhypotheses.json`; browser hook `window.dtaPhysics = { step, onDragPart }` | `python3 $DTA/scripts/dta_physics_falsification.py` via the gate | `physics_independence.*`, `system_integrity.physics_interface` |
| 5 Scene | `dist/index.html` (template already wired: GLB → evidence grammar → gestures → explode); vendor Three.js: `npm i three && cp node_modules/three/build/three.module.js node_modules/three/build/three.core.js dist/vendor/three/ && cp -r node_modules/three/examples/jsm/* dist/vendor/three/addons/` | `python3 $DTA/scripts/dta_spatial_preflight.py dist --visual-target photoreal_3d`, then `npm i -D playwright gltf-validator && npx playwright install chromium` once and `node $DTA/scripts/dta_capture.mjs dist --out qa/captures` → look at the PNGs | `brand_experience.scene_priority`, `rationale_experience.*`, `visual_fidelity.*` |
| 6 Package | clean rebuild of `dist/`, serve it, inspect real screenshots at desktop/mobile | `python3 $DTA/scripts/dta_artifact_audit.py dist --require-exterior-evidence` | artifact audit |
| 7 Release gate | `qa/manifest.json` (`dta.quality-gate/v3`, start from `qa/manifest.draft.json`) | `python3 $DTA/scripts/dta_quality_gate.py --manifest qa/manifest.json --out qa/report-<n>.json --execute` | all |

Order of work: 0 → 1 (first ~10 sources) → 2 (landmark parts only) → 5 (first frame in a real browser) → then widen 1–4 and re-run 5–7. Incomplete twins ship as navigable twins with E3/E4 parts visible; never as a report.
