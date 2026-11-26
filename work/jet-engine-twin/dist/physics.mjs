/**
 * Browser side of the canonical state. It reads data/physics.json (written by physics/solver.py:
 * operating line + transient constants + hashes) and only interpolates it — no new physics here.
 * Input: drag the fan vertically = throttle (N2 demand). N2 follows the solver's first-order lag
 * (same equation and tau as solver.transient); every other quantity is looked up on the solver's line.
 * Rotation is shown in declared slow motion (display_time_scale) to avoid stroboscopic aliasing.
 */
export function createPhysics(THREE, root, data) {
  const rows = data.rows;
  const lo = rows[0].n2_frac, hi = rows[rows.length - 1].n2_frac;
  const tau = data.tau_n2_s, timeScale = data.display_time_scale;
  const n1Parts = ["fan_rotor", "spinner", "booster_lpc", "lp_turbine", "lp_shaft"].map((n) => root.getObjectByName(n)).filter(Boolean);
  const n2Parts = ["hp_compressor", "hp_turbine", "hp_spool"].map((n) => root.getObjectByName(n)).filter(Boolean);
  const hot = [["combustor", "Tt4_K"], ["hp_turbine", "Tt45_K"], ["lp_turbine", "Tt5_K"], ["core_nozzle", "Tt5_K"]]
    .map(([n, k]) => [root.getObjectByName(n), k]).filter(([m]) => m);
  const state = { throttle: 0, n2: lo, row: rows[0], last: null, phase1: 0, phase2: 0 };
  const lerpRow = (n2) => {
    for (let i = 0; i < rows.length - 1; i++) {
      const a = rows[i], b = rows[i + 1];
      if (n2 >= a.n2_frac && n2 <= b.n2_frac) {
        const w = (n2 - a.n2_frac) / (b.n2_frac - a.n2_frac), o = {};
        for (const k in a) o[k] = typeof a[k] === "number" ? a[k] + (b[k] - a[k]) * w : a[k];
        return o;
      }
    }
    return n2 < lo ? rows[0] : rows[rows.length - 1];
  };
  // incandescence from computed total temperature (glow starts ~800 K, saturates ~1700 K)
  const glow = (T) => Math.min(1, Math.max(0, (T - 800) / 900));
  return {
    state,
    step(t) {
      const dt = state.last == null ? 0 : Math.min(0.05, t - state.last); state.last = t;
      const demand = lo + (hi - lo) * state.throttle;
      state.n2 += (demand - state.n2) * dt / tau;
      const r = (state.row = lerpRow(state.n2));
      state.phase1 += 2 * Math.PI * (r.N1_rpm / 60) * dt * timeScale;
      state.phase2 += 2 * Math.PI * (r.N2_rpm / 60) * dt * timeScale;
      for (const m of n1Parts) m.rotation.x = state.phase1;
      for (const m of n2Parts) m.rotation.x = state.phase2;
      for (const [m, k] of hot) {
        const g = glow(r[k]);
        if (m.material.emissive) { m.material.emissive.setRGB(1.0 * g, 0.38 * g * g, 0.08 * g * g * g); m.material.emissiveIntensity = 1.6 * g; }
      }
      window.dtaState = { t_s: t, throttle: state.throttle, ...r, solver_sha256: data.solver_sha256 };
    },
    onDragPart(partId, _ndc, ev) {
      if (partId !== "p-fan") return;
      state.throttle = Math.min(1, Math.max(0, state.throttle - (ev.movementY || 0) / 260));
    },
    labelValue(card) {
      const r = state.row, f = (x, d = 0) => x.toLocaleString("en-US", { maximumFractionDigits: d });
      switch (card.part_id) {
        case "p-fan": case "p-spinner": case "p-booster": case "p-lp-shaft": return `N1 ${f(r.N1_rpm)} rpm`;
        case "p-hpc": case "p-hp-shaft": return `N2 ${f(r.N2_rpm)} rpm`;
        case "p-combustor": return `Tt4 ${f(r.Tt4_K)} K`;
        case "p-hpt": return `Tt45 ${f(r.Tt45_K)} K`;
        case "p-lpt": case "p-exhaust-nozzle": return `Tt5 ${f(r.Tt5_K)} K`;
        case "p-thrust-reverser": case "p-fan-case": return `F ${f(r.thrust_N / 1000, 1)} kN`;
        default: return null;
      }
    },
  };
}
