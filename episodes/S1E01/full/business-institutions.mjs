/**
 * S1E01 r5 — capital, noncompetition, and the customer's product.
 * Authored 3D explanatory models, not historical rooms, commercial hardware,
 * contract facsimiles, guaranteed orders, or a validated production process.
 *
 * Bounded contribution under accepted PR #4 production claim d562f74.
 * Aimotion 147/148 informed material separation and parent-space assembly only.
 * No imported scene, L-shaped circuit, wafer motif, or old fab module is used.
 *
 * Public contract: createInstitutions(THREE) -> { founding, trust, market }.
 * update(u, phase) accepts normalized shot time. Every animated property is set
 * from that pair, including hidden parts. cameraAt uses the same closed clock.
 * The caller owns renderer, lighting, audio, captions, and source UI.
 */
export function createInstitutions(T) {
  const P = {
    ivory: 0xeee6d6, plaster: 0xcfc7b6, ink: 0x263239,
    copper: 0xad704a, olive: 0x6b7555, steel: 0x9aa5a0,
    charcoal: 0x171d20, clay: 0xa47a63, pale: 0xf8f1e3,
  };
  const material = (color, roughness = .65, metalness = 0) =>
    new T.MeshStandardMaterial({color, roughness, metalness});
  const M = {
    ivory: material(P.ivory, .77), plaster: material(P.plaster, .9),
    ink: material(P.ink, .43, .22), copper: material(P.copper, .36, .55),
    olive: material(P.olive, .7), steel: material(P.steel, .35, .65),
    dark: material(P.charcoal, .7), clay: material(P.clay, .72),
    pale: material(P.pale, .76),
  };
  const clamp = x => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const interval = (u, a, b) => smooth((u - a) / (b - a));
  const mix = (a, b, t) => a + (b - a) * t;
  const geometries = new Map();
  const unitBox = new T.BoxGeometry(1, 1, 1);
  const cylGeometry = new T.CylinderGeometry(1, 1, 1, 24);
  const headGeometry = new T.IcosahedronGeometry(1, 1);

  function group(parent, name, p = [0, 0, 0]) {
    const g = new T.Group(); g.name = name; g.position.set(...p);
    if (parent) parent.add(g);
    return g;
  }
  function mesh(parent, geometry, mat, p, s = [1, 1, 1], name = '') {
    const o = new T.Mesh(geometry, mat); o.name = name;
    o.position.set(...p); o.scale.set(...s);
    o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  }
  function block(parent, p, size, mat = M.ivory, name = '') {
    return mesh(parent, unitBox, mat, p, size, name);
  }
  function cylinder(parent, p, radius, height, mat = M.steel, name = '') {
    return mesh(parent, cylGeometry, mat, p, [radius, height, radius], name);
  }
  function bevelGeometry(w, h, d, b) {
    b = Math.min(b, w / 8, h / 5, d / 5);
    const key = [w, h, d, b].join(':');
    if (!geometries.has(key)) {
      const s = new T.Shape(), a = w / 2 - b, c = h / 2 - b;
      s.moveTo(-a, -c); s.lineTo(a, -c); s.lineTo(a, c);
      s.lineTo(-a, c); s.closePath();
      const geo = new T.ExtrudeGeometry(s, {depth:d - 2 * b,
        bevelEnabled:true, bevelThickness:b, bevelSize:b,
        bevelSegments:1, steps:1, curveSegments:1});
      geo.translate(0, 0, -d / 2 + b); geometries.set(key, geo);
    }
    return geometries.get(key);
  }
  function solid(parent, p, size, mat = M.ivory, name = '') {
    return mesh(parent, bevelGeometry(...size, .035), mat, p, [1, 1, 1], name);
  }
  function rod(parent, a, b, radius = .025, mat = M.steel, name = '') {
    const start = new T.Vector3(...a), end = new T.Vector3(...b);
    const direction = end.clone().sub(start);
    const o = cylinder(parent, start.clone().add(end).multiplyScalar(.5).toArray(),
      radius, direction.length(), mat, name);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
    return o;
  }
  function texture(lines, bg = '#eee6d6', fg = '#263239') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = lines.length > 1 ? 384 : 192;
    const c = canvas.getContext('2d');
    c.fillStyle = bg; c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = fg; c.textBaseline = 'middle'; c.textAlign = 'center';
    lines.forEach((line, i) => {
      c.font = `${i ? '500' : '600'} ${i ? 61 : 79}px Arial, sans-serif`;
      c.fillText(line, 512, canvas.height * (i + .5) / lines.length, 940);
    });
    const map = new T.CanvasTexture(canvas); map.colorSpace = T.SRGBColorSpace;
    return map;
  }
  function label(parent, lines, p, w, h, dark = false) {
    const o = mesh(parent, new T.PlaneGeometry(w, h),
      new T.MeshStandardMaterial({map:texture(lines, dark ? '#263239' : '#eee6d6',
        dark ? '#eee6d6' : '#263239'), roughness:.85}), p, [1, 1, 1],
      'Physical explanatory label / ' + lines.join(' / '));
    o.castShadow = false; return o;
  }
  function stage(name) {
    const root = group(null, name);
    solid(root, [0, .08, 0], [7.7, .16, 3.5], M.plaster, 'Grounded presentation plinth');
    return root;
  }
  function camera(positionA, positionB, target, fov, u) {
    const t = smooth(clamp(u));
    return {position:positionA.map((n, i) => mix(n, positionB[i], t)),
      target:[...target], fov};
  }
  function chipPackage(parent, p, scale = 1, mat = M.ink) {
    const g = group(parent, 'Illustrative packaged IC', p); g.scale.setScalar(scale);
    solid(g, [0, .08, 0], [.65, .16, .54], mat);
    solid(g, [0, .17, 0], [.44, .025, .34], M.dark);
    for (let i = 0; i < 6; i++) {
      const x = -.25 + i * .1;
      block(g, [x, .03, -.33], [.045, .04, .18], M.steel);
      block(g, [x, .03, .33], [.045, .04, .18], M.steel);
    }
    return g;
  }

  // FOUNDING: capital becomes a grounded industrial structure, not floating cash.
  const foundationRoot = stage('Founding / resources assembled, orders still uncertain');
  const foundation = group(foundationRoot, 'Industrial foundation assembly');
  const investors = [
    {name:'Government', percent:48, mat:M.olive},
    {name:'Philips', percent:27, mat:M.copper},
    {name:'Taiwan investors', percent:25, mat:M.ink},
  ];
  let foundationX = -3;
  const capitalPieces = investors.map((v, i) => {
    const width = 6 * v.percent / 100;
    const x = foundationX + width / 2; foundationX += width;
    const g = group(foundation, `Initial capital share / ${v.name} / ${v.percent}%`);
    const body = block(g, [0, .38, .2], [width, .42, 2.3], v.mat);
    const face = label(g, [`${v.percent}%`, v.name], [0, .66, 1.37], Math.min(width - .09, 2.1), .49);
    return {root:g, body, face, mat:v.mat, x, width, percent:v.percent, separation:(i - 1) * .36};
  });
  const capitalTotal = group(foundationRoot, 'Initial investment, not all construction cost');
  for (const x of [-1.32, 1.32]) block(capitalTotal, [x, 1.44, .9], [.07, 2.5, .07], M.steel);
  solid(capitalTotal, [0, 2.58, .9], [3.2, .6, .1], M.ink);
  label(capitalTotal, ['US$220 million', 'Initial investment'], [0, 2.58, .96], 3.1, .54, true);
  const frame = group(foundationRoot, 'Industrial capability, not a historical factory replica');
  block(frame, [.6, .25, -.35], [3.7, .19, 1.65], M.ivory);
  for (const x of [-1.12, .62, 2.36]) {
    for (const z of [-1.05, .32]) block(frame, [x, 1.04, z], [.12, 1.52, .12], M.ink);
    rod(frame, [x, 1.81, -1.05], [x, 2.15, -.36], .055, M.steel);
    rod(frame, [x, 2.15, -.36], [x, 1.81, .32], .055, M.steel);
  }
  for (const z of [-1.05, .32]) block(frame, [.62, 1.8, z], [3.62, .13, .13], M.ink);
  rod(frame, [-1.12, 2.15, -.36], [2.36, 2.15, -.36], .055, M.copper);
  const roof = group(frame, 'Open roof reveals installed capability');
  for (const side of [-1, 1]) {
    const panel = solid(roof, [.62, 1.99, -.36 + side * .36], [3.75, .07, .81], M.ivory);
    panel.rotation.x = side * .45;
  }
  const installation = group(foundationRoot, 'Illustrative installed equipment');
  solid(installation, [.7, .58, -.35], [1.26, .5, .82], M.olive);
  cylinder(installation, [.7, .99, -.35], .37, .38, M.steel);
  cylinder(installation, [.7, 1.2, -.35], .4, .06, M.copper);
  block(installation, [1.37, .8, -.35], [.25, .63, .48], M.ink);
  rod(installation, [.7, .91, .03], [1.37, .91, .03], .065, M.steel);
  const indicator = group(foundationRoot, 'Manufacturing precision / illustrative engineering instrument', [-2.45, 0, -.56]);
  solid(indicator, [0, .28, 0], [.97, .22, .72], M.ink);
  rod(indicator, [-.21, .4, 0], [-.21, 1.4, 0], .052);
  rod(indicator, [-.21, 1.4, 0], [.32, 1.4, 0], .045);
  const dial = cylinder(indicator, [.32, 1.29, .08], .27, .11, M.ivory);
  dial.rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    rod(indicator, [.32 + Math.sin(a) * .2, 1.29 + Math.cos(a) * .2, .145],
      [.32 + Math.sin(a) * .235, 1.29 + Math.cos(a) * .235, .145], .008, M.ink);
  }
  rod(indicator, [.32, 1.29, .15], [.42, 1.43, .15], .012, M.copper);
  rod(indicator, [.32, .48, .06], [.32, 1.03, .06], .026);
  block(indicator, [.22, .46, .06], [.43, .08, .27], M.steel);
  const people = group(foundationRoot, '98 transferred professionals / count, not portrait reconstruction', [-2.32, .22, -.57]);
  const bodies = new T.InstancedMesh(unitBox, M.olive, 98);
  const heads = new T.InstancedMesh(headGeometry, M.ivory, 98);
  const transform = new T.Object3D();
  for (let i = 0; i < 98; i++) {
    const x = (i % 7 - 3) * .14, z = (Math.floor(i / 7) - 6.5) * .088;
    transform.position.set(x, .08, z); transform.scale.set(.055, .16, .05);
    transform.updateMatrix(); bodies.setMatrixAt(i, transform.matrix);
    transform.position.set(x, .195, z); transform.scale.setScalar(.041);
    transform.updateMatrix(); heads.setMatrixAt(i, transform.matrix);
  }
  bodies.name = '98 professional figures / bodies'; heads.name = '98 professional figures / heads';
  for (const inst of [bodies, heads]) {
    inst.castShadow = true; inst.receiveShadow = true; inst.frustumCulled = false; people.add(inst);
  }
  label(people, ['98 professionals'], [0, .6, .67], 1.62, .24);
  const resourceCaption = group(foundationRoot, 'Terms of the transfer remain distinct');
  label(resourceCaption, ['ITRI resources', 'Facilities · equipment · technology'], [.35, .38, 1.48], 3.72, .49);
  const noOrders = group(foundationRoot, 'Empty order tray / capital does not guarantee demand', [2.7, .2, 1.05]);
  solid(noOrders, [0, .1, 0], [1.42, .15, .76], M.ivory);
  block(noOrders, [0, .24, -.32], [1.42, .2, .08], M.ink);
  for (const x of [-.67, .67]) block(noOrders, [x, .24, 0], [.08, .2, .76], M.ink);
  label(noOrders, ['Orders?'], [0, .28, .4], 1.05, .25);
  let foundingState = {};
  function updateFounding(u, phase = 'choice') {
    u = clamp(u);
    const capital = phase === 'capital' || phase === 'partners';
    const resources = phase === 'resources', operating = phase === 'operating';
    foundation.visible = true;
    capitalPieces.forEach(p => {
      p.root.position.set(p.x + p.separation *
        (phase === 'capital' ? 1 - interval(u, .1, .7) : 0), 0, 0);
      p.face.visible = capital; p.body.material = capital || operating ? p.mat : M.plaster;
    });
    capitalTotal.visible = capital;
    frame.visible = true; frame.scale.setScalar(1); frame.position.set(0, .36, 0);
    roof.visible = operating; roof.position.y = 0;
    installation.visible = resources || operating;
    installation.position.set(0, .36 + (resources ? .8 * (1 - interval(u, .12, .68)) : 0), 0);
    indicator.visible = phase === 'choice';
    indicator.position.set(-2.45, .4, -.56);
    people.visible = resources; people.position.set(-2.32, .6, -.57);
    resourceCaption.visible = resources;
    noOrders.visible = operating; noOrders.position.set(2.7, .6, 1.05);
    foundingState = {phase, u, capitalUSDApprox:220000000,
      capitalMeaning:'Initial investment; not an itemized fab construction cost',
      sharesPercent:investors.map(v => v.percent), widths:capitalPieces.map(p => p.width),
      sharedWidthScale:6 / 100, professionalFigures:98,
      ordersGuaranteed:false, source:'2007 recollection; ITRI retrospective; 1994 contract record'};
  }
  const founding = {
    root:foundationRoot, label:'Building the manufacturing company',
    disclosure:'Authored industrial model, not an actual 1985 room or 1987 factory. Initial capital is not all construction cost; transferred resources are not depicted as free gifts.',
    update:updateFounding,
    cameraAt(u, phase = 'choice') {
      if (phase === 'capital' || phase === 'partners') return camera([.3, 3.4, 9.8], [0, 3.25, 9.4], [0, 1.02, .1], 34, u);
      if (phase === 'resources') return camera([5.8, 4.9, 9.8], [5.3, 4.6, 9.3], [-.1, 1, -.05], 35, u);
      return camera([6.2, 4.5, 10.2], [5.8, 4.25, 9.8], [0, 1, .08], 35, u);
    },
    state:() => ({...foundingState, capitalPositions:capitalPieces.map(p => p.root.position.toArray())}),
  };

  // TRUST: a merchant's own product catalogue is removed, not the customer's output.
  const trustRoot = stage('Trust / customer manufacturing without the own-product catalogue');
  const counter = group(trustRoot, 'Shipment counter');
  solid(counter, [0, .9, 0], [6.8, .25, 1.95], M.ivory);
  for (const x of [-2.95, 2.95]) solid(counter, [x, .52, 0], [.28, .8, 1.65], M.ink);
  const customerCrate = group(counter, 'Customer shipment cradle', [-2.35, 1.06, .1]);
  block(customerCrate, [0, .03, 0], [1.8, .06, 1.19], M.olive);
  for (const z of [-.55, .55]) block(customerCrate, [0, .2, z], [1.8, .33, .07], M.ink);
  label(customerCrate, ['Customer chips'], [0, .23, .59], 1.6, .27);
  const customerPackages = [-.45, .45].map(x => chipPackage(customerCrate, [x, .08, -.05], .9));
  const dispatch = group(counter, 'Manufacturing shipment, retained in every business phase', [.05, 1.04, 0]);
  solid(dispatch, [0, .06, 0], [1, .1, .84], M.steel);
  const movingPackage = chipPackage(dispatch, [0, .11, 0], 1.05);
  const slider = group(counter, 'Own-product distribution linkage');
  rod(slider, [.8, 1.1, -.26], [1.75, 1.1, -.26], .035, M.copper);
  rod(slider, [.8, 1.1, .26], [1.75, 1.1, .26], .035, M.copper);
  const ownCatalogue = group(counter, 'Die-cut merchant product catalogue', [2.25, 1.04, -.2]);
  const catalogueShape = new T.Shape();
  catalogueShape.moveTo(-.8, 0); catalogueShape.lineTo(.8, 0);
  catalogueShape.lineTo(.8, 1.63); catalogueShape.lineTo(-.8, 1.63); catalogueShape.closePath();
  for (const x of [-.4, .4]) {
    const hole = new T.Path(); hole.moveTo(x - .3, .48); hole.lineTo(x - .3, 1.18);
    hole.lineTo(x + .3, 1.18); hole.lineTo(x + .3, .48); hole.closePath();
    catalogueShape.holes.push(hole);
  }
  const catalogueGeo = new T.ExtrudeGeometry(catalogueShape, {depth:.09,
    bevelEnabled:true, bevelThickness:.012, bevelSize:.012, bevelSegments:1, steps:1});
  mesh(ownCatalogue, catalogueGeo, M.copper, [0, 0, 0]);
  label(ownCatalogue, ['Own chip products'], [0, 1.41, .106], 1.5, .22);
  const ownProducts = [-.4, .4].map(x => {
    const p = chipPackage(ownCatalogue, [x, .8, .06], .79, M.ink);
    p.rotation.x = Math.PI / 2; return p;
  });
  solid(counter, [2.25, 1.1, -.2], [1.83, .14, .84], M.ink, 'Retracted catalogue storage');
  const policy = group(counter, 'Explanatory supplier commitment strip');
  solid(policy, [1.18, 1.37, -.75], [3.1, .4, .1], M.olive);
  label(policy, ['No own chip products'], [1.18, 1.37, -.69], 2.97, .3);
  const commercial = group(trustRoot, 'Commercial choices remain', [1.65, .2, 1.25]);
  solid(commercial, [0, .14, 0], [2.35, .23, .66], M.ink);
  const dials = [-.6, .6].map((x, i) => {
    const g = group(commercial, i ? 'Capacity choice' : 'Price negotiation', [x, .34, 0]);
    cylinder(g, [0, 0, 0], .23, .09, M.steel);
    const needle = block(g, [0, .063, -.09], [.035, .03, .22], M.copper);
    label(commercial, [i ? 'Capacity' : 'Price'], [x, .16, .345], 1.04, .2, true);
    return {root:g, needle};
  });
  const competingOrders = group(trustRoot, 'Two customer requests; no unlimited-capacity promise', [-2.6, .24, 1.33]);
  solid(competingOrders, [0, .1, 0], [1.55, .16, .6], M.ivory);
  for (const x of [-.4, .4]) {
    solid(competingOrders, [x, .28, 0], [.57, .17, .43], x < 0 ? M.olive : M.copper);
  }
  let trustState = {};
  function updateTrust(u, phase = 'rival') {
    u = clamp(u);
    const removed = phase === 'rival' ? 0 : phase === 'charter' ? interval(u, .1, .78) : 1;
    ownCatalogue.position.set(2.25, 1.04 - removed * .78, -.2 - removed * .5);
    ownCatalogue.rotation.set(-removed * Math.PI / 2, 0, 0);
    ownCatalogue.visible = removed < .999;
    slider.position.set(0, .6 * removed, -.6 * removed); slider.visible = removed < .82;
    policy.visible = removed >= .7;
    dispatch.position.set(phase === 'delivery' ? mix(.05, -1.9, interval(u, .13, .72)) : .05, 1.04, 0);
    movingPackage.position.set(0, .11, 0);
    customerPackages.forEach((p, i) => { p.visible = phase !== 'delivery' || i === 0; });
    commercial.visible = phase === 'competition';
    competingOrders.visible = phase === 'competition';
    dials.forEach((d, i) => { d.root.rotation.y = (i ? -.65 : .5) * interval(u, .2, .7); });
    trustState = {phase, u, ownProductRoutePresent:removed < .82,
      ownProductsVisible:ownCatalogue.visible ? ownProducts.length : 0,
      customerManufacturingRetained:true, ownRouteRemoval:removed,
      pricingAndCapacityConflictRemains:true, privacyGuarantee:false,
      historicalClaim:'1994 company report describes own-brand IC end-product restriction'};
  }
  const trust = {
    root:trustRoot, label:'The business the manufacturer does not enter',
    disclosure:'Illustrative shipment counter and product catalogue. Noncompetition is not a privacy guarantee or a promise of low prices, unlimited capacity, or rival-free customers.',
    update:updateTrust,
    cameraAt(u, phase = 'rival') {
      if (phase === 'charter') return camera([5.1, 4.1, 10.7], [4.55, 3.9, 10.3], [.1, 1.15, 0], 34, u);
      if (phase === 'delivery') return camera([4.3, 4.8, 9.6], [3.8, 4.5, 9.1], [-.7, 1, .1], 34, u);
      if (phase === 'competition') return camera([4.6, 5.5, 10.1], [4.4, 5.2, 9.8], [-.1, .9, .3], 35, u);
      return camera([5.8, 4.6, 10.7], [5.4, 4.3, 10.2], [0, 1.25, 0], 35, u);
    },
    state:() => ({...trustState, cataloguePosition:ownCatalogue.position.toArray(),
      shipmentPosition:dispatch.position.toArray()}),
  };

  // MARKET: distinct, finished hardware — not one repeated circuit icon.
  function boardBase(parent, name, w, d, mat) {
    const g = group(parent, name);
    solid(g, [0, .04, 0], [w, .08, d], mat, 'Illustrative PCB substrate');
    for (let i = 0; i < 12; i++) block(g, [-w * .37 + i * w * .067, .085, d / 2 - .08], [.055, .012, .12], M.copper);
    for (const x of [-w * .43, w * .43]) for (const z of [-d * .4, d * .4]) {
      cylinder(g, [x, .088, z], .035, .014, M.steel);
    }
    return g;
  }
  function audioBoard(parent) {
    const g = boardBase(parent, 'Audio board / illustrative, no commercial model', 1.73, .99, M.olive);
    chipPackage(g, [-.17, .08, -.05], .77);
    for (let i = 0; i < 3; i++) {
      const jack = cylinder(g, [-.55 + i * .5, .18, -.43], .14, .33, M.steel);
      jack.rotation.x = Math.PI / 2;
      const opening = cylinder(g, [-.55 + i * .5, .18, -.607], .087, .016, M.dark);
      opening.rotation.x = Math.PI / 2;
    }
    for (const x of [.49, .7]) cylinder(g, [x, .21, .12], .085, .25, M.ink);
    for (let i = 0; i < 5; i++) solid(g, [-.7 + i * .2, .12, .24], [.11, .065, .17], M.ivory);
    return g;
  }
  function graphicsBoard(parent) {
    const g = boardBase(parent, 'Graphics board / illustrative, no commercial model', 2.12, 1.15, M.ink);
    solid(g, [-.1, .16, -.04], [1.13, .15, .81], M.steel);
    for (let i = 0; i < 11; i++) block(g, [-.61 + i * .1, .31, -.04], [.037, .24, .79], M.steel);
    const fan = group(g, 'Static cooling fan, not an operating performance claim', [.08, .48, -.05]);
    cylinder(fan, [0, 0, 0], .37, .075, M.dark);
    cylinder(fan, [0, .058, 0], .11, .045, M.steel);
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 7;
      const blade = block(fan, [Math.cos(a) * .22, .048, Math.sin(a) * .22], [.21, .025, .1], M.ink);
      blade.rotation.y = -a + .4;
    }
    solid(g, [-.99, .22, 0], [.1, .36, 1.12], M.steel);
    for (const z of [-.3, .3]) solid(g, [-1.05, .22, z], [.12, .16, .35], M.dark);
    for (const z of [-.3, .27]) solid(g, [.81, .13, z], [.28, .1, .28], M.dark);
    rod(g, [-.66, .14, -.48], [.76, .14, -.48], .037, M.copper);
    return g;
  }
  function networkBoard(parent) {
    const g = boardBase(parent, 'Network controller / illustrative, no commercial model', 1.52, 1.1, M.clay);
    chipPackage(g, [-.19, .1, -.05], .79);
    for (const z of [-.25, .28]) {
      solid(g, [.55, .27, z], [.43, .38, .43], M.steel);
      solid(g, [.774, .27, z], [.018, .22, .29], M.dark);
      for (let j = 0; j < 5; j++) block(g, [.787, .2, z - .1 + j * .05], [.02, .035, .025], M.copper);
    }
    for (const z of [-.33, .3]) solid(g, [-.58, .15, z], [.16, .14, .22], M.ivory);
    return g;
  }
  const marketRoot = stage('Market / customer product choices and separate foundry exposure');
  const launches = group(marketRoot, 'Product launch shelf');
  // Unequal exhibit pedestals distinguish a product launch from the shipment
  // counter: one circular stand, one tall rectangular riser, one compact pier.
  cylinder(launches, [-2.42, .54, -.15], 1.03, .72, M.olive);
  solid(launches, [0, .74, -.15], [2.34, 1.12, 1.5], M.ivory);
  solid(launches, [2.42, .64, -.15], [1.92, .92, 1.52], M.ink);
  const productRoots = [audioBoard(launches), graphicsBoard(launches), networkBoard(launches)];
  const homes = [[-2.42, .9, -.15], [0, 1.3, -.15], [2.42, 1.1, -.15]];
  productRoots.forEach((g, i) => g.position.set(...homes[i]));
  const productLabels = ['Audio', 'Graphics', 'Network'].map((s, i) =>
    label(launches, [s], [homes[i][0], homes[i][1] - .18, i === 0 ? .91 : .79], 1.55, .25));
  const holdCovers = [-2.42, 2.42].map((x, i) => {
    const g = group(launches, 'Withheld design, not a failed historical product', [x, i ? 1.1 : .9, -.15]);
    solid(g, [0, .38, 0], [2.05, .12, 1.4], M.plaster);
    for (const edge of [-.98, .98]) block(g, [edge, .2, 0], [.09, .4, 1.4], M.plaster);
    label(g, ['On hold'], [0, .26, .72], 1.25, .25);
    return g;
  });
  const displayRiser = group(launches, 'Selected product is launched, not guaranteed to make a profit');
  solid(displayRiser, [0, 1.41, -.15], [2.37, .22, 1.42], M.copper);
  label(displayRiser, ['Product launch'], [0, 1.4, .58], 1.88, .23);
  const commitment = group(marketRoot, 'Order receipt and supplier commitment', [0, .2, 1.15]);
  solid(commitment, [-1.45, .15, 0], [2.45, .14, .75], M.ivory);
  const receipt = label(commitment, ['Order', 'Manufacture · deliver'], [-1.45, .226, 0], 2.3, .65);
  receipt.rotation.x = -Math.PI / 2;
  solid(commitment, [1.28, .38, -.03], [2.55, .62, .09], M.ink);
  label(commitment, ['Customer product', 'Supplier manufacturing'], [1.28, .38, .024], 2.42, .51, true);
  const riskStage = group(marketRoot, 'Different risks, not a quantitative balance sheet');
  solid(riskStage, [-2.05, .3, 0], [3.15, .25, 2.4], M.olive);
  solid(riskStage, [1.9, .3, 0], [3.2, .25, 2.4], M.ink);
  const riskProduct = graphicsBoard(riskStage); riskProduct.position.set(-2.05, .48, -.2); riskProduct.scale.setScalar(.95);
  label(riskStage, ['Customer', 'Product demand'], [-2.05, .51, 1.22], 2.66, .44);
  label(riskStage, ['Manufacturer', 'Capital · utilization'], [1.9, .51, 1.22], 2.74, .44, true);
  const capitalAsset = group(riskStage, 'Committed industrial equipment, a fixed-capital illustration', [1.95, .47, -.2]);
  solid(capitalAsset, [0, .2, 0], [2.03, .35, 1.32], M.steel);
  cylinder(capitalAsset, [0, .77, -.08], .54, .9, M.ivory);
  cylinder(capitalAsset, [0, 1.24, -.08], .58, .09, M.copper);
  solid(capitalAsset, [.74, .66, .03], [.36, .87, .56], M.olive);
  rod(capitalAsset, [-.74, .38, -.08], [-.74, 1.12, -.08], .095, M.steel);
  rod(capitalAsset, [-.74, 1.12, -.08], [-.22, 1.12, -.08], .095, M.steel);
  const emptySlots = group(riskStage, 'Unfilled use of paid-for industrial capacity', [1.9, .45, .75]);
  for (let i = 0; i < 5; i++) {
    solid(emptySlots, [-.98 + i * .49, .08, 0], [.37, .12, .3], M.dark);
  }
  let marketState = {};
  function updateMarket(u, phase = 'choices') {
    u = clamp(u);
    const win = phase === 'winners' ? interval(u, .12, .68) : phase === 'final' ? 1 : 0;
    const balance = phase === 'balance';
    launches.visible = !balance; riskStage.visible = balance;
    productRoots.forEach((g, i) => {
      const p = homes[i];
      g.position.set(p[0], p[1] + (i === 1 ? .22 * win : 0), p[2] - (i === 1 ? 0 : .26 * win));
      g.rotation.set(0, i === 0 ? Math.PI : i === 1 ? -.06 * win : -Math.PI / 2, 0); g.visible = i === 1 || win < .98;
      g.scale.setScalar(1);
      productLabels[i].visible = win < .3;
    });
    holdCovers.forEach((g, i) => { g.visible = win > .04; g.position.y = (i ? 1.1 : .9) + (1 - win) * .65; });
    displayRiser.visible = win > .02; displayRiser.scale.y = Math.max(.001, win);
    displayRiser.position.y = 1.3 * (1 - win);
    commitment.visible = phase === 'final';
    commitment.position.set(0, .2, 1.15);
    riskProduct.rotation.set(0, .1 * interval(u, .15, .65), 0);
    marketState = {phase, u, artifactKinds:['audio board', 'graphics board', 'network controller'],
      illustrativeHardware:true, launchedProduct:win > .95 ? 'graphics illustration' : null,
      withheldProducts:win > .95 ? 2 : 0, successOrProfitGuaranteed:false,
      customerRisk:'Product demand', manufacturerRisk:'Capital and utilization',
      ordersAndCommitmentVisible:commitment.visible};
  }
  const market = {
    root:marketRoot, label:'Customers choose products; manufacturers commit capability',
    disclosure:'Illustrative modern hardware, not historical product models or real customer outcomes. A selected launch does not guarantee profit; the split risks are qualitative.',
    update:updateMarket,
    cameraAt(u, phase = 'choices') {
      if (phase === 'balance') return camera([4.8, 5.8, 10.8], [4.4, 5.5, 10.3], [0, .78, .05], 35, u);
      if (phase === 'final') return camera([3.5, 4.5, 9.4], [3.2, 4.3, 9], [0, 1.02, .24], 35, u);
      if (phase === 'winners') return camera([3.7, 4.7, 9.7], [3.3, 4.5, 9.3], [0, 1.05, 0], 35, u);
      return camera([3.4, 5.1, 9.7], [3.1, 4.85, 9.3], [0, 1.02, 0], 35, u);
    },
    state:() => ({...marketState, productPositions:productRoots.map(g => g.position.toArray())}),
  };
  founding.update(0, 'choice'); trust.update(0, 'rival'); market.update(0, 'choices');
  return {founding, trust, market};
}
