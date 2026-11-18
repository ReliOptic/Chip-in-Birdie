# S1E01 r4 · optional CPU 3D fallback

This is a Canvas-presented CPU triangle renderer of the existing Three.js scene,
not WebGL, recorded footage, or a poster substitute. WebGL remains the preferred
path. A WebGL creation failure must be caught before using a **fresh canvas** for
this renderer. Do not run `PMREMGenerator` or other WebGL-only helpers on it.

## Integration contract

`createSoftwareRenderer(T, {canvas, quality: 'balanced'})` exports:

- `render(scene, camera)`, `setSize(w,h,updateStyle=false)`, `setPixelRatio(n)`.
- `domElement`, `isSoftwareRenderer: true`, `backendLabel` and `info.render`.
- Harmless `shadowMap`, tone-mapping/exposure and output-color-space settings.
- `getContext()` is a **diagnostic adapter**, not a GL context. It supports only
  renderer identification and bottom-up RGBA/UNSIGNED_BYTE Canvas pixel readback.

Geometry is cached; hierarchy and instance transforms are evaluated for every
frame. A z-buffer determines opaque occlusion; transparency is depth sorted.
Smooth vertex lighting, perspective-correct texture coordinates, near clipping,
and a 384² directional shadow map are implemented. Lighting approximates diffuse
and specular response; PMREM, transmission, skinning and custom shaders are not
implemented. `info.render.calls` counts CPU mesh-instance/material submissions,
not GPU draw calls. Show the fallback identity to the viewer and in diagnostics.

## Checks actually performed

Command:

```bash
node episodes/S1E01/full/qa-software.mjs ASSETS_DIR OUTPUT_DIR
```

The exact vendored Three r170, original 33,644-triangle fab GLB, seven procedural
worlds and actual Node `@napi-rs/canvas` pixels were used. Eight 960×540 sample
frames passed reverse-visit pixel equality. Canvas readback matched the diagnostic
adapter. Additional pixel assertions passed for depth occlusion, actual transform
changes, inherited visibility, instancing, texture orientation and near clipping.
Eight PNGs were generated; representative fab/design/archive/testing/layers/return
frames were visually inspected. These are not browser or WebGL screenshots.

In the final local run, warm 800×450 render costs were 18–42 ms for seven procedural
worlds and 80 ms for the fab. Costs vary; these are Node CPU measurements, not
browser/GPU promises. Start the software path at 800×450 and measure the real
browser. Do not claim full PBR parity, listening, player QA or release approval.

## Tested source identities

| File | SHA-256 |
|---|---|
| `software-renderer.mjs` | `d9100eff41ce04e27aebf4c0bd9f0c57935ce3d7c002db85c5922dfcbdac8690` |
| `qa-software.mjs` | `f8c14b01a01c0ecec71e4c6450cce64ea68f701c4133537c6b4193ba28fe0fa1` |
| `worlds.mjs` | `3c25b7393428189f95181cb00bdcd14c789f11b3b650bee568c847db1219454f` |
| `mechanisms.mjs` | `d44df94eccf072bfab8972e1ad37bc0491e2ce77ca205a5f6156fe74013bb579` |

Any scene changes after these identities require rerunning the scoped checks.
