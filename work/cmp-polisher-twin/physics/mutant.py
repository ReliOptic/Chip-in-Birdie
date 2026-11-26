#!/usr/bin/env python3
"""DELIBERATE MUTANT — must be rejected: ignores carrier rotation (V = ω_p × distance from platen centre)."""
import json, math, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent)); import solver  # noqa: E402
i = json.loads((Path(__file__).parent / "inputs.json").read_text())
if "--json-input" in sys.argv:
    for k, v in json.loads(sys.argv[sys.argv.index("--json-input") + 1]).items():
        i.setdefault(k, {})["value"] = v
def fake(ii, r, th):
    wp, _ = solver.omegas(ii); e = solver.val(ii, "e_m")
    return wp * math.sqrt(r * r + e * e + 2 * r * e * math.cos(th))
solver.speed = fake
pr = solver.profile(i)
print(json.dumps({"output": [pr["mean_A_min"] / 1e4, pr["wiwnu"] * 10, pr["V_mean_m_s"] / 2]}))
