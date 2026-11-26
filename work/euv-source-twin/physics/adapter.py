#!/usr/bin/env python3
"""Production adapter: [P_IF_max/250 W, Ω/5.5 sr, droplet spacing/1.6 mm]; dimensions of P = W (kg m² s⁻³);
energy balance of the drive pulse: incoming laser power = EUV at IF + all other loss (absorbed/uncollected/out-of-band)."""
import json, sys, math
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import solver  # noqa: E402
inp = json.loads((Path(__file__).parent / "inputs.json").read_text())
if "--json-input" in sys.argv:
    for k, v in json.loads(sys.argv[sys.argv.index("--json-input") + 1]).items():
        inp.setdefault(k, {})["value"] = v
s = solver.chain(inp)
print(json.dumps({"output": [s["P_IF_max_W"] / 250.0, solver.val(inp, "solid_angle_sr") / 5.5, s["droplet_spacing_m"] / 1.6e-3],
  "dimensions": {"lhs": [1, 2, -3, 0, 0, 0, 0], "rhs": [1, 2, -3, 0, 0, 0, 0]},
  "balance": {"incoming": solver.val(inp, "P_mainpulse_W"), "outgoing": s["P_IF_max_W"], "stored": 0.0, "dissipated": s["heat_not_collected_W"]}}))
