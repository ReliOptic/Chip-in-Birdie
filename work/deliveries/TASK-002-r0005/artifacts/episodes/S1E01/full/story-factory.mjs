/**
 * S1E01 R7: a human-scale factory and loading hall, not a factory-shaped chart.
 *
 * This is an ILLUSTRATIVE PLACE, NOT a reconstruction of a TSMC, Cirrus or
 * NVIDIA facility. Equipment envelopes, cassette counts, routes and timings
 * explain the commercial mechanism; they are not historical production data.
 * No machine operation or alleged 1997 failure mode is reconstructed here.
 *
 * One physical room and one absolute action clock survive the camera cuts.
 * Technique reference: aimotion 164 (shot coverage), not its demo art/style.
 */
export function createFactorySet(T, kit) {
  const root = new T.Group();
  root.name = 'factory-spatial-story / illustrative-not-reconstruction';
  root.userData = {
    kind: 'illustrative industrial environment', units: 'metres',
    historicalReconstruction: false,
    disclaimer: 'Illustrative process and business model. Not a historical factory reconstruction.',
  };
  const clamp = (x) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const segment = (p, a, b) => ease((p - a) / (b - a));
  const mix = (a, b, p) => a + (b - a) * p;
  const mix3 = (a, b, p) => a.map((v, i) => mix(v, b[i], p));
  const material = (color, roughness = .68, metalness = 0, extra = {}) =>
    kit.mat(color, roughness, metalness, extra);
  const P = {
    wall: material('#bdc7c6', .91), wallLow: material('#8faaa7', .79),
    ceiling: material('#d9dfd9', .9), seam: material('#667d7d', .8),
    paint: material('#d3d7c7', .62), cream: material('#e3ddc8', .68),
    dark: material('#243737', .71), rubber: material('#161f1e', .87),
    steel: material('#819799', .36, .62), brightSteel: material('#bdc8c5', .29, .63),
    screen: material('#172f2e', .37, .08), screenGlow: material('#9ca980', .48, .02),
    warm: material('#aa8b69', .91), yellow: material('#c5ac60', .78),
    green: material('#729b77', .43, .06, {emissive: '#355d3e', emissiveIntensity: .48}),
    amber: material('#b88b43', .48, .04),
    tube: material('#94a7a6', .44, .3), paper: material('#e3d8b9', .94),
    red: material('#8f4a40', .74), chip: material('#263f3e', .4, .08),
    die: material('#66877d', .27, .39),
    lamp: material('#e5eddf', .7, 0, {emissive: '#dbe2d1', emissiveIntensity: .45}),
    dockLamp: material('#e4cb92', .7, 0, {emissive: '#d6b77a', emissiveIntensity: .5}),
  };
  const boxGeometry = new T.BoxGeometry(1, 1, 1);
  const cylinderGeometry = new T.CylinderGeometry(1, 1, 1, 12);
  const pipeGeometry = new T.CylinderGeometry(1, 1, 1, 8);
  const transform = new T.Object3D();
  const textureList = [];

  function texture(width, height, draw) {
    const canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return null;
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    draw(context, width, height);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    textureList.push(map);
    return map;
  }

  // Seams, scuffs and contact wear belong to this physical floor, not the lens.
  const floorMap = texture(1024, 1024, (c, w, h) => {
    const rand = kit.seed(70131);
    c.fillStyle = '#819392'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const grey = 139 + Math.floor(rand() * 12);
      c.fillStyle = `rgb(${grey - 13},${grey + 4},${grey + 2})`;
      c.fillRect(x * 128 + 2, y * 128 + 2, 124, 124);
      c.strokeStyle = 'rgba(221,229,218,.15)'; c.lineWidth = 1;
      c.strokeRect(x * 128 + 3, y * 128 + 3, 123, 123);
    }
    for (let i = 0; i < 1350; i++) {
      const x = rand() * w, y = rand() * h;
      c.strokeStyle = `rgba(39,62,58,${.02 + rand() * .07})`;
      c.lineWidth = .2 + rand() * 1.5;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2 + rand() * 17, y + rand() * 2); c.stroke();
    }
  });
  if (floorMap) { floorMap.wrapS = floorMap.wrapT = T.RepeatWrapping; floorMap.repeat.set(2.4, 3.2); }
  const dockMap = texture(512, 512, (c, w, h) => {
    const rand = kit.seed(70132);
    c.fillStyle = '#817c6e'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2000; i++) {
      c.fillStyle = rand() > .5 ? 'rgba(44,38,30,.06)' : 'rgba(223,214,187,.08)';
      c.fillRect(rand() * w, rand() * h, 1 + rand() * 5, 1 + rand() * 3);
    }
    c.strokeStyle = '#6e695c'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, 256); c.lineTo(w, 256); c.moveTo(256, 0); c.lineTo(256, h); c.stroke();
  });
  if (dockMap) { dockMap.wrapS = dockMap.wrapT = T.RepeatWrapping; dockMap.repeat.set(3, 2); }
  P.floor = material('#ffffff', .78, .04, floorMap ? {map: floorMap} : {});
  P.dockFloor = material('#ffffff', .88, .01, dockMap ? {map: dockMap} : {});

  /** Batch rectilinear construction without erasing the room's actual geometry. */
  function builder(parent) {
    const batches = new Map();
    function box(w, h, d, m, x = 0, y = 0, z = 0, ry = 0) {
      if (!batches.has(m)) batches.set(m, []);
      batches.get(m).push({p: [x, y, z], s: [w, h, d], ry});
    }
    function done(prefix = 'built') {
      for (const [m, rows] of batches) {
        const mesh = new T.InstancedMesh(boxGeometry, m, rows.length);
        mesh.name = `${prefix} / ${rows.length} solid parts`;
        mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
        rows.forEach((row, i) => {
          transform.position.fromArray(row.p); transform.scale.fromArray(row.s);
          transform.rotation.set(0, row.ry, 0); transform.updateMatrix();
          mesh.setMatrixAt(i, transform.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        parent.add(mesh);
      }
    }
    return {box, done};
  }
  function solid(w, h, d, m, parent, x = 0, y = 0, z = 0) {
    const mesh = new T.Mesh(boxGeometry, m);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function rod(a, b, radius, m, parent = root, geometry = pipeGeometry) {
    const from = new T.Vector3(...a), to = new T.Vector3(...b), dir = to.clone().sub(from);
    const mesh = new T.Mesh(geometry, m);
    mesh.position.copy(from).add(to).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.scale.set(radius, dir.length(), radius);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function sign(text, w, h, parent, x, y, z, ry = 0, options = {}) {
    const plane = kit.label(text, w, h, {background: '#d8ded2', color: '#314543', size: 64, ...options});
    plane.position.set(x, y, z); plane.rotation.y = ry;
    plane.material.side = T.FrontSide;
    plane.name = `diegetic sign / ${text}`; parent.add(plane); return plane;
  }

  const hall = new T.Group(); hall.name = 'cleanroom architecture, world scale'; root.add(hall);
  const A = builder(hall);
  A.box(12, .16, 12, P.floor, 0, -.08, -2);
  A.box(12, .16, 7.5, P.dockFloor, 0, -.08, 7.75);
  // Full-height side and far walls anchor scale; an open foreground permits a
  // camera in the loading area without cutting through geometry.
  A.box(.2, 3.8, 17.5, P.wall, -6, 1.9, .75);
  A.box(.2, 3.8, 17.5, P.wall, 6, 1.9, .75);
  A.box(12, 3.8, .2, P.wall, 0, 1.9, -8);
  A.box(.025, .9, 12, P.wallLow, -5.89, .45, -2);
  A.box(.025, .9, 12, P.wallLow, 5.89, .45, -2);
  A.box(11.8, .9, .025, P.wallLow, 0, .45, -7.89);
  A.box(.08, .1, 17.5, P.dark, -5.85, .05, .75);
  A.box(.08, .1, 17.5, P.dark, 5.85, .05, .75);
  // Visible panel seams and columns supply foreground/midground/background.
  for (let z = -6.8; z <= 8; z += 2.4) {
    A.box(.035, 2.8, .035, P.seam, -5.87, 2.3, z);
    A.box(.035, 2.8, .035, P.seam, 5.87, 2.3, z);
  }
  for (const x of [-4.8, -2.4, 0, 2.4, 4.8]) A.box(.025, 2.8, .025, P.seam, x, 2.3, -7.87);
  for (const x of [-5.7, 5.7]) for (const z of [-6.7, -1.6, 3.65, 8.1]) A.box(.28, 3.6, .34, P.cream, x, 1.8, z);
  // The camera stays below the ceiling. Separate real panels create long
  // perspective lines rather than a single featureless backdrop.
  for (let z = -6.8; z <= 3; z += 2.4) {
    A.box(11.8, .08, 2.25, P.ceiling, 0, 3.75, z);
    A.box(11.8, .08, .1, P.steel, 0, 3.68, z + 1.18);
    for (const x of [-3.4, 0, 3.4]) {
      A.box(1.3, .055, .38, P.dark, x, 3.66, z);
      A.box(1.2, .035, .3, P.lamp, x, 3.62, z);
    }
  }
  A.box(12, .1, 5.5, P.warm, 0, 3.8, 6.75);
  for (const x of [-4, 0, 4]) {
    A.box(1.15, .13, .38, P.dark, x, 3.55, 6.8);
    A.box(1.06, .035, .29, P.dockLamp, x, 3.46, 6.8);
  }
  // Portal: manufacturing and dispatch remain recognisably different rooms.
  A.box(3.7, 3.7, .28, P.cream, -4.15, 1.85, 4);
  A.box(3.7, 3.7, .28, P.cream, 4.15, 1.85, 4);
  A.box(4.7, .65, .32, P.wallLow, 0, 3.38, 4);
  A.box(.15, 3.05, .36, P.steel, -2.3, 1.525, 4);
  A.box(.15, 3.05, .36, P.steel, 2.3, 1.525, 4);
  A.box(4.45, .04, .4, P.brightSteel, 0, .025, 4);
  // Painted route lines stay on the floor. They are ordinary safety markings,
  // not an animated diagram or unverified historical signage.
  for (const x of [-1.6, 1.6]) A.box(.045, .005, 11, P.yellow, x, .006, -1.6);
  A.box(3.2, .005, .05, P.yellow, 0, .006, 3.15);
  for (const z of [5.4, 7.2]) A.box(2.7, .005, .04, P.yellow, -3.9, .006, z);
  for (const x of [-5.25, -2.55]) A.box(.04, .005, 1.85, P.yellow, x, .006, 6.3);
  // Reserved bay is measurable floor space, not a floating future-factory icon.
  for (const x of [2.15, 5.15]) A.box(.045, .006, 2.7, P.yellow, x, .008, -4.65);
  for (const z of [-6, -3.3]) A.box(3.05, .006, .045, P.yellow, 3.65, .008, z);
  A.done('room construction');
  sign('MANUFACTURING', 2.05, .24, hall, 0, 3.35, 4.175);
  sign('DISPATCH', 1.35, .25, hall, -4.13, 2.8, 4.165, 0, {background: '#c8b189'});
  sign('RESERVED CAPACITY', 1.45, .22, hall, 3.8, 2.2, -7.875);
  // A light inside the architectural volume lets the actual ceiling remain a
  // ceiling. CPU fallback supports this light type too; no fake camera glow.
  const ceilingKey = new T.DirectionalLight('#e8ecdf', 1.5);
  ceilingKey.name = 'interior overhead illumination';
  ceilingKey.position.set(-.6, 3.5, -.8);
  ceilingKey.target.position.set(0, 0, -1.9);
  ceilingKey.castShadow = true;
  Object.assign(ceilingKey.shadow.camera, {left: -9, right: 9, top: 10, bottom: -10, near: .05, far: 28});
  ceilingKey.shadow.bias = -.0004;
  ceilingKey.shadow.mapSize.set(1024, 1024);
  root.add(ceilingKey, ceilingKey.target);
  // Short service branches, pipe straps and drops give an industrial ceiling.
  for (const x of [-2.15, -1.85, 1.85, 2.15]) {
    rod([x, 3.31, -7.3], [x, 3.31, 3.35], .045, P.tube, hall);
    for (const z of [-5.8, -2.4, 1]) rod([x, 3.31, z], [Math.sign(x) * 4.7, 3.31, z], .036, P.tube, hall);
  }
  for (const x of [-4.65, 4.65]) for (const z of [-5.8, -2.4, 1]) {
    rod([x, 3.31, z], [x, 2.25, z], .04, P.tube, hall);
  }

  function machine(name) {
    const g = new T.Group(); g.name = `illustrative enclosed process equipment / ${name}`;
    const B = builder(g);
    B.box(1.62, .15, 1.48, P.dark, 0, .16, 0);
    B.box(1.58, 1.66, 1.38, P.paint, 0, 1.05, 0);
    B.box(1.7, .18, 1.46, P.cream, 0, 1.97, 0);
    // Recessed doors, a restrained instrument panel, physical loading port.
    B.box(1.36, 1.32, .055, P.seam, 0, 1.05, .716);
    B.box(.83, 1.22, .06, P.cream, -.23, 1.05, .752);
    B.box(.035, .39, .045, P.dark, .12, 1.09, .803);
    B.box(.43, .48, .07, P.dark, .5, 1.42, .77);
    B.box(.34, .24, .015, P.screen, .5, 1.48, .813);
    B.box(.24, .012, .019, P.screenGlow, .5, 1.48, .826);
    B.box(.12, .012, .019, P.screenGlow, .44, 1.43, .826);
    B.box(.96, .075, .57, P.steel, -.23, .81, 1.0);
    B.box(.89, .38, .05, P.dark, -.23, 1.045, .81);
    B.box(.9, .035, .35, P.rubber, -.23, .862, .96);
    for (let i = 0; i < 8; i++) B.box(.29, .015, .018, P.dark, .49, .53 + i * .04, .795);
    for (const x of [-.63, .63]) for (const z of [-.48, .48]) B.box(.14, .15, .14, P.rubber, x, .075, z);
    B.box(.09, .16, .09, P.steel, .61, 2.13, -.43);
    B.box(.11, .1, .11, P.green, .61, 2.26, -.43);
    B.done('equipment envelope');
    sign(name, .39, .13, g, .49, 1.72, .82);
    return g;
  }
  const machinePositions = [
    [-3.72, -5.05, Math.PI / 2], [-3.72, -1.55, Math.PI / 2],
    [-3.72, 1.73, Math.PI / 2], [3.72, -1.55, -Math.PI / 2],
    [3.72, 1.73, -Math.PI / 2],
  ];
  for (let i = 0; i < machinePositions.length; i++) {
    const [x, z, y] = machinePositions[i], m = machine(`BAY 0${i + 1}`);
    m.position.set(x, 0, z); m.rotation.y = y; root.add(m);
  }
  const newMachine = machine('BAY 06');
  newMachine.name = 'reserved bay equipment / finite move-in montage';
  newMachine.rotation.y = -Math.PI / 2; root.add(newMachine);

  function trolley(name, deckHeight = .74) {
    const g = new T.Group(); g.name = name;
    const C = builder(g);
    C.box(1.08, .065, 1.55, P.steel, 0, deckHeight, 0);
    C.box(1.02, .045, 1.49, P.paint, 0, deckHeight + .05, 0);
    C.box(1.08, .045, 1.55, P.steel, 0, .26, 0);
    for (const x of [-.47, .47]) for (const z of [-.63, .63]) {
      C.box(.055, deckHeight - .21, .055, P.steel, x, (.21 + deckHeight) / 2, z);
      C.box(.1, .11, .09, P.steel, x, .155, z);
    }
    C.box(.055, .47, .055, P.brightSteel, -.47, deckHeight + .19, .67);
    C.box(.055, .47, .055, P.brightSteel, .47, deckHeight + .19, .67);
    C.box(.99, .055, .055, P.brightSteel, 0, deckHeight + .425, .67);
    C.done('trolley');
    const wheels = [];
    for (const x of [-.47, .47]) for (const z of [-.63, .63]) {
      const wheel = new T.Mesh(cylinderGeometry, P.rubber);
      wheel.scale.set(.105, .055, .105); wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, .105, z); wheel.castShadow = true; wheel.receiveShadow = true;
      g.add(wheel); wheels.push(wheel);
    }
    root.add(g); return {g, wheels, deckHeight};
  }
  function cassette(parent, x, y, z, variant = 0) {
    const g = new T.Group(); g.name = 'illustrative sealed lot carrier'; parent.add(g);
    g.position.set(x, y, z);
    const C = builder(g);
    C.box(.35, .045, .42, P.rubber, 0, .022, 0);
    C.box(.32, .32, .035, P.dark, 0, .2, -.18);
    C.box(.035, .32, .36, P.dark, -.16, .2, 0);
    C.box(.035, .32, .36, P.dark, .16, .2, 0);
    C.box(.32, .035, .36, P.steel, 0, .37, 0);
    C.box(.21, .04, .07, P.steel, 0, .43, 0);
    C.box(.3, .28, .03, P.paint, 0, .2, .185);
    C.box(.13, .09, .01, variant ? P.amber : P.paper, -.045, .24, .206);
    C.box(.055, .015, .012, P.dark, -.052, .257, .215);
    C.box(.08, .01, .012, P.dark, -.045, .228, .215);
    C.box(.035, .065, .02, P.rubber, .105, .18, .211);
    C.done('sealed carrier');
    return g;
  }
  const incoming = trolley('external-order trolley');
  const incomingLots = [];
  for (const x of [-.23, .23]) for (const z of [-.39, .16]) incomingLots.push(cassette(incoming.g, x, .815, z));
  sign('EXTERNAL WORK', .75, .15, incoming.g, 0, .53, .79, 0, {background: '#d9d1ba'});
  const returnCard = sign('RETURN TO OWN PLANT', .86, .12, incoming.g, 0, 1.27, .705, 0, {background: '#d4b978', color: '#3d382c'});

  const planned = trolley('scheduled incoming lot trolley');
  for (const x of [-.23, .23]) for (const z of [-.39, .16]) cassette(planned.g, x, .815, z, 1);
  sign('SCHEDULED LOT', .75, .15, planned.g, 0, .53, .79, 0, {background: '#d8c991'});
  // Two shelf carriers enter the loading port; their actual world paths are
  // preserved during the handoff and the following close-up.
  const bayCarrierA = cassette(root, 0, 0, 0, 1);
  const bayCarrierB = cassette(root, 0, 0, 0, 1);

  // A real dispatch bench, roll-up doorway and packed cases make the output
  // feel destined for another place instead of ending at an abstract bar.
  const dock = new T.Group(); dock.name = 'warm dispatch work area'; root.add(dock);
  const D = builder(dock);
  D.box(2.6, .11, .94, P.cream, -4.2, .92, 6.1);
  for (const x of [-5.32, -3.08]) for (const z of [5.74, 6.46]) D.box(.07, .87, .07, P.steel, x, .435, z);
  D.box(2.5, .06, .87, P.steel, -4.2, .28, 6.1);
  D.box(1.3, 1.06, .38, P.warm, 4.6, .53, 6.45);
  D.box(1.36, .06, .42, P.cream, 4.6, 1.09, 6.45);
  for (const z of [6.2, 6.7, 7.2]) {
    D.box(.8, .57, .68, P.warm, 3.5, .34, z);
    D.box(.09, .575, .69, P.paper, 3.5, .34, z);
  }
  for (const x of [-2.35, 2.35]) D.box(.12, 3.5, .25, P.steel, x, 1.75, 9.2);
  D.box(4.82, .32, .46, P.dark, 0, 3.58, 9.2);
  D.box(12, 3.6, .16, P.warm, 0, 1.8, 12);
  for (const x of [-4.2, 4.2]) D.box(3.5, 3.6, .24, P.warm, x, 1.8, 9.24);
  D.done('dispatch furnishings');
  const shutter = new T.Group(); shutter.name = 'dispatch shutter / opens before trolley leaves'; root.add(shutter);
  const S = builder(shutter);
  S.box(4.45, 3.35, .22, P.dark, 0, 1.675, 9.35);
  for (let y = .15; y <= 3.3; y += .22) S.box(4.38, .185, .14, P.warm, 0, y, 9.2);
  S.done('shutter slats');
  sign('OUTGOING', 1.6, .22, dock, 0, 3.43, 9.03, Math.PI, {background: '#c6ad83'});
  // A document resting on the bench is set dressing, with no invented figures.
  const ledger = solid(.35, .016, .46, P.paper, dock, -4.4, .992, 6.13);
  ledger.rotation.y = -.13;
  solid(.014, .014, .31, P.dark, dock, -4.1, 1.012, 6.12).rotation.y = .22;

  const output = trolley('output tray dispatch trolley', .84);
  sign('ACCEPTED PARTS', .8, .15, output.g, 0, .56, .79, 0, {background: '#d1ceb6'});
  sign('ACCEPTED PARTS', .8, .15, output.g, 0, .56, -.79, Math.PI, {background: '#d1ceb6'});
  const trayParts = builder(output.g);
  const chipPositions = [];
  for (const z of [-.4, .32]) {
    trayParts.box(.94, .035, .64, P.rubber, 0, .91, z);
    for (const x of [-.47, .47]) trayParts.box(.025, .05, .67, P.dark, x, .945, z);
    for (const dz of [-.32, .32]) trayParts.box(.95, .05, .025, P.dark, 0, .945, z + dz);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
      const x = -.36 + col * .144, zz = z - .225 + row * .15;
      // Raised dark dividers form a recognisable antistatic tray; empty cells
      // are as important as the chips that pass inspection.
      trayParts.box(.13, .009, .13, P.seam, x, .934, zz);
      trayParts.box(.112, .01, .112, P.rubber, x, .94, zz);
      chipPositions.push([x, .963, zz]);
    }
  }
  trayParts.done('dispatch tray pockets');
  const chips = new T.InstancedMesh(boxGeometry, P.chip, chipPositions.length);
  const dice = new T.InstancedMesh(boxGeometry, P.die, chipPositions.length);
  chips.name = 'accepted packaged chips / count illustrative'; dice.name = 'package contact faces';
  for (let i = 0; i < chipPositions.length; i++) {
    transform.position.fromArray(chipPositions[i]); transform.rotation.set(0, 0, 0);
    transform.scale.set(.099, .027, .099); transform.updateMatrix(); chips.setMatrixAt(i, transform.matrix);
    transform.position.y += .017; transform.scale.set(.051, .009, .051); transform.updateMatrix(); dice.setMatrixAt(i, transform.matrix);
  }
  chips.castShadow = dice.castShadow = true;
  chips.receiveShadow = dice.receiveShadow = true;
  chips.frustumCulled = dice.frustumCulled = false;
  output.g.add(chips, dice);

  // A separate, visibly marked tray holds excluded parts. It never merges with
  // accepted output; the film does not imply that every wafer die ships.
  const rejects = new T.Group(); rejects.name = 'illustrative excluded-parts tray'; root.add(rejects);
  const R = builder(rejects);
  R.box(.62, .035, .47, P.dark, 0, 0, 0);
  R.box(.64, .03, .035, P.red, 0, .028, .245);
  for (const x of [-.19, 0, .19]) for (const z of [-.12, .1]) R.box(.1, .025, .1, P.chip, x, .03, z);
  R.done('excluded parts');
  rejects.position.set(-4, 1.02, 6.05);

  function roll(cart, z, x = 0, yaw = 0) {
    cart.g.position.set(x, 0, z); cart.g.rotation.y = yaw;
    for (const wheel of cart.wheels) { wheel.rotation.set(0, 0, Math.PI / 2); wheel.rotateY(z / .105); }
  }
  const cameras = {
    aisle: {from: [-.92, 1.62, 3.65], to: [-.65, 1.62, 2.85], aim: [.05, 1.0, -2.1], fov: 48},
    handoff: {from: [-1.62, 1.27, 1.65], to: [-1.44, 1.24, 1.3], aim: [.06, .98, -.35], fov: 39},
    idle: {from: [-1.83, 1.5, .48], to: [-1.71, 1.5, .3], aim: [-2.81, 1.04, -1.57], fov: 31},
    dock: {from: [-1.85, 1.49, 8.22], to: [-1.6, 1.43, 7.72], aim: [0, 1, 5.9], fov: 47},
    wide: {from: [-1.65, 1.73, 7.7], to: [-1.35, 1.7, 6.93], aim: [.25, 1.38, -2.6], fov: 51},
    bay: {from: [.42, 1.67, -1.2], to: [.69, 1.61, -1.55], aim: [3.7, 1.02, -4.65], fov: 47},
    equipment: {from: [1.27, 1.35, -2.35], to: [1.44, 1.27, -2.64], aim: [2.71, 1.12, -4.63], fov: 37},
    dispatch: {from: [-1.86, 1.53, 4.88], to: [-1.68, 1.56, 5.1], aim: [0, 1.04, 6.22], fov: 45},
    tray: {from: [-.87, 1.73, 6.96], to: [-.74, 1.65, 6.8], aim: [.04, .96, 6.1], fov: 37},
    low: {from: [-1.34, .36, 3.55], to: [-1.25, .44, 2.9], aim: [.1, .79, .1], fov: 45},
  };
  let last = null;
  function frame({act = 'overflow', p = 0, shot = 'aisle', u = 0, t = 0} = {}) {
    p = clamp(p); u = clamp(u);
    const isOverflow = act === 'overflow';
    const isCapacity = act === 'capacity';
    const isShipping = act === 'shipping' || act === 'shipping-shortfall' || act === 'shortfall';
    const isShortfall = act === 'shipping-shortfall' || act === 'shortfall';
    incoming.g.visible = isOverflow;
    planned.g.visible = isCapacity;
    output.g.visible = isShipping;
    rejects.visible = isShortfall;
    newMachine.visible = !isCapacity || p >= .18;
    bayCarrierA.visible = isCapacity && p >= .69;
    bayCarrierB.visible = isCapacity && p >= .84;
    returnCard.visible = isOverflow && p >= .36;
    for (const carrier of incomingLots) carrier.visible = true;
    let phase = '', label = '', detail = '', occupied = 0;

    // Incoming lots cross the portal and reach the same floor position before
    // recall. The return journey is finite: an empty powered hall is the end.
    const arrival = segment(p, 0, .29), recall = segment(p, .39, .73);
    const orderZ = mix(7.5, -.48, arrival) + 11.48 * recall;
    roll(incoming, orderZ, .12);
    incoming.g.visible = isOverflow && p < .77;
    roll(planned, mix(7.65, -4.35, segment(p, .55, .84)), .12);
    // Move equipment along the corridor before docking sideways into its bay.
    // This is a planning montage; geometry never rises through the floor.
    const eqZ = mix(2.4, -4.65, segment(p, .18, .43));
    const eqX = mix(.23, 3.72, segment(p, .43, .59));
    newMachine.position.set(isCapacity ? eqX : 3.72, 0, isCapacity ? eqZ : -4.65);
    newMachine.rotation.y = -Math.PI / 2;
    // Carriers leave the trolley at its loading height and settle onto a real
    // ledge. The transfer is explicitly a mechanism model, not machine footage.
    const transferA = segment(p, .71, .84), transferB = segment(p, .84, .96);
    const fromZ = planned.g.position.z;
    bayCarrierA.position.set(mix(.12 - .23, 2.75, transferA), mix(.815, .88, transferA), mix(fromZ - .39, -5.08, transferA));
    bayCarrierB.position.set(mix(.12 + .23, 2.75, transferB), mix(.815, .88, transferB), mix(fromZ + .16, -4.68, transferB));
    bayCarrierA.rotation.y = -Math.PI / 2 * transferA;
    bayCarrierB.rotation.y = -Math.PI / 2 * transferB;
    // The corresponding copies disappear from the cart at the start of the
    // transfer. Their existence does not depend on a previous seek direction.
    planned.g.children.filter(o => o.name === 'illustrative sealed lot carrier').forEach((o, i) => {
      o.visible = !((i === 0 && p >= .69) || (i === 3 && p >= .84));
    });

    const loadProgress = segment(p, 0, .5);
    const accepted = isShortfall ? Math.round(8 * loadProgress) : Math.round(48 * loadProgress);
    chips.count = dice.count = accepted;
    const depart = isShortfall ? 0 : segment(p, .61, 1);
    roll(output, mix(6.1, 10.9, depart), 0);
    const doorOpen = isOverflow ? segment(p, .5, .59) : isShipping && !isShortfall ? segment(p, .38, .61) : 0;
    shutter.position.y = doorOpen * 3.43;
    ceilingKey.color.set(isShipping ? '#f1dbb2' : '#e8ecdf');
    ceilingKey.position.set(-.6, 3.5, isShipping ? 7.3 : -.8);
    ceilingKey.target.position.set(0, 0, isShipping ? 6.4 : -1.9);
    if (isOverflow) {
      phase = p < .29 ? 'external orders enter' : p < .39 ? 'temporary workload' : p < .73 ? 'orders recalled to own plant' : 'idle equipment remains';
      label = p < .39 ? 'Work arrives. But it is not yours to keep.' : p < .73 ? 'The work goes back home.' : 'The machines stay. The orders do not.';
      detail = 'Illustrative overflow-manufacturing mechanism. Not a reconstruction of a historical factory.';
      occupied = p < .73 ? 4 : 0;
    } else if (isCapacity) {
      phase = p < .18 ? 'reserved empty floor space' : p < .59 ? 'equipment move-in planning montage' : p < .84 ? 'scheduled lot arrives' : 'lot reaches prepared capacity';
      label = p < .59 ? 'Capacity has to exist before the order ships.' : 'A forecast becomes a production commitment.';
      detail = 'Illustrative capacity-planning montage; no historical layout, investment amount, construction duration or machine is asserted.';
      occupied = p >= .84 ? 2 : 0;
    } else {
      phase = isShortfall ? 'underfilled accepted-parts tray' : p < .5 ? 'accepted output accumulates' : p < .61 ? 'dispatch door opens' : 'dispatch through open doorway';
      label = isShortfall ? 'Paying for wafers is not the same as having chips to sell.' : 'The product can finally leave the factory.';
      detail = 'Illustrative shipment. Tray counts are visual examples, not measured historical yield or sales.';
      occupied = accepted;
    }
    const key = cameras[shot] ? shot : (isCapacity ? 'bay' : isShipping ? 'dispatch' : 'aisle');
    const c = cameras[key], move = ease(u);
    let position = mix3(c.from, c.to, move), target = c.aim.slice();
    // Tracking moves follow an object through a real room, and stop with it.
    if (key === 'handoff') {
      const z = isOverflow ? Math.min(2.1, Math.max(-.48, orderZ)) : planned.g.position.z;
      target = [.12, 1.02, z]; position = [-1.54 + .12 * move, 1.25, z + 1.83 - .2 * move];
    }
    if (key === 'low') {
      const z = Math.min(2.3, Math.max(-.48, isOverflow ? orderZ : planned.g.position.z));
      target = [.12, .64, z]; position = [-1.2, .37 + .06 * move, z + 1.72];
    }
    if ((key === 'dispatch' || key === 'tray') && isShipping) {
      const dz = output.g.position.z - 6.1;
      target[2] += dz; position[2] += dz * (key === 'tray' ? .82 : .55);
    }
    if (key === 'dock' && isOverflow) target = [.12, 1.0, Math.max(4.2, Math.min(8.15, orderZ))];
    last = {
      act, p, shot: key, phase, occupied,
      acceptedParts: isShipping ? accepted : null,
      trolleyZ: isOverflow ? orderZ : isCapacity ? planned.g.position.z : output.g.position.z,
      equipmentPresent: newMachine.visible,
      equipmentPosition: newMachine.position.toArray(),
      shutterOpen: doorOpen,
      illustrative: true, historicalReconstruction: false,
      absoluteState: true, time: Number.isFinite(t) ? t : 0,
    };
    root.updateMatrixWorld(true);
    return {
      position, target, fov: c.fov,
      focus: Math.hypot(...position.map((n, i) => n - target[i])),
      look: {
        background: '#a3b1ad', floor: '#8c9990', key: '#e7e9d7', fill: '#b8cbd0',
        exposure: isShipping ? 1.03 : 1.07,
      },
      label, detail, state: {...last},
    };
  }
  function inspect() {
    let triangles = 0, meshes = 0, instances = 0;
    root.traverse(o => {
      if (!o.isMesh) return;
      meshes++;
      const count = o.isInstancedMesh ? o.instanceMatrix.count : 1;
      if (o.isInstancedMesh) instances += count;
      const g = o.geometry;
      triangles += (g.index ? g.index.count : g.attributes.position.count) / 3 * count;
    });
    return {
      name: root.name, worldScale: 'metres', roomDimensions: [12, 3.8, 19.5],
      triangles, meshes, instances, authoredSurfaceTextures: textureList.length,
      cameraKeys: Object.keys(cameras),
      acts: ['overflow', 'capacity', 'shipping-shortfall', 'shipping'],
      phases: {
        overflow: [[0, .29, 'arrival'], [.29, .39, 'temporary work'], [.39, .73, 'recall'], [.73, 1, 'idle']],
        capacity: [[0, .18, 'empty bay'], [.18, .59, 'equipment move-in'], [.55, .84, 'scheduled arrival'], [.71, .96, 'port handoff']],
        shipping: [[0, .5, 'fill accepted tray'], [.38, .61, 'open shutter'], [.61, 1, 'dispatch through doorway']],
      },
      historicalReconstruction: false,
      disclaimer: root.userData.disclaimer,
      lastState: last && {...last},
    };
  }
  frame();
  return {root, frame, inspect};
}
