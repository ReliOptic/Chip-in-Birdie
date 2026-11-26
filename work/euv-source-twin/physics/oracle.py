#!/usr/bin/env python3
"""INDEPENDENT ORACLE — no shared code with solver.py. Emits N isotropic photons (fixed seed) from F1 over the full
sphere, intersects each ray with the CAD collector's ellipsoid (rebuilt here from cad/parts/p-collector.py PARAMS
numbers read as data), counts hits inside the reflecting annulus, then applies reflectivity. CE is defined into 2π sr,
so sphere emission = 2·CE·P (isotropy assumption)."""
import json, math, random, re, sys, ast
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]


def collector_params():
    txt = (ROOT / "cad/parts/p-collector.py").read_text()
    params = ast.literal_eval(txt.split("PARAMS = ", 1)[1].split("\n\n\n", 1)[0])
    return {k: v["value"] for k, v in params.items()}


def run(d, n=400000):
    g = collector_params()
    c = g["f1_f2"] / 2; a = c + g["f1_vertex"]; b2 = a * a - c * c
    om_target = d.get("solid_angle_sr", g["solid_angle_sr"])
    hole = math.radians(g["hole_half_angle"])
    rim = math.acos(math.cos(hole) - om_target / (2 * math.pi))
    rng = random.Random(7); hits = 0
    for _ in range(n):
        u = 2 * rng.random() - 1; ph = 2 * math.pi * rng.random(); s = math.sqrt(1 - u * u)
        dx, dy, dz = u, s * math.cos(ph), s * math.sin(ph)
        # ray from F1 (origin) to ellipsoid centred at (c,0,0): ((x-c)/a)^2 + (y^2+z^2)/b2 = 1
        A = dx * dx / (a * a) + (dy * dy + dz * dz) / b2; B = -2 * c * dx / (a * a); C = c * c / (a * a) - 1
        t = (-B + math.sqrt(B * B - 4 * A * C)) / (2 * A)
        x = t * dx
        if x < 0:
            ang = math.atan2(math.hypot(t * dy, t * dz), -x)   # polar angle from -x
            if hole <= ang <= rim:
                hits += 1
    frac_sphere = hits / n
    sphere_power = 2 * d["CE_2pi"] * d["P_mainpulse_W"]
    p_if = sphere_power * frac_sphere * d["R_collector"]
    return [p_if / 250.0, frac_sphere * 4 * math.pi / 5.5, d["v_droplet_m_s"] / d["f_Hz"] / 1.6e-3]


if __name__ == "__main__":
    base = {k: v["value"] for k, v in json.loads((Path(__file__).parent / "inputs.json").read_text()).items()}
    if "--json-input" in sys.argv:
        base.update(json.loads(sys.argv[sys.argv.index("--json-input") + 1]))
    print(json.dumps({"output": run(base)}))
