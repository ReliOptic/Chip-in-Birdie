#!/usr/bin/env python3
"""PRODUCTION solver — LPP EUV source energy chain and droplet/pulse kinematics (SI).
P_IF,max = P_mp · CE(2π) · (Ω/2π) · R   (upper bound: gas absorption, IF clipping, spectral filtering not modelled)
Timing: a laser-to-droplet delay error Δt shifts the droplet by v·Δt; hit fraction = exp(-(vΔt)²/(2σ²)), σ = D_mp/4
(Gaussian overlap — an assumption, graded E3). Outputs physics/state/{design-point.json, timing-line.json}."""
import hashlib, json, math, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent


def val(inp, k):
    return float(inp[k]["value"])


def chain(inp):
    P, ce, om, R = val(inp, "P_mainpulse_W"), val(inp, "CE_2pi"), val(inp, "solid_angle_sr"), val(inp, "R_collector")
    inband = P * ce                       # W into 2π sr, in-band
    collected = inband * om / (2 * math.pi)
    p_if = collected * R
    f, v, d = val(inp, "f_Hz"), val(inp, "v_droplet_m_s"), val(inp, "d_droplet_m")
    return {"P_inband_2pi_W": inband, "P_collected_W": collected, "P_IF_max_W": p_if, "E_pulse_IF_max_J": p_if / f,
            "droplet_spacing_m": v / f, "tin_mass_flow_kg_s": val(inp, "rho_tin_kg_m3") * math.pi * d ** 3 / 6 * f,
            "heat_not_collected_W": P - p_if}


def hit_fraction(inp, dt):
    sigma = val(inp, "D_mainpulse_m") / 4
    x = val(inp, "v_droplet_m_s") * dt
    return math.exp(-x * x / (2 * sigma * sigma))


def main():
    inp = json.loads((HERE / "inputs.json").read_text())
    sha = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    dp = chain(inp)
    meta = {"solver": "physics/solver.py", "solver_version": "1.0.0", "solver_sha256": sha, "units": "SI", "seed": 0}
    st = HERE / "state"; st.mkdir(exist_ok=True)
    (st / "design-point.json").write_text(json.dumps({**meta, **dp}, indent=2))
    rows = []
    for i in range(-40, 41):
        dt = i * 0.05e-6                                  # ±2 µs timing error
        h = hit_fraction(inp, dt)
        rows.append({"dt_s": dt, "offset_m": val(inp, "v_droplet_m_s") * dt, "hit": h, "P_IF_max_W": dp["P_IF_max_W"] * h})
    (st / "timing-line.json").write_text(json.dumps({**meta, "rows": rows}, indent=1))
    with open(st / "trajectory.jsonl", "w") as fh:
        for k in range(200):                              # 4 ms of nominal operation: droplet k hit at t_k = k/f
            t = k / val(inp, "f_Hz")
            fh.write(json.dumps({"solver_sha256": sha, "units": "SI", "seed": 0, "t_s": t, "droplet": k, "E_pulse_IF_max_J": dp["E_pulse_IF_max_J"]}) + "\n")
    print(json.dumps(dp, indent=1))


if __name__ == "__main__":
    sys.exit(main())
