#!/usr/bin/env python3
"""DELIBERATE MUTANT — must be rejected: normalises the collected fraction by 4π instead of 2π (CE is defined into 2π sr)."""
import json, math, sys
from pathlib import Path
inp = {k: v["value"] for k, v in json.loads((Path(__file__).parent / "inputs.json").read_text()).items()}
if "--json-input" in sys.argv:
    inp.update(json.loads(sys.argv[sys.argv.index("--json-input") + 1]))
p_if = inp["P_mainpulse_W"] * inp["CE_2pi"] * inp["solid_angle_sr"] / (4 * math.pi) * inp["R_collector"]
print(json.dumps({"output": [p_if / 250.0, inp["solid_angle_sr"] / 5.5, inp["v_droplet_m_s"] / inp["f_Hz"] / 1.6e-3]}))
