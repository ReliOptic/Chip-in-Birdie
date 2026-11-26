#!/usr/bin/env python3
"""PRODUCTION solver — 0-D two-spool separate-flow turbofan cycle (constant cp per stream, SI units)
plus a fan-law similarity operating line and first-order spool response.

Inputs: physics/inputs.json (every value carries source_id/grade). Outputs:
  physics/state/design-point.json, physics/state/operating-line.json, physics/state/trajectory.jsonl
The browser twin reads only these files (copied to dist/data/physics.json); it adds no physics.
"""
import hashlib, json, math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CP_C, G_C = 1004.5, 1.40      # cold air J/kg/K
CP_H, G_H = 1148.0, 1.333     # combustion products
R = 287.05


def v(inp, k):
    return float(inp[k]["value"])


def compress(Tt, pr, eta, cp=CP_C, g=G_C):
    return Tt * (1 + (pr ** ((g - 1) / g) - 1) / eta)


def nozzle(m, Tt, Pt, P0, cp, g):
    """Convergent nozzle: gross thrust (N) and exit static T. Choked if Pt/P0 > critical."""
    crit = ((g + 1) / 2) ** (g / (g - 1))
    if Pt / P0 > crit:
        Te = Tt * 2 / (g + 1); Pe = Pt / crit
    else:
        Pe = P0; Te = Tt * (P0 / Pt) ** ((g - 1) / g)
    Ve = math.sqrt(max(2 * cp * (Tt - Te), 0.0))
    if Ve < 1e-6:
        return 0.0, 0.0, Te
    rho = Pe / (R * Te); A = m / (rho * Ve)
    return m * Ve + A * (Pe - P0), Ve, Te


def cycle(inp, n1=1.0):
    """Cycle at fan-law similarity point n1 (fraction of design N1). Returns station state dict."""
    T0, P0 = v(inp, "T0"), v(inp, "P0")
    m = v(inp, "mass_flow") * n1
    bpr = v(inp, "bpr")
    fpr = 1 + (v(inp, "fpr") - 1) * n1 ** 2
    opr = 1 + (v(inp, "opr") - 1) * n1 ** 2.4
    T4 = T0 + (v(inp, "T4") - T0) * n1 ** 1.6
    eta_f, eta_c, eta_t, eta_m = v(inp, "eta_fan"), v(inp, "eta_comp"), v(inp, "eta_turb"), v(inp, "eta_mech")
    pi_d, pi_b, pi_n = v(inp, "pi_inlet"), v(inp, "pi_burner"), v(inp, "pi_nozzle")
    lhv, eta_b = v(inp, "lhv"), v(inp, "eta_burner")
    mc, mb = m / (1 + bpr), m * bpr / (1 + bpr)
    Pt2, Tt2 = P0 * pi_d, T0
    Tt13 = compress(Tt2, fpr, eta_f); Pt13 = Pt2 * fpr
    Tt3 = compress(Tt2, opr, eta_c); Pt3 = Pt2 * opr
    # heat addition with one enthalpy reference (298.15 K): products' cp over T3→T4; fuel enters at reference
    f = CP_H * (T4 - Tt3) / (eta_b * lhv - CP_H * (T4 - 298.15))
    Pt4 = Pt3 * pi_b
    mh = mc * (1 + f)
    # HPT drives core compression above the fan root (Tt25 ≈ Tt13 on the core streamline)
    w_hpc = mc * CP_C * (Tt3 - Tt13) / eta_m
    T45 = T4 - w_hpc / (mh * CP_H)
    Pt45 = Pt4 * (1 - (1 - T45 / T4) / eta_t) ** (G_H / (G_H - 1))
    w_lp = m * CP_C * (Tt13 - Tt2) / eta_m
    T5 = T45 - w_lp / (mh * CP_H)
    Pt5 = Pt45 * (1 - (1 - T5 / T45) / eta_t) ** (G_H / (G_H - 1))
    Fb, Vb, _ = nozzle(mb, Tt13, Pt13 * pi_n, P0, CP_C, G_C)
    Fc, Vc, _ = nozzle(mh, T5, Pt5 * pi_n, P0, CP_H, G_H)
    F = Fb + Fc
    wf = f * mc
    return {"n1_frac": n1, "thrust_N": F, "thrust_bypass_N": Fb, "thrust_core_N": Fc, "fuel_kg_s": wf,
            "tsfc_kg_per_N_h": wf * 3600 / F if F > 0 else None, "mass_flow_kg_s": m, "fpr": fpr, "opr": opr,
            "Tt13_K": Tt13, "Tt3_K": Tt3, "Tt4_K": T4, "Tt45_K": T45, "Tt5_K": T5, "Pt3_Pa": Pt3,
            "V_bypass_m_s": Vb, "V_core_m_s": Vc, "far": f, "pt5_over_p0": Pt5 / P0}


def operating_line(inp, n=41):
    lo = v(inp, "n1_idle_frac")
    rows = []
    for i in range(n):
        n1 = lo + (1.0 - lo) * i / (n - 1)
        s = cycle(inp, n1)
        # N2 follows N1 on a similarity relation anchored at idle and takeoff (both inputs carry sources)
        k = (n1 - lo) / (1 - lo)
        s["n2_frac"] = v(inp, "n2_idle_frac") + (1 - v(inp, "n2_idle_frac")) * k ** 0.6
        s["N1_rpm"] = n1 * v(inp, "N1_100pct_rpm"); s["N2_rpm"] = s["n2_frac"] * v(inp, "N2_100pct_rpm")
        rows.append(s)
    return rows


def transient(inp, line, t_end=12.0, dt=0.02):
    """Throttle snap idle→takeoff at t=1 s; N2 first-order lag (tau_n2), N1 lags N2 via steady line."""
    tau = v(inp, "tau_n2_s")
    n2_lo, n2_hi = line[0]["n2_frac"], line[-1]["n2_frac"]
    n2 = n2_lo; out = []; t = 0.0
    while t <= t_end + 1e-9:
        demand = n2_hi if t >= 1.0 else n2_lo
        n2 += (demand - n2) * dt / tau
        out.append({"t_s": round(t, 4), **interp_by_n2(line, n2)})
        t += dt
    return out


def interp_by_n2(line, n2):
    for a, b in zip(line, line[1:]):
        if a["n2_frac"] <= n2 <= b["n2_frac"]:
            w = (n2 - a["n2_frac"]) / (b["n2_frac"] - a["n2_frac"])
            return {k: (a[k] + (b[k] - a[k]) * w if isinstance(a[k], (int, float)) and a[k] is not None else a[k]) for k in a}
    return dict(line[0] if n2 < line[0]["n2_frac"] else line[-1])


def main():
    inp = json.loads((HERE / "inputs.json").read_text())
    sha = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    meta = {"solver": "physics/solver.py", "solver_version": "1.0.0", "solver_sha256": sha, "units": "SI",
            "seed": 0, "inputs_sha256": hashlib.sha256((HERE / "inputs.json").read_bytes()).hexdigest()}
    st = HERE / "state"; st.mkdir(exist_ok=True)
    dp = cycle(inp, 1.0)
    (st / "design-point.json").write_text(json.dumps({**meta, **dp}, indent=2))
    line = operating_line(inp)
    (st / "operating-line.json").write_text(json.dumps({**meta, "rows": line}, indent=1))
    tr = transient(inp, line)
    with open(st / "trajectory.jsonl", "w") as fh:
        for row in tr:
            fh.write(json.dumps({**{k: meta[k] for k in ("solver_version", "solver_sha256", "units", "seed")}, **row}) + "\n")
    print(json.dumps({k: round(x, 4) if isinstance(x, float) else x for k, x in dp.items()}, indent=1))


if __name__ == "__main__":
    sys.exit(main())
