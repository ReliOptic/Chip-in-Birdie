/** Optional visual-scene adapter. Imports no domain taxonomy and no Three.js runtime. */

/**
 * Export a *real* Three.js scene and its renderer's first-frame pixels to DTA's
 * open-world twin-export contract. The supplied `world` remains authoritative;
 * extracted render meshes are only visual evidence, not verified physics.
 *
 * If the renderer cannot produce a nonempty PNG (e.g. browser/CORS restrictions),
 * capture fails instead of inventing a scene reference.
 */
export function exportThreeJsTwin({
  twin,
  scene,
  camera,
  renderer,
  world = {},
  narrative = {},
  evidence = [],
  unknowns = [],
  chunks = [],
  maxObjects = 100000,
  imageId = "first-frame",
}) {
  if (!twin?.id || !scene?.traverse || !camera || !renderer?.domElement?.toDataURL) {
    throw new Error("Real twin.id, scene.traverse, camera, and renderer.domElement.toDataURL are required");
  }
  if (!Number.isSafeInteger(maxObjects) || maxObjects < 1) {
    throw new Error("maxObjects must be a positive integer");
  }
  const evidenceIds = new Set();
  for (const entry of evidence) {
    if (!entry || typeof entry.id !== "string" || !entry.id.trim() || evidenceIds.has(entry.id)) {
      throw new Error("Evidence entries must have unique nonempty IDs");
    }
    evidenceIds.add(entry.id);
  }
  const validateMatrix = (values, label) => {
    if (!Array.isArray(values) || values.length !== 16 || !values.every(Number.isFinite)) {
      throw new Error(label + " must be a finite 4×4 matrix");
    }
    return values;
  };
  scene.updateMatrixWorld?.(true);
  camera.updateMatrixWorld?.(true);
  const nodes = [];
  const seenIds = new Set();
  scene.traverse((object) => {
    if (nodes.length >= maxObjects) {
      throw new Error(`Scene exceeds maxObjects=${maxObjects}; export a real subset/chunk instead`);
    }
    if (!object.uuid || !object.matrixWorld?.toArray) {
      throw new Error("scene.traverse encountered an object lacking a stable ID or world matrix");
    }
    const stableId = object.userData?.dtaId;
    if (stableId !== undefined && (typeof stableId !== "string" || !stableId.trim())) {
      throw new Error("source-managed dtaId must be a nonempty string");
    }
    const nodeId = stableId || object.uuid;
    if (seenIds.has(nodeId)) {
      throw new Error("Duplicated scene identity: " + nodeId);
    }
    seenIds.add(nodeId);
    const node = {
      id: nodeId,
      id_origin: object.userData?.dtaId ? "source-twin-stable-id" : "runtime-renderer-uuid",
      parent_id: object.parent ? (object.parent.userData?.dtaId || object.parent.uuid) : null,
      name: object.name || null,
      type: object.type || null,
      visible: object.visible !== false,
      world_matrix: validateMatrix(object.matrixWorld.toArray(), nodeId + ".world_matrix"),
    };
    if (Array.isArray(object.userData?.evidenceIds)) {
      const refs = object.userData.evidenceIds;
      if (new Set(refs).size !== refs.length ||
          refs.some((id) => typeof id !== "string" || !evidenceIds.has(id))) {
        throw new Error("Scene node " + nodeId + " references missing/duplicate evidence IDs");
      }
      node.evidence_ids = [...refs];
    }
    if (object.geometry) {
      const geometry = object.geometry;
      if (!geometry.boundingBox && geometry.computeBoundingBox) geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      if (box?.min?.toArray && box?.max?.toArray) {
        const min = box.min.toArray(), max = box.max.toArray();
        if (min.length !== 3 || max.length !== 3 ||
            ![...min, ...max].every(Number.isFinite) ||
            min.some((n, i) => n > max[i])) {
          throw new Error("Invalid bounding box for " + nodeId);
        }
        node.local_aabb = { min, max };
      }
    }
    nodes.push(node);
  });
  renderer.render(scene, camera);
  let frame;
  try {
    frame = renderer.domElement.toDataURL("image/png");
  } catch (cause) {
    throw new Error("Renderer capture unavailable; check canvas ownership and CORS", { cause });
  }
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(frame) || frame.length < 40) {
    throw new Error("Renderer returned an invalid or empty PNG frame");
  }
  const cameraData = {
    id: camera.uuid || null,
    type: camera.type || null,
    world_matrix: camera.matrixWorld?.toArray
      ? validateMatrix(camera.matrixWorld.toArray(), "camera.world_matrix") : null,
    projection_matrix: camera.projectionMatrix?.toArray
      ? validateMatrix(camera.projectionMatrix.toArray(), "camera.projection_matrix") : null,
  };
  return {
    schema: "dta.twin-export/v1",
    twin,
    world: {
      ...world,
      visual_observation: {
        source: "live-threejs-renderer",
        nodes,
        camera: cameraData,
        warning: "Render meshes and screen pixels do not prove mechanical, physical, or commercial specifications",
      },
    },
    media: [{ id: imageId, kind: "image", data_url: frame, camera: cameraData }],
    narrative,
    evidence,
    unknowns,
    chunks,
  };
}

