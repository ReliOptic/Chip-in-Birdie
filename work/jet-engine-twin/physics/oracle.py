#!/usr/bin/env python3
"""INDEPENDENT ORACLE — same engine, different method: temperature-dependent cp(T) (air and
lean kerosene products), enthalpy/entropy-function integration, nozzle by numerical maximisation
of mass flux (no closed-form choke formula). Shares no code with solver.py.
Adapter: oracle.py --json-input '{...overrides}' -> {"output": [F/1e5 N, fuel kg/s, Tt5/1000 K, V19/300 m/s]}"""
import json, math, sys
from pathlib import Path

Rg = 287.05


def cp_air(T):  # J/kg/K, fit to standard dry-air tables 250–2000 K (Cengel Tab. A-2b trend), ±1%
    return 1002.5 + 0.05 * (T - 300) + 1.1e-4 * (T - 300) ** 2 - 6.0e-8 * (T - 300) ** 3 if T > 300 else 1004.0


def cp_gas(T, far):  # products: air cp raised ~ (1 + 2.3·far) — lean-combustion approximation
    return cp_air(T) * (1 + 2.3 * far)


def integ(f, a, b, n=60):
    h = (b - a) / n
    return h / 3 * (f(a) + f(b) + sum((4 if i % 2 else 2) * f(a + i * h) for i in range(1, n)))


def h_of(T, far=0.0):
    return integ(lambda t: cp_gas(t, far), 250.0, T)


def phi(T, far=0.0):
    return integ(lambda t: cp_gas(t, far) / t, 250.0, T)


def T_from_phi(target, far, guess):
    T = guess
    for _ in range(60):
        T -= (phi(T, far) - target) / (cp_gas(T, far) / T)
    return T


def T_from_h(target, far, guess):
    T = guess
    for _ in range(60):
        T -= (h_of(T, far) - target) / cp_gas(T, far)
    return T


def comp(T1, pr, eta):
    Ts = T_from_phi(phi(T1) + Rg * math.log(pr), 0.0, T1 * pr ** 0.286)
    dh = (h_of(Ts) - h_of(T1)) / eta
    return T_from_h(h_of(T1) + dh, 0.0, Ts)


def expand(T1, dh_req, eta, far):
    """Turbine: given actual enthalpy drop, return exit T and pressure ratio P1/P2."""
    T2 = T_from_h(h_of(T1, far) - dh_req, far, T1 * 0.8)
    T2s = T_from_h(h_of(T1, far) - dh_req / eta, far, T2)
    return T2, math.exp((phi(T1, far) - phi(T2s, far)) / Rg)


def nozzle(m, Tt, Pt, P0, far):
    ht = h_of(Tt, far)
    def state(P):
        Ts = T_from_phi(phi(Tt, far) - Rg * math.log(Pt / P), far, Tt * 0.85)
        V = math.sqrt(max(2 * (ht - h_of(Ts, far)), 0.0))
        return Ts, V, P / (Rg * Ts) * V
    # scan exit pressure from Pt down to P0; throat = max mass flux if reached before P0 (choked)
    best = None; P = Pt * 0.999
    while P >= P0:
        Ts, V, G = state(P)
        if best is None or G > best[3]:
            best = (P, Ts, V, G)
        P *= 0.995
    Pe, Ts, V, G = best if best[0] > P0 * 1.0005 else (P0, *state(P0))
    return m * V + (m / G) * (Pe - P0), V


def run(d):
    T0, P0, m, bpr = d["T0"], d["P0"], d["mass_flow"], d["bpr"]
    mc, mb = m / (1 + bpr), m - m / (1 + bpr)
    T13 = comp(T0, d["fpr"], d["eta_fan"]); P13 = P0 * d["pi_inlet"] * d["fpr"]
    T3 = comp(T0, d["opr"], d["eta_comp"]); P3 = P0 * d["pi_inlet"] * d["opr"]
    far = 0.02
    for _ in range(30):  # energy balance with products' enthalpy
        far = (h_of(d["T4"], far) - h_of(T3)) / (d["eta_burner"] * d["lhv"] - h_of(d["T4"], far) + h_of(298.15, far))
    mh = mc * (1 + far)
    w_hp = mc * (h_of(T3) - h_of(T13)) / d["eta_mech"]
    T45, pr_h = expand(d["T4"], w_hp / mh, d["eta_turb"], far)
    w_lp = m * (h_of(T13) - h_of(T0)) / d["eta_mech"]
    T5, pr_l = expand(T45, w_lp / mh, d["eta_turb"], far)
    P5 = P3 * d["pi_burner"] / pr_h / pr_l
    Fb, Vb = nozzle(mb, T13, P13 * d["pi_nozzle"], P0, 0.0)
    Fc, _ = nozzle(mh, T5, P5 * d["pi_nozzle"], P0, far)
    return [(Fb + Fc) / 1e5, far * mc, T5 / 1000, Vb / 300]


def main():
    base = {k: v["value"] for k, v in json.loads((Path(__file__).parent / "inputs.json").read_text()).items()}
    if "--json-input" in sys.argv:
        base.update(json.loads(sys.argv[sys.argv.index("--json-input") + 1]))
    print(json.dumps({"output": run(base)}))


if __name__ == "__main__":
    main()
