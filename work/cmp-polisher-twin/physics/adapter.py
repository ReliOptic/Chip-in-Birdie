#!/usr/bin/env python3
"""Production adapter: [mean RR/1e4 Å/min, WIWNU×10, V_mean/2]. Dimensions of RR = a·P·V/(1+bPV): m s⁻¹ both sides.
Balance: friction power is not modelled → declare mechanical power in = P·A·V_mean, out = 0, dissipated = all (heat)."""
import json, sys, math
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent)); import solver  # noqa: E402
i = json.loads((Path(__file__).parent / "inputs.json").read_text())
if "--json-input" in sys.argv:
    for k, v in json.loads(sys.argv[sys.argv.index("--json-input") + 1]).items():
        i.setdefault(k, {})["value"] = v
pr = solver.profile(i)
pin = solver.val(i, "zone_psi") * solver.PSI * math.pi * solver.val(i, "r_wafer_m") ** 2 * pr["V_mean_m_s"]
print(json.dumps({"output": [pr["mean_A_min"] / 1e4, pr["wiwnu"] * 10, pr["V_mean_m_s"] / 2],
  "dimensions": {"lhs": [0, 1, -1, 0, 0, 0, 0], "rhs": [0, 1, -1, 0, 0, 0, 0]},
  "balance": {"incoming": pin, "outgoing": 0.0, "stored": 0.0, "dissipated": pin}}))
