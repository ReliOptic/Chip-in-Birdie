# CFM56-7B27 digital twin (research reconstruction)

Not a live operational twin: no engine instance, no sensor data. Stage reached: **Simulate** (sea-level static ISA cycle + spool response).

| What | Where |
|---|---|
| Interactive 3D twin (Three.js, vendored, no CDN) | `dist/index.html` — serve `dist/` over HTTP (`python3 -m http.server -d dist`) |
| CATIA-importable solids (STEP AP214, one per part) | `cad/step/*.step`; kernel-direct assembly `cad/assembly.glb` |
| Parametric source (CadQuery 2.8 / OCCT), every dimension → source + grade + σ | `tools/gen_parts.py` → `cad/parts/*.py`; build `DTA=<skill> python3 tools/build_cad.py` |
| Research corpus (30 sources, read) and bibliography | `research/corpus.json`, `research/facts.json`, `dist/research.html` |
| Cycle solver / independent oracle / mutant | `physics/solver.py`, `physics/oracle.py`, `physics/mutant.py`, inputs `physics/inputs.json` |
| Held-out tests | `python3 -m unittest tests/test_twin.py` |
| Browser captures | `qa/captures/*.png`, `qa/captures/observations.json` |

Gestures: drag the fan up/down = throttle (N2 demand → N1/N2/Tt4/Tt5/thrust from the solver line); right-drag or two-finger drag = disassemble; hold `?` = blocker map; drag on a surface = section. Rotation is shown at 1/150 speed (declared).

Release gate is **blocked**: corpus 30/100, exterior evidence ledger and photo-matched exterior not done, all parts still E3 (worst parameter inferred).
