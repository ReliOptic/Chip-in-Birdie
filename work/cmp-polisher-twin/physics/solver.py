#!/usr/bin/env python3
"""PRODUCTION solver — rotary CMP: relative-velocity kinematics + saturating removal law (SI).
Kinematics (head and platen co-rotating, wafer point at radius r, angle θ in the head frame, centre offset e):
  |V|² = (ω_p−ω_c)² r² + ω_p² e² + 2 ω_p (ω_p−ω_c) r e cos θ
Removal law (counter-hypothesis to linear Preston, chosen because the LK data saturate):
  RR = a·P·V / (1 + b·P·V)   — a, b calibrated on TWO LK points (1.0 and 2.0 psi); 1.5 and 2.5 psi are held out.
Zones: n equal-area annuli; zone k pressure P_k. Output: radial removal profile, area-weighted mean, WIWNU (1σ/mean)."""
import hashlib, json, math, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
PSI = 6894.757
A_MIN = 1e-10 / 60  # Å/min → m/s


def val(i, k):
    return float(i[k]["value"])


def omegas(i):
    return 2 * math.pi * val(i, "platen_rpm") / 60, 2 * math.pi * val(i, "head_rpm") / 60


def speed(i, r, th):
    wp, wc = omegas(i); e = val(i, "e_m")
    return math.sqrt(max((wp - wc) ** 2 * r * r + wp * wp * e * e + 2 * wp * (wp - wc) * r * e * math.cos(th), 0))


def calibrate(i):
    """Solve a, b from the two calibration points at the wafer-average velocity of the recipe."""
    V = mean_speed(i)
    x1, y1 = val(i, "cal_P1_psi") * PSI * V, val(i, "cal_RR1_A_min") * A_MIN
    x2, y2 = val(i, "cal_P2_psi") * PSI * V, val(i, "cal_RR2_A_min") * A_MIN
    # y = a x/(1+b x) → 1/y = 1/(a x) + b/a  (linear in 1/x)
    s = (1 / y2 - 1 / y1) / (1 / x2 - 1 / x1); c = 1 / y1 - s / x1
    a = 1 / s; b = c * a
    return a, b


def mean_speed(i, nr=40, nt=72):
    R = val(i, "r_wafer_m"); acc = w = 0
    for j in range(nr):
        r = R * (j + 0.5) / nr
        for k in range(nt):
            acc += speed(i, r, 2 * math.pi * k / nt) * r; w += r
    return acc / w


def zone_of(i, r):
    n = int(val(i, "n_zones")); R = val(i, "r_wafer_m")
    return min(n - 1, int(n * (r / R) ** 2))


def profile(i, zone_psi=None, nr=40, nt=72):
    a, b = calibrate(i)
    n = int(val(i, "n_zones")); zp = zone_psi or [val(i, "zone_psi")] * n
    R = val(i, "r_wafer_m"); rows = []
    for j in range(nr):
        r = R * (j + 0.5) / nr; P = zp[zone_of(i, r)] * PSI; s = 0
        for k in range(nt):
            x = P * speed(i, r, 2 * math.pi * k / nt); s += a * x / (1 + b * x)
        rows.append({"r_m": r, "zone": zone_of(i, r), "RR_A_min": s / nt / A_MIN})
    wsum = sum(x["r_m"] for x in rows)
    mean = sum(x["RR_A_min"] * x["r_m"] for x in rows) / wsum
    sd = math.sqrt(sum((x["RR_A_min"] - mean) ** 2 * x["r_m"] for x in rows) / wsum)
    return {"rows": rows, "mean_A_min": mean, "wiwnu": sd / mean, "a": a, "b": b, "V_mean_m_s": mean_speed(i)}


def main():
    i = json.loads((HERE / "inputs.json").read_text())
    sha = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    meta = {"solver": "physics/solver.py", "solver_version": "1.0.0", "solver_sha256": sha, "units": "SI", "seed": 0}
    st = HERE / "state"; st.mkdir(exist_ok=True)
    nom = profile(i)
    (st / "design-point.json").write_text(json.dumps({**meta, **{k: v for k, v in nom.items() if k != "rows"}}, indent=2))
    # pressure table for the browser: uniform pressure sweep 0.5–3.0 psi and single-zone perturbations
    table = {"uniform": [], "zone_bump": []}
    for k in range(26):
        p = 0.5 + 0.1 * k; pr = profile(i, [p] * 5, nr=20, nt=36)
        table["uniform"].append({"psi": p, "mean_A_min": pr["mean_A_min"], "wiwnu": pr["wiwnu"], "zone_RR": [sum(x["RR_A_min"] for x in pr["rows"] if x["zone"] == z) / max(1, sum(1 for x in pr["rows"] if x["zone"] == z)) for z in range(5)]})
    (st / "pressure-table.json").write_text(json.dumps({**meta, **table}, indent=1))
    with open(st / "trajectory.jsonl", "w") as fh:
        for k in range(61):
            t = k * 1.0; fh.write(json.dumps({"solver_sha256": sha, "units": "SI", "seed": 0, "t_s": t, "removed_A": nom["mean_A_min"] * t / 60}) + "\n")
    print(json.dumps({k: v for k, v in nom.items() if k != "rows"}, indent=1))


if __name__ == "__main__":
    sys.exit(main())
