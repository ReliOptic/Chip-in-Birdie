/**
 * DTA disassembly (explode) runtime. Reads cad/assembly.json placements and moves parts along
 * their real disassembly axes in `order` stages, driven by a pull gesture — no slider, no button.
 * Gestures: two-finger vertical drag (touch) or right-button drag (mouse) pulls the product apart;
 * ArrowUp/ArrowDown step it; Esc or a drag back reassembles. Offsets are handed to
 * scene-interaction's setPartOffset so the lift-out gesture still stacks on top.
 */

const UNIT_TO_M = { mm: 0.001, m: 1, in: 0.0254 };

/** Smoothstep 0..1. */
export const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/** Stage progress for a part of `order` when the global factor is f and there are `stages` orders. */
export function stageProgress(f, order, stages) {
  if (stages <= 1) return smooth(f);
  const span = 1 / stages;
  return smooth((f - order * span) / span);
}

/**
 * Pure: per-part offsets (metres) for explode factor f ∈ [0,1].
 * Returns Map(part_id → [x,y,z]). Children follow their parent's offset so sub-assemblies stay coherent.
 */
export function explodeOffsets(assembly, f) {
  const scale = UNIT_TO_M[assembly.units] ?? 0.001;
  const parts = assembly.parts ?? [];
  const orders = [...new Set(parts.map((p) => p.explode?.order ?? 0))].sort((a, b) => a - b);
  const stageOf = new Map(orders.map((o, i) => [o, i]));
  const own = new Map();
  for (const p of parts) {
    const ex = p.explode ?? { axis: [0, 1, 0], distance: 0, order: 0 };
    const len = Math.hypot(...ex.axis) || 1;
    const k = ex.distance * scale * stageProgress(f, stageOf.get(ex.order ?? 0), orders.length);
    own.set(p.part_id, ex.axis.map((a) => (a / len) * k));
  }
  const byId = new Map(parts.map((p) => [p.part_id, p]));
  const total = new Map();
  const resolve = (id, depth = 0) => {
    if (total.has(id)) return total.get(id);
    const p = byId.get(id);
    const mine = own.get(id) ?? [0, 0, 0];
    const parent = p?.parent && depth < 64 ? resolve(p.parent, depth + 1) : [0, 0, 0];
    const v = mine.map((x, i) => x + parent[i]);
    total.set(id, v);
    return v;
  };
  for (const p of parts) resolve(p.part_id);
  return total;
}

/**
 * Attach the pull gesture. `ui` is the scene-interaction api (needs setPartOffset); `controls` is
 * OrbitControls-like (pan is disabled: the right button / two fingers now pull the product apart).
 */
export function createExplode({ THREE, assembly, ui, canvas, controls = null, travelPx = 320, onChange = null }) {
  if (!THREE || !assembly?.parts || !ui?.setPartOffset || !canvas) throw new Error("THREE, assembly, ui and canvas are required");
  if (controls) { controls.enablePan = false; controls.mouseButtons && (controls.mouseButtons.RIGHT = null); controls.touches && (controls.touches.TWO = null); }
  let factor = 0, goal = 0, drag = null;
  const pointers = new Map();
  const apply = (f) => {
    goal = Math.min(1, Math.max(0, f));
  };
  const setFactor = (f) => { apply(f); factor = goal; push(); };
  const push = () => {
    for (const [id, v] of explodeOffsets(assembly, factor)) ui.setPartOffset(id, new THREE.Vector3(...v));
    onChange?.(factor);
  };
  const onDown = (ev) => {
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (ev.button === 2 || pointers.size === 2) {
      drag = { startY: centroidY(), startFactor: factor };
      if (controls) controls.enabled = false;
    }
  };
  const centroidY = () => [...pointers.values()].reduce((s, p) => s + p.y, 0) / Math.max(1, pointers.size);
  const onMove = (ev) => {
    if (!pointers.has(ev.pointerId)) return;
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (drag) apply(drag.startFactor + (drag.startY - centroidY()) / travelPx); // pull up = apart
  };
  const onUp = (ev) => {
    pointers.delete(ev.pointerId);
    if (drag && (pointers.size < 2 && ev.button !== 2 ? pointers.size === 0 : true)) { drag = null; if (controls) controls.enabled = true; }
    if (pointers.size === 0) { drag = null; if (controls) controls.enabled = true; }
  };
  const onKey = (ev) => {
    if (ev.key === "ArrowUp") { ev.preventDefault(); apply(goal + 0.1); }
    else if (ev.key === "ArrowDown") { ev.preventDefault(); apply(goal - 0.1); }
    else if (ev.key === "Escape") apply(0);
  };
  const onContext = (ev) => ev.preventDefault();
  function attach() {
    canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("keydown", onKey); canvas.addEventListener("contextmenu", onContext);
    return api;
  }
  function dispose() {
    canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("keydown", onKey); canvas.removeEventListener("contextmenu", onContext);
  }
  /** Call every frame before ui.update(). */
  function update(dt = 1 / 60) {
    if (Math.abs(goal - factor) > 1e-4) { factor += (goal - factor) * Math.min(1, dt * 8); push(); }
    else if (factor !== goal) { factor = goal; push(); }
    return factor;
  }
  const api = { attach, dispose, update, setFactor, get factor() { return factor; }, get goal() { return goal; } };
  return api;
}
