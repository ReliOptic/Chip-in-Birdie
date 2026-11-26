/**
 * DTA scene interaction: the model is the only interface.
 * Hover → highlight + anchored label; dwell/long-press/Enter → lift-out with
 * tolerance shell and source pose; hold `?` → blocker map; semantic zoom
 * fades exterior parts; shift-drag on a surface → section plane; drag a
 * `manipulable` part → builder's physics callback; Esc → default pose.
 *
 * Three.js is injected. The reducer is pure so the gesture logic is testable
 * without a DOM. No DOM widgets are created except one transient label and a
 * visually hidden live region for assistive technology.
 */
import { labelFor, pickPart } from "./evidence-layer.mjs";

export const MODES = Object.freeze({ IDLE: "idle", HOVER: "hover", LIFTED: "lifted" });
export const DEFAULT_DWELL_MS = 600;
export const MAX_RESPONSE_MS = 100;

export function initialState() {
  return { mode: MODES.IDLE, hoverId: null, liftedId: null, pressAt: null, pressId: null,
    focusIndex: -1, blockerHeld: false };
}

/** Pure gesture reducer. `ids` is the ordered pickable part list (for keyboard cycling). */
export function reduce(state, event, { ids = [], dwellMs = DEFAULT_DWELL_MS } = {}) {
  const s = { ...state };
  switch (event.type) {
    case "point": // pointer moved; partId null = empty space
      if (s.mode === MODES.LIFTED) { s.hoverId = event.partId; return s; }
      s.hoverId = event.partId;
      s.mode = event.partId ? MODES.HOVER : MODES.IDLE;
      return s;
    case "press":
      s.pressAt = event.t; s.pressId = event.partId ?? s.hoverId;
      return s;
    case "tick":
      if (s.pressAt !== null && s.pressId && event.t - s.pressAt >= dwellMs) {
        s.mode = MODES.LIFTED; s.liftedId = s.pressId; s.hoverId = s.pressId; s.pressAt = null;
      }
      return s;
    case "release": {
      const wasTap = s.pressAt !== null && event.t - s.pressAt < dwellMs;
      s.pressAt = null;
      if (wasTap && s.mode !== MODES.LIFTED) { // touch tap behaves like hover
        s.hoverId = s.pressId; s.mode = s.pressId ? MODES.HOVER : MODES.IDLE;
      }
      if (wasTap && s.mode === MODES.LIFTED) {
        if (!s.pressId) { s.mode = MODES.IDLE; s.liftedId = null; s.hoverId = null; }
        else s.hoverId = s.pressId; // inspect another part while one is lifted
      }
      s.pressId = null;
      return s;
    }
    case "activate": { // Enter / keyboard
      const id = s.hoverId ?? ids[s.focusIndex] ?? null;
      if (id) { s.mode = MODES.LIFTED; s.liftedId = id; s.hoverId = id; }
      return s;
    }
    case "cycle": {
      if (!ids.length) return s;
      s.focusIndex = ((s.focusIndex + event.dir) % ids.length + ids.length) % ids.length;
      s.hoverId = ids[s.focusIndex];
      if (s.mode !== MODES.LIFTED) s.mode = MODES.HOVER;
      return s;
    }
    case "escape":
      return { ...initialState(), blockerHeld: s.blockerHeld, focusIndex: s.focusIndex };
    case "blocker":
      s.blockerHeld = !!event.held;
      return s;
    default:
      return s;
  }
}

/** World point → CSS pixel position inside the renderer element; `behind` when off-camera. */
export function projectToScreen(THREE, worldPoint, camera, width, height) {
  const v = worldPoint.clone().project(camera);
  return { x: (v.x + 1) / 2 * width, y: (1 - v.y) / 2 * height, behind: v.z > 1 || v.z < -1 };
}

/** Exterior opacity as a function of camera distance: 0 (inside) … 1 (far). */
export function exteriorOpacity(distance, near, far) {
  if (!(far > near)) throw new Error("exteriorReveal needs far > near");
  return Math.min(1, Math.max(0, (distance - near) / (far - near)));
}

/** Lift offset along the card's assembly axis (default +Y), scaled to the part. */
export function liftOffset(THREE, handle, factor = 0.3) {
  const axis = new THREE.Vector3(...(handle.card.assembly_axis ?? [0, 1, 0])).normalize();
  return axis.multiplyScalar(handle.size.length() * factor);
}

/** Section plane through `point` with `normal`, pushed `offset` along the normal. */
export function sectionPlane(THREE, normal, point, offset = 0) {
  const n = normal.clone().normalize();
  const p = point.clone().addScaledVector(n, offset);
  return new THREE.Plane().setFromNormalAndCoplanarPoint(n, p);
}

function hiddenLiveRegion(doc) {
  const el = doc.createElement("div");
  el.setAttribute("aria-live", "polite");
  Object.assign(el.style, { position: "absolute", width: "1px", height: "1px", overflow: "hidden",
    clip: "rect(0 0 0 0)", whiteSpace: "nowrap" });
  return el;
}

function labelElement(doc) {
  const wrap = doc.createElement("div");
  wrap.className = "dta-label";
  Object.assign(wrap.style, { position: "absolute", pointerEvents: "none", left: 0, top: 0,
    transition: "opacity 120ms", opacity: 0, font: "500 13px/1.3 system-ui, sans-serif", whiteSpace: "nowrap" });
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, { position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" });
  const line = doc.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("stroke", "currentColor"); line.setAttribute("stroke-width", "1");
  svg.appendChild(line);
  const text = doc.createElement("span");
  const sub = doc.createElement("span");
  Object.assign(sub.style, { display: "block", opacity: 0.7, fontSize: "11px" });
  const tag = doc.createElement("a");
  Object.assign(tag.style, { marginLeft: "0.5em", opacity: 0.7, pointerEvents: "auto" });
  wrap.append(svg, text, tag, sub);
  return { wrap, line, text, sub, tag };
}

/**
 * Attach the interaction controller. Options:
 *  THREE, scene, camera, renderer, handles (from applyEvidenceGrade), controls (OrbitControls-like, optional),
 *  defaultPose {position:[3], target:[3]}, bibliographyHref(sourceId) → URL,
 *  exteriorReveal {near, far} (defaults from scene bounds), onDragPart(partId, deltaNdc, event),
 *  onLabelValue(card) → string shown after the label, dwellMs, document.
 */
export function createInteraction(opts) {
  const { THREE, scene, camera, renderer, handles, controls = null, dwellMs = DEFAULT_DWELL_MS } = opts;
  if (!THREE || !scene || !camera || !renderer?.domElement || !Array.isArray(handles)) {
    throw new Error("THREE, scene, camera, renderer and handles are required");
  }
  const doc = opts.document ?? renderer.domElement.ownerDocument;
  const canvas = renderer.domElement;
  const byId = new Map(handles.map((h) => [h.card.part_id, h]));
  const ids = handles.map((h) => h.card.part_id);
  const raycaster = new THREE.Raycaster();
  raycaster.params.Line = { threshold: 0.02 };
  let state = initialState();
  let lastPointer = { x: 0, y: 0 };
  let section = null; // {plane, normal, start:{x,y}, point}
  const restPositions = new Map(handles.map((h) => [h.card.part_id, h.mesh.position.clone()]));
  const targetPositions = new Map(handles.map((h) => [h.card.part_id, h.mesh.position.clone()]));
  const outlineRest = new Map(handles.filter((h) => h.outline).map((h) => [h.card.part_id, h.outline.position.clone()]));
  const offsets = new Map(handles.map((h) => [h.card.part_id, new THREE.Vector3()])); // explode / kinematic offsets
  const bounds = new THREE.Box3().setFromObject(scene);
  const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius || 1;
  const reveal = opts.exteriorReveal ?? { near: radius * 0.9, far: radius * 1.6 };
  const defaultPose = opts.defaultPose ?? {
    position: camera.position.toArray(), target: (controls?.target ?? new THREE.Vector3()).toArray() };
  let cameraGoal = null;
  const live = hiddenLiveRegion(doc);
  const label = labelElement(doc);
  canvas.parentElement?.append(live, label.wrap);
  if (!canvas.hasAttribute("tabindex")) canvas.setAttribute("tabindex", "0");
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ndc = (ev) => {
    const r = canvas.getBoundingClientRect();
    return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1));
  };
  const hitAt = (ev) => {
    raycaster.setFromCamera(ndc(ev), camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    return { partId: pickPart(hits), hit: hits[0] ?? null };
  };

  function dispatch(event) {
    const next = reduce(state, event, { ids, dwellMs });
    if (next !== state) { applyEffects(state, next); state = next; }
  }

  function applyEffects(prev, next) {
    for (const h of handles) {
      const id = h.card.part_id;
      const target = h.outline ?? h.mesh;
      const mat = target.material;
      const isHover = id === next.hoverId, isLifted = id === next.liftedId;
      let opacity = h.baseOpacity;
      if (next.liftedId && !isLifted) opacity = h.baseOpacity * 0.25;
      else if (next.hoverId && !isHover) opacity = h.baseOpacity * 0.7;
      else if (isHover && h.outline) opacity = 0.9; // unknown envelope answers the hover
      mat.userData.dtaInteractionOpacity = opacity;
      if (mat.emissive) mat.emissive.setScalar(isHover || isLifted ? 0.12 : 0);
      if (h.shell) h.shell.visible = !next.blockerHeld || h.card.missing.length > 0;
    }
    const lifted = next.liftedId ? byId.get(next.liftedId) : null;
    if (lifted && prev.liftedId !== next.liftedId && lifted.card.source_pose) cameraGoal = lifted.card.source_pose;
    if (!next.liftedId && prev.liftedId) cameraGoal = defaultPose;
    updateLabel(next);
  }

  function updateLabel(s) {
    const h = s.hoverId ? byId.get(s.hoverId) : null;
    if (!h) { label.wrap.style.opacity = 0; live.textContent = ""; return; }
    const card = h.card;
    const mode = card.evidence_grade === "E4_unknown" ? "missing" : "hover";
    const value = s.mode === MODES.LIFTED && card.sigma_m > 0
      ? `± ${formatSigma(card.sigma_m)}` : opts.onLabelValue?.(card);
    const l = labelFor(card, mode, { value });
    label.text.textContent = l.text;
    label.sub.textContent = l.sub ?? (s.mode === MODES.LIFTED ? card.source_ids?.[0] ?? "" : "");
    if (l.sourceTag && opts.bibliographyHref) {
      label.tag.textContent = l.sourceTag; label.tag.href = opts.bibliographyHref(l.sourceTag);
    } else { label.tag.textContent = ""; label.tag.removeAttribute("href"); }
    label.wrap.style.opacity = 1;
    live.textContent = `${l.text}${l.sub ? ". " + l.sub : ""}. ${card.evidence_grade.replace("_", " ")}, confidence ${Math.round(card.confidence * 100)} percent.`;
  }

  function positionLabel() {
    const h = state.hoverId ? byId.get(state.hoverId) : null;
    if (!h) return;
    const anchorWorld = (h.outline ?? h.mesh).localToWorld(h.center.clone());
    const { x, y, behind } = projectToScreen(THREE, anchorWorld, camera, canvas.clientWidth, canvas.clientHeight);
    if (behind) { label.wrap.style.opacity = 0; return; }
    const dx = x < canvas.clientWidth / 2 ? 48 : -48;
    const lx = x + dx, ly = y - 36;
    label.wrap.style.transform = `translate(${lx}px, ${ly}px) translate(${dx < 0 ? "-100%" : "0"}, -100%)`;
    label.line.setAttribute("x1", dx < 0 ? label.wrap.offsetWidth : 0);
    label.line.setAttribute("y1", label.wrap.offsetHeight);
    label.line.setAttribute("x2", (dx < 0 ? label.wrap.offsetWidth : 0) - dx);
    label.line.setAttribute("y2", label.wrap.offsetHeight + 36);
  }

  /** Call every frame with elapsed seconds; returns the current state. */
  function update(dt = 1 / 60) {
    const k = reduced ? 1 : Math.min(1, dt * 10);
    for (const h of handles) {
      const id = h.card.part_id;
      targetPositions.get(id).copy(restPositions.get(id)).add(offsets.get(id));
      if (id === state.liftedId) targetPositions.get(id).add(liftOffset(THREE, h));
      h.mesh.position.lerp(targetPositions.get(id), k);
      if (h.outline) {
        const delta = targetPositions.get(id).clone().sub(restPositions.get(id));
        h.outline.position.lerp(outlineRest.get(id).clone().add(delta), k);
      }
      const mat = (h.outline ?? h.mesh).material;
      let goal = mat.userData.dtaInteractionOpacity ?? h.baseOpacity;
      if (h.card.exterior && !state.liftedId) {
        const dist = camera.position.distanceTo(controls?.target ?? new THREE.Vector3());
        goal *= exteriorOpacity(dist, reveal.near, reveal.far);
      }
      if (state.blockerHeld && h.card.missing.length === 0) goal = Math.min(goal, 0.15);
      mat.transparent = mat.transparent || goal < 1;
      mat.opacity += (goal - mat.opacity) * k;
    }
    if (cameraGoal) {
      camera.position.lerp(new THREE.Vector3(...cameraGoal.position), k * 0.6);
      if (controls?.target) { controls.target.lerp(new THREE.Vector3(...cameraGoal.target), k * 0.6); controls.update?.(); }
      else camera.lookAt(new THREE.Vector3(...cameraGoal.target));
      if (camera.position.distanceTo(new THREE.Vector3(...cameraGoal.position)) < 1e-3) cameraGoal = null;
    }
    positionLabel();
    return state;
  }

  const onMove = (ev) => {
    lastPointer = { x: ev.clientX, y: ev.clientY };
    if (section) {
      const d = ((ev.clientY - section.start.y) / canvas.clientHeight) * radius * 2;
      renderer.clippingPlanes = [sectionPlane(THREE, section.normal, section.point, d)];
      return;
    }
    if (state.pressId && byId.get(state.pressId)?.card.manipulable && opts.onDragPart && ev.buttons) {
      if (controls) controls.enabled = false;
      opts.onDragPart(state.pressId, ndc(ev), ev);
      return;
    }
    dispatch({ type: "point", partId: hitAt(ev).partId, t: performance.now() });
  };
  const onDown = (ev) => {
    const { partId, hit } = hitAt(ev);
    if (ev.shiftKey && hit?.face) {
      const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      section = { normal, point: hit.point.clone(), start: { x: ev.clientX, y: ev.clientY } };
      if (controls) controls.enabled = false;
      return;
    }
    dispatch({ type: "point", partId, t: performance.now() });
    dispatch({ type: "press", partId, t: performance.now() });
  };
  const onUp = (ev) => {
    if (section) { section = null; if (controls) controls.enabled = true; return; }
    if (controls) controls.enabled = true;
    dispatch({ type: "release", t: performance.now() });
  };
  const onKey = (ev) => {
    if (ev.key === "Escape") { renderer.clippingPlanes = []; dispatch({ type: "escape" }); }
    else if (ev.key === "Enter") dispatch({ type: "activate" });
    else if (ev.key === "Tab") { ev.preventDefault(); dispatch({ type: "cycle", dir: ev.shiftKey ? -1 : 1 }); }
    else if (ev.key === "?" && ev.type === "keydown") dispatch({ type: "blocker", held: true });
  };
  const onKeyUp = (ev) => { if (ev.key === "?" ) dispatch({ type: "blocker", held: false }); };
  const onDbl = (ev) => { if (!hitAt(ev).partId) { renderer.clippingPlanes = []; dispatch({ type: "escape" }); } };
  let ticker = null;
  function attach() {
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("dblclick", onDbl);
    canvas.addEventListener("keydown", onKey);
    canvas.addEventListener("keyup", onKeyUp);
    ticker = setInterval(() => dispatch({ type: "tick", t: performance.now() }), 50);
    return api;
  }
  function dispose() {
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("dblclick", onDbl);
    canvas.removeEventListener("keydown", onKey);
    canvas.removeEventListener("keyup", onKeyUp);
    clearInterval(ticker); live.remove(); label.wrap.remove();
  }
  /** External motion (explode, kinematics) adds to the rest position; the lift gesture stacks on top. */
  function setPartOffset(partId, vec) { offsets.get(partId)?.copy(vec); }
  const api = { attach, update, dispose, dispatch, setPartOffset, ids, get state() { return state; } };
  return api;
}

function formatSigma(sigmaM) {
  if (sigmaM >= 1) return `${sigmaM.toFixed(2)} m`;
  if (sigmaM >= 0.001) return `${(sigmaM * 1000).toFixed(sigmaM * 1000 >= 10 ? 0 : 1)} mm`;
  return `${(sigmaM * 1e6).toFixed(0)} µm`;
}
