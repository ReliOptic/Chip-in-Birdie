/**
 * DTA in-scene evidence layer. Encodes evidence grade, ±σ and missing data in
 * the twin's own material, geometry and motion (references/in-scene-evidence-experience.md).
 * Three.js is injected (pass the module namespace) so this file pins no version
 * and imports no domain taxonomy. It renders no panels, cards or buttons.
 */

export const GRADES = Object.freeze(["E1_measured", "E2_photomatched", "E3_inferred", "E4_unknown"]);
const MAX_LABEL_WORDS = 8;
const BREATH_PERIOD_S = 6;

/** Validate rationale cards; returns a list of error strings (empty = valid). */
export function validateEvidenceCards(cards) {
  const errors = [];
  if (!Array.isArray(cards)) return ["part rationale must be an array"];
  const seen = new Set();
  for (const c of cards) {
    const id = c?.part_id ?? "?";
    if (seen.has(id)) errors.push(`${id}: duplicate part_id`);
    seen.add(id);
    if (!GRADES.includes(c?.evidence_grade)) errors.push(`${id}: evidence_grade must be one of ${GRADES.join("|")}`);
    const conf = c?.confidence;
    if (typeof conf !== "number" || !(conf >= 0 && conf <= 1)) errors.push(`${id}: confidence must be a number in [0,1]`);
    if (typeof c?.sigma_m !== "number" || !(c.sigma_m >= 0) || !Number.isFinite(c.sigma_m)) errors.push(`${id}: sigma_m must be a finite number ≥ 0`);
    const missing = c?.missing;
    if (!Array.isArray(missing) || missing.some((m) => !m?.what || !m?.resolves_with)) {
      errors.push(`${id}: missing must be an array of {what, resolves_with}`);
    } else if (["E3_inferred", "E4_unknown"].includes(c.evidence_grade) && missing.length === 0) {
      errors.push(`${id}: ${c.evidence_grade} requires at least one missing entry`);
    }
    if (c?.evidence_grade === "E1_measured" && typeof conf === "number" && conf < 0.9) errors.push(`${id}: E1 confidence must be ≥ 0.9`);
    if (c?.evidence_grade === "E4_unknown" && conf !== 0) errors.push(`${id}: E4 confidence must be 0`);
    if (typeof c?.label !== "string" || !c.label.trim() || c.label.trim().split(/\s+/).length > MAX_LABEL_WORDS) {
      errors.push(`${id}: label must be 1–${MAX_LABEL_WORDS} words`);
    }
    const vec3 = (v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
    if (c?.assembly_axis !== undefined && (!vec3(c.assembly_axis) || c.assembly_axis.every((x) => x === 0))) {
      errors.push(`${id}: assembly_axis must be a nonzero [x,y,z]`);
    }
    for (const flag of ["exterior", "manipulable"]) {
      if (c?.[flag] !== undefined && typeof c[flag] !== "boolean") errors.push(`${id}: ${flag} must be boolean`);
    }
    if (c?.source_pose !== undefined && !(vec3(c.source_pose?.position) && vec3(c.source_pose?.target))) {
      errors.push(`${id}: source_pose must be {position:[x,y,z], target:[x,y,z]}`);
    }
  }
  return errors;
}

function envelopeOf(THREE, mesh) {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  return { size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}

/**
 * Apply the fixed grade grammar to one mesh. Returns a handle used by tick(),
 * setBlockerMap() and completeness(). `exaggeration` is one declared factor for
 * the whole twin; never tune it per part.
 */
export function applyEvidenceGrade(THREE, mesh, card, { exaggeration = 1 } = {}) {
  const errs = validateEvidenceCards([card]);
  if (errs.length) throw new Error(errs.join("; "));
  if (!mesh?.isMesh) throw new Error(`${card.part_id}: a real THREE.Mesh is required`);
  if (!(exaggeration > 0)) throw new Error("exaggeration must be > 0");
  const { size, center } = envelopeOf(THREE, mesh);
  const handle = { card, mesh, shell: null, outline: null, size, center, sigma: card.sigma_m * exaggeration, baseOpacity: 1 };
  mesh.userData.dta = { partId: card.part_id, grade: card.evidence_grade, sigma_m: card.sigma_m,
    confidence: card.confidence, sourceIds: card.source_ids ?? [], missing: card.missing };

  const grade = card.evidence_grade;
  if (grade === "E3_inferred") {
    const m = mesh.material.clone();
    const gray = new THREE.Color(0.6, 0.6, 0.62);
    if (m.color) m.color.lerp(gray, 0.6);
    m.transparent = true; m.opacity = 0.35; m.depthWrite = false;
    if ("roughness" in m) m.roughness = Math.max(m.roughness ?? 0.5, 0.8);
    mesh.material = m;
    handle.baseOpacity = 0.35;
  }
  if (grade === "E4_unknown") {
    // Never show invented geometry: only the known bounding envelope as a sparse outline.
    mesh.visible = false;
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z));
    // Dark, so the envelope reads on the restrained light backgrounds the scene rules call for.
    const mat = new THREE.LineDashedMaterial({ color: 0x2b2b29, dashSize: Math.max(size.length() * 0.02, 1e-6),
      gapSize: Math.max(size.length() * 0.03, 1e-6), transparent: true, opacity: 0.55 });
    const outline = new THREE.LineSegments(edges, mat);
    outline.computeLineDistances();
    outline.userData.dta = { ...mesh.userData.dta, role: "unknown-envelope" };
    mesh.updateMatrix();
    outline.position.copy(center).applyMatrix4(mesh.matrix);
    outline.quaternion.copy(mesh.quaternion);
    outline.scale.copy(mesh.scale);
    if (!mesh.parent) throw new Error(`${card.part_id}: E4 part must be in a scene graph`);
    mesh.parent.add(outline);
    handle.outline = outline;
    handle.baseOpacity = 0.55;
  }
  if ((grade === "E2_photomatched" || grade === "E3_inferred") && handle.sigma > 0) {
    // Dark neutral halo: reads as a soft tolerance band on the light, restrained backgrounds the scene rules require.
    const shellMat = new THREE.MeshBasicMaterial({ color: 0x2b2b29, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
    const shell = new THREE.Mesh(mesh.geometry, shellMat);
    shell.userData.dta = { ...mesh.userData.dta, role: "tolerance-shell" };
    shell.raycast = () => {}; // picking resolves to the part, not its shell
    mesh.add(shell);
    handle.shell = shell;
    setShellOffset(handle, handle.sigma);
  }
  return handle;
}

function setShellOffset(h, offset) {
  const s = (axis) => (h.size[axis] > 0 ? Math.max((h.size[axis] + 2 * offset) / h.size[axis], 1e-3) : 1);
  h.shell.scale.set(s("x"), s("y"), s("z"));
  // keep scaling about the part's own envelope centre
  h.shell.position.set(h.center.x * (1 - h.shell.scale.x), h.center.y * (1 - h.shell.scale.y), h.center.z * (1 - h.shell.scale.z));
}

/** Breathe every tolerance shell between −σ and +σ. E1/E4 stay still. */
export function tick(handles, tSeconds, { reducedMotion = false } = {}) {
  const phase = reducedMotion ? 1 : Math.sin((2 * Math.PI * tSeconds) / BREATH_PERIOD_S);
  for (const h of handles) if (h.shell) setShellOffset(h, h.sigma * phase);
}

/** Blocker map: parts with open `missing` items stay lit, verified parts fade. */
export function setBlockerMap(handles, on, { fadedOpacity = 0.15 } = {}) {
  for (const h of handles) {
    const blocker = h.card.missing.length > 0;
    const target = h.outline ?? h.mesh;
    const mat = target.material;
    if (!mat.userData.dtaOriginal) mat.userData.dtaOriginal = { transparent: mat.transparent, opacity: mat.opacity };
    if (on && !blocker) { mat.transparent = true; mat.opacity = fadedOpacity; }
    else { mat.transparent = mat.userData.dtaOriginal.transparent; mat.opacity = mat.userData.dtaOriginal.opacity; }
    if (h.shell) h.shell.visible = !on || blocker;
  }
}

/** One-line in-scene label. mode: "hover" | "missing". Never longer than 8 words + value + tag. */
export function labelFor(card, mode = "hover", { value } = {}) {
  if (mode === "missing" && card.missing.length) {
    const m = card.missing[0];
    return { text: `missing · ${m.what}`, sub: `needs · ${m.resolves_with}`, sourceTag: null };
  }
  const tag = card.source_ids?.[0] ?? null;
  const v = value ? ` · ${value}` : "";
  return { text: `${card.label}${v}`, sub: null, sourceTag: tag };
}

/** Resolve a raycast hit list to the first graded part (skips shells/helpers). */
export function pickPart(intersections) {
  for (const hit of intersections ?? []) {
    let o = hit.object;
    while (o) {
      if (o.userData?.dta?.partId && o.userData.dta.role !== "tolerance-shell") return o.userData.dta.partId;
      o = o.parent;
    }
  }
  return null;
}

/**
 * Envelope-volume shares by grade. This is the honest completeness readout
 * the scene already shows visually; use it for QA, not as an on-screen chip.
 */
export function completeness(handles) {
  const vol = Object.fromEntries(GRADES.map((g) => [g, 0]));
  for (const h of handles) {
    const s = h.mesh.scale;
    vol[h.card.evidence_grade] += h.size.x * h.size.y * h.size.z * Math.abs(s.x * s.y * s.z);
  }
  const total = Object.values(vol).reduce((a, b) => a + b, 0) || 1;
  const share = Object.fromEntries(GRADES.map((g) => [g, vol[g] / total]));
  return { share, evidenced: share.E1_measured + share.E2_photomatched,
    blockers: handles.filter((h) => h.card.missing.length).map((h) => h.card.part_id) };
}
