#!/usr/bin/env python3
"""DELIBERATE MUTANT — must be rejected. Same interface as the production adapter but drops the
bypass-stream thrust (treats the turbofan as if only the core jet produced thrust)."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import solver  # noqa: E402

base = json.loads((Path(__file__).parent / "inputs.json").read_text())
if "--json-input" in sys.argv:
    for k, val in json.loads(sys.argv[sys.argv.index("--json-input") + 1]).items():
        base.setdefault(k, {})["value"] = val
s = solver.cycle(base, 1.0)
print(json.dumps({"output": [s["thrust_core_N"] / 1e5, s["fuel_kg_s"], s["Tt5_K"] / 1000, s["V_bypass_m_s"] / 300]}))
