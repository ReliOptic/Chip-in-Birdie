#!/usr/bin/env python3
"""INDEPENDENT ORACLE — time-domain kinematics, no shared code with solver.py. Tracks material points of the wafer in the
lab frame while platen and head rotate, takes the pad velocity at each point minus the wafer-point velocity by finite
differences of positions, integrates removal over one beat period with the same calibrated law re-derived here.
Adapter: oracle.py --json-input '{...}' → {"output": [mean RR/1e4 Å/min, WIWNU×10, V_mean/2 m/s]}"""
import json, math, sys
from pathlib import Path


def run(d):
    wp, wc = 2 * math.pi * d["platen_rpm"] / 60, 2 * math.pi * d["head_rpm"] / 60
    e, R, n = d["e_m"], d["r_wafer_m"], int(d["n_zones"])
    PSI, AMIN = 6894.757, 1e-10 / 60
    def vel(r, phi0, t, h=1e-5):
        def pos_rel(tt):  # wafer point in platen-fixed frame
            xw = e + r * math.cos(phi0 + wc * tt); yw = r * math.sin(phi0 + wc * tt)
            c, s = math.cos(-wp * tt), math.sin(-wp * tt)
            return xw * c - yw * s, xw * s + yw * c
        (x1, y1), (x2, y2) = pos_rel(t - h), pos_rel(t + h)
        return math.hypot(x2 - x1, y2 - y1) / (2 * h)
    pts = [(R * (j + 0.5) / 30, 2 * math.pi * k / 48) for j in range(30) for k in range(48)]
    T = 2 * math.pi / max(abs(wp - wc), 1e-9) if abs(wp - wc) > 1e-6 else 2 * math.pi / wc
    ts = [T * q / 24 for q in range(24)]
    Vbar = sum(vel(r, ph, 0.0) * r for r, ph in pts) / sum(r for r, _ in pts)
    x1, y1 = d["cal_P1_psi"] * PSI * Vbar, d["cal_RR1_A_min"] * AMIN
    x2, y2 = d["cal_P2_psi"] * PSI * Vbar, d["cal_RR2_A_min"] * AMIN
    b = (x2 * y1 - x1 * y2) / (x1 * x2 * (y2 - y1)) * -1 if False else (y2 * x1 - y1 * x2) / (x1 * x2 * (y1 - y2))
    a = y1 * (1 + b * x1) / x1
    P = d.get("zone_psi", 1.5) * PSI
    ring = {}
    for r, ph in pts:
        rr = sum(a * P * vel(r, ph, t) / (1 + b * P * vel(r, ph, t)) for t in ts) / len(ts)
        ring.setdefault(r, []).append(rr)
    prof = [(r, sum(v) / len(v) / AMIN) for r, v in sorted(ring.items())]
    w = sum(r for r, _ in prof); m = sum(r * v for r, v in prof) / w
    sd = math.sqrt(sum(r * (v - m) ** 2 for r, v in prof) / w)
    return [m / 1e4, sd / m * 10, Vbar / 2]


if __name__ == "__main__":
    base = {k: v["value"] for k, v in json.loads((Path(__file__).parent / "inputs.json").read_text()).items()}
    if "--json-input" in sys.argv:
        base.update(json.loads(sys.argv[sys.argv.index("--json-input") + 1]))
    print(json.dumps({"output": run(base)}))
