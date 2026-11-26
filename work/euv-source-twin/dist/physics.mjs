/**
 * Browser side of the EUV source state. Reads data/physics.json (physics/solver.py: energy chain + timing line).
 * Shows: tin droplet stream at true 1.6 mm pitch (dots enlarged, declared), drive-laser cone through the collector
 * aperture, plasma flash at F1 on each pulse, collected EUV cone F1→collector→IF whose opacity is the solver's P_IF.
 * Input: drag the droplet generator along its axis = laser-to-droplet timing error (Δt = offset / v).
 * Time runs at display_time_scale; no physics is computed here beyond table lookup.
 */
export function createPhysics(THREE, scene, root, data) {
  const mm = 0.001, d = data, rows = d.timing.rows;
  const g = new THREE.Group(); scene.add(g);
  // droplets (radius exaggerated ×~45 so they read; pitch is true)
  const n = 90, pitch = d.droplet_spacing_m;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0006, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 1, roughness: 0.25 }), n);
  g.add(drops);
  const plasma = new THREE.Mesh(new THREE.SphereGeometry(0.004, 20, 16), new THREE.MeshBasicMaterial({ color: 0xd9c8ff, transparent: true, opacity: 0 }));
  g.add(plasma);
  const glowLight = new THREE.PointLight(0xb8a6ff, 0, 0.6); g.add(glowLight);
  // drive laser: from final-focus module through the aperture to F1
  const laser = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.17, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
  laser.rotation.z = -Math.PI / 2; laser.position.set(-0.085, 0, 0); g.add(laser);
  // collected EUV: cone from collector rim to IF (F2)
  const L = d.f1_f2_m, rimR = d.collector_rim_r_m, rimX = d.collector_rim_x_m;
  const euv = new THREE.Mesh(new THREE.ConeGeometry(rimR, L - rimX, 64, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x8f6bff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  euv.rotation.z = -Math.PI / 2; euv.position.set((rimX + L) / 2, 0, 0); g.add(euv);
  const gen = root.getObjectByName("droplet_generator");
  const state = { offset_m: 0, phase: 0, row: rows[Math.floor(rows.length / 2)], last: null, flash: 0, k: 0 };
  const lookup = (off) => {
    const dt = off / d.v_droplet_m_s;
    let best = rows[0];
    for (const r of rows) if (Math.abs(r.dt_s - dt) < Math.abs(best.dt_s - dt)) best = r;
    return best;
  };
  const m4 = new THREE.Matrix4();
  return {
    state,
    step(t) {
      const dt = state.last == null ? 0 : Math.min(0.5, t - state.last); state.last = t;
      const simDt = dt * d.display_time_scale;
      state.phase += simDt * d.v_droplet_m_s;               // metres travelled
      const shift = state.phase % pitch;
      // droplets travel -z from nozzle (z_tip) to catcher; the stream is displaced by the drag offset
      for (let i = 0; i < n; i++) {
        const z = d.nozzle_z_m - shift - i * pitch + state.offset_m * 0;  // timing error does not move the stream
        m4.makeTranslation(0, 0, z); drops.setMatrixAt(i, m4);
      }
      drops.instanceMatrix.needsUpdate = true;
      const pulses = Math.floor(state.phase / pitch);
      if (pulses !== state.k) { state.k = pulses; state.flash = 1; }
      state.flash *= Math.exp(-dt * 6);
      state.row = lookup(state.offset_m);
      const h = state.row.hit;
      plasma.material.opacity = 0.9 * state.flash * h; plasma.scale.setScalar(0.6 + 0.8 * state.flash);
      plasma.position.set(0, 0, -state.offset_m);          // where the laser actually meets the stream
      glowLight.intensity = 3 * state.flash * h;
      euv.material.opacity = 0.22 * h * (0.55 + 0.45 * state.flash);
      if (gen) gen.position.z = state.offset_m;              // the generator the user dragged
      window.dtaState = { t_s: t, offset_m: state.offset_m, ...state.row, solver_sha256: d.solver_sha256 };
    },
    onDragPart(partId, _ndc, ev) {
      if (partId !== "p-droplet-generator") return;
      state.offset_m = Math.max(-80e-6, Math.min(80e-6, state.offset_m + (ev.movementY || 0) * 1e-6));
    },
    labelValue(card) {
      const r = state.row;
      switch (card.part_id) {
        case "p-droplet-generator": return `Δt ${(r.dt_s * 1e9).toFixed(0)} ns`;
        case "p-collector": return `≤ ${r.P_IF_max_W.toFixed(0)} W to IF`;
        case "p-intermediate-focus": return `≤ ${r.P_IF_max_W.toFixed(0)} W`;
        case "p-final-focus-optics": return `${(d.P_mainpulse_W / 1000).toFixed(1)} kW on droplet`;
        default: return null;
      }
    },
  };
}
