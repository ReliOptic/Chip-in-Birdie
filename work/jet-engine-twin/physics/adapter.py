#!/usr/bin/env python3
"""Production adapter for dta_physics_falsification: calls solver.cycle (the real model) with overrides.
Output [F/1e5 N, fuel kg/s, Tt5/1000 K, V19/300 m/s] + SI dimensions of thrust = momentum flux, and
the steady-flow energy balance (incoming ambient enthalpy + burner heat = exit total enthalpy + mechanical loss)."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import solver  # noqa: E402

base = json.loads((Path(__file__).parent / "inputs.json").read_text())
if "--json-input" in sys.argv:
    for k, val in json.loads(sys.argv[sys.argv.index("--json-input") + 1]).items():
        base.setdefault(k, {})["value"] = val
s = solver.cycle(base, 1.0)
g = lambda k: float(base[k]["value"])
m, bpr = g("mass_flow"), g("bpr"); mc, mb = m / (1 + bpr), m * bpr / (1 + bpr)
incoming = m * solver.CP_C * g("T0") + g("eta_burner") * s["fuel_kg_s"] * g("lhv")
outgoing = mb * solver.CP_C * s["Tt13_K"] + mc * (1 + s["far"]) * solver.CP_H * s["Tt5_K"]
w_comp = m * solver.CP_C * (s["Tt13_K"] - g("T0")) + mc * solver.CP_C * (s["Tt3_K"] - s["Tt13_K"])
dissipated = w_comp / g("eta_mech") - w_comp
print(json.dumps({"output": [s["thrust_N"] / 1e5, s["fuel_kg_s"], s["Tt5_K"] / 1000, s["V_bypass_m_s"] / 300],
                  "dimensions": {"lhs": [1, 1, -2, 0, 0, 0, 0], "rhs": [1, 1, -2, 0, 0, 0, 0]},
                  "balance": {"incoming": incoming, "outgoing": outgoing, "stored": 0.0, "dissipated": dissipated}}))
