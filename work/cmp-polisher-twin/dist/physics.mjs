/**
 * Browser side of the CMP state (physics/solver.py → data/physics.json: pressure table of mean removal,
 * per-zone removal and WIWNU). Shows platen rotation (index mark per pad), head rotation, conditioner sweep
 * (19 sweeps/min, S014) and the computed per-zone removal as a heat ring on the station-1 wafer.
 * Input: drag a carrier head vertically = uniform down-force 0.5–3.0 psi. Lookup only; no new physics.
 */
export function createPhysics(THREE, scene, root, d) {
  const mm = 0.001, g = new THREE.Group(); scene.add(g);
  const st = (a) => [d.R_station_m * Math.cos(a * Math.PI / 180), -d.R_station_m * Math.sin(a * Math.PI / 180)];
  const marks = [0, 90, 180].map((a) => {
    const [x, z] = st(a), piv = new THREE.Group(); piv.position.set(x, 0.0006, z); g.add(piv);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(d.platen_r_m * 0.95, 0.0004, 0.006), new THREE.MeshBasicMaterial({ color: 0x5b4a2a }));
    bar.position.x = d.platen_r_m * 0.475; piv.add(bar); return piv;
  });
  // per-zone heat rings on the station-1 wafer (equal-area zones)
  const [wx, wz] = [d.R_station_m - d.e_m, 0];
  const rings = [];
  for (let k = 0; k < 5; k++) {
    const ri = d.r_wafer_m * Math.sqrt(k / 5), ro = d.r_wafer_m * Math.sqrt((k + 1) / 5);
    const m = new THREE.Mesh(new THREE.RingGeometry(Math.max(ri, 1e-4), ro, 96), new THREE.MeshBasicMaterial({ color: 0xd08040, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(wx, 0.0009, wz); g.add(m); rings.push(m);
  }
  const headMark = new THREE.Mesh(new THREE.BoxGeometry(d.r_wafer_m * 0.9, 0.0004, 0.004), new THREE.MeshBasicMaterial({ color: 0x222222 }));
  const headPiv = new THREE.Group(); headPiv.position.set(wx, 0.0011, wz); headMark.position.x = d.r_wafer_m * 0.45; headPiv.add(headMark); g.add(headPiv);
  const disk = root.getObjectByName("conditioner_disk"), arm = root.getObjectByName("conditioner_arm");
  const heads = root.getObjectByName("carrier_heads");
  const state = { psi: 1.5, row: null, last: null, tp: 0, th: 0, ts: 0 };
  const lookup = (psi) => d.table.reduce((b, r) => (Math.abs(r.psi - psi) < Math.abs(b.psi - psi) ? r : b));
  const heat = (x) => new THREE.Color().setHSL(0.62 - 0.62 * Math.min(1, Math.max(0, x)), 0.75, 0.5);
  return {
    state,
    step(t) {
      const dt = state.last == null ? 0 : Math.min(0.1, t - state.last); state.last = t;
      const s = dt * d.display_time_scale;
      state.tp += s * d.platen_rpm / 60 * 2 * Math.PI; state.th += s * d.head_rpm / 60 * 2 * Math.PI; state.ts += s;
      for (const m of marks) m.rotation.y = state.tp;
      headPiv.rotation.y = state.th;
      // conditioner sweep: sinusoid at 19 sweeps/min about the arm pivot (amplitude inferred to span the pad)
      const sw = 0.28 * Math.sin(2 * Math.PI * (19 / 60) * state.ts);
      if (arm && disk) {
        const pv = new THREE.Vector3(...d.cond_pivot);
        for (const o of [arm, disk]) {
          o.position.set(0, 0, 0); o.rotation.y = 0;
          o.position.sub(pv).applyAxisAngle(new THREE.Vector3(0, 1, 0), sw).add(pv); o.rotation.y = sw;
        }
      }
      const r = (state.row = lookup(state.psi));
      const lo = d.table[0].mean_A_min, hi = d.table[d.table.length - 1].mean_A_min;
      r.zone_RR.forEach((v, k) => { rings[k].material.color.copy(heat((v - lo) / (hi - lo))); rings[k].material.opacity = 0.75; });
      if (heads) heads.position.y = -0.004 * (state.psi - 1.5);   // visible press, exaggerated
      window.dtaState = { t_s: t, psi: state.psi, mean_A_min: r.mean_A_min, wiwnu: r.wiwnu, solver_sha256: d.solver_sha256 };
    },
    onDragPart(partId, _ndc, ev) {
      if (partId !== "p-carrier-head") return;
      state.psi = Math.max(0.5, Math.min(3.0, state.psi + (ev.movementY || 0) / 120));
    },
    labelValue(card) {
      const r = state.row; if (!r) return null;
      const f = (x) => Math.round(x).toLocaleString("en-US");
      switch (card.part_id) {
        case "p-carrier-head": return `${state.psi.toFixed(1)} psi`;
        case "p-wafer": return `${f(r.mean_A_min)} Å/min Cu`;
        case "p-membrane-zones": return `WIWNU ${(r.wiwnu * 100).toFixed(2)} %`;
        case "p-platen": case "p-pad": return `${d.platen_rpm} rpm`;
        default: return null;
      }
    },
  };
}
