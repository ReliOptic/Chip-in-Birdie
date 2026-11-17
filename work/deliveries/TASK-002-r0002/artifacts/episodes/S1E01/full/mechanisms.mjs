/**
 * S1E01 illustrative mechanism stages.
 * Authored geometry, not a reconstruction of a TSMC process or production line.
 * All transforms are functions of (phase, u); no frame history, random state,
 * timers, physics integrator, renderer, or audio clock is owned by this module.
 *
 * Visual methods: hierarchical parts and parent-space separation vectors,
 * informed by aimotion technique 148. Geometry and timing are authored here.
 */
export function createMechanisms(T) {
  const C = {
    ceramic: 0xebe5d8, dark: 0x1b2932, steel: 0x8b969b,
    copper: 0xb07844, silicon: 0x355b73, pass: 0x3c8279,
    resist: 0xa48654, dielectric: 0x879ba5, fail: 0x9e5145,
  };
  const clamp = x => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const ramp = (u, a, b) => smooth((u - a) / (b - a));
  const mix = (a, b, u) => a + (b - a) * u;
  const material = (color, metalness = 0, roughness = 0.5, extra = {}) =>
    new T.MeshStandardMaterial({color, metalness, roughness, ...extra});
  const M = {
    ceramic: material(C.ceramic, 0.12, 0.38),
    dark: material(C.dark, 0.55, 0.32),
    steel: material(C.steel, 0.84, 0.24),
    copper: material(C.copper, 0.82, 0.27),
    dielectric: material(C.dielectric, 0.12, 0.49),
    silicon: new T.MeshPhysicalMaterial({color:C.silicon,metalness:0.7,roughness:0.25,
      clearcoat:0.65,clearcoatRoughness:0.19,iridescence:0.18,
      iridescenceIOR:1.28,iridescenceThicknessRange:[80,230]}),
    resist: material(C.resist, 0.1, 0.41),
    pass: material(C.pass, 0.18, 0.4),
    fail: material(C.fail, 0.1, 0.5),
    black: material(0x0b1117, 0, 0.64),
  };
  const boxGeo = new T.BoxGeometry(1, 1, 1);
  const diskGeo = new T.CylinderGeometry(1, 1, 1, 64);
  const smallDiskGeo = new T.CylinderGeometry(1, 1, 1, 24);
  function mesh(g, mat, p, s, parent, name = '') {
    const m = new T.Mesh(g, mat); m.name = name;
    m.position.set(...p); m.scale.set(...s);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  }
  const box = (parent, p, s, mat=M.ceramic, name='') => mesh(boxGeo,mat,p,s,parent,name);
  const cyl = (parent,p,s,mat=M.steel,name='') => mesh(diskGeo,mat,p,s,parent,name);
  function batchFixedParts(group) {
    group.updateMatrixWorld(true);
    const inverse=new T.Matrix4().copy(group.matrixWorld).invert(),sets=new Map();
    group.traverse(o=>{
      if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
      const key=o.geometry.uuid+o.material.uuid;
      if(!sets.has(key))sets.set(key,[]);
      sets.get(key).push(o);
    });
    for(const members of sets.values()) {
      if(members.length<3)continue;
      const inst=new T.InstancedMesh(members[0].geometry,members[0].material,members.length);
      inst.name='Fixed parts / '+group.name;inst.frustumCulled=false;
      inst.castShadow=true;inst.receiveShadow=true;
      members.forEach((m,i)=>{inst.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));m.removeFromParent();});
      group.add(inst);
    }
  }
  function roundedPlate(w,d,h,r=0.09) {
    const q=new T.Shape(), x=-w/2,z=-d/2;
    q.moveTo(x+r,z);q.lineTo(x+w-r,z);q.quadraticCurveTo(x+w,z,x+w,z+r);
    q.lineTo(x+w,z+d-r);q.quadraticCurveTo(x+w,z+d,x+w-r,z+d);
    q.lineTo(x+r,z+d);q.quadraticCurveTo(x,z+d,x,z+d-r);
    q.lineTo(x,z+r);q.quadraticCurveTo(x,z,x+r,z);
    const g=new T.ExtrudeGeometry(q,{depth:h,bevelEnabled:true,bevelSegments:2,
      steps:1,bevelSize:0.015,bevelThickness:0.015,curveSegments:4});
    g.rotateX(-Math.PI/2);return g;
  }
  function plate(parent,p,w,d,h,mat=M.ceramic,name='') {
    return mesh(roundedPlate(w,d,h),mat,p,[1,1,1],parent,name);
  }
  function line(parent,points,mat=M.steel,r=0.015) {
    const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));
    return mesh(new T.TubeGeometry(curve,24,r,6,false),mat,[0,0,0],[1,1,1],parent);
  }
  function motif(parent,{scale=1,y=0,mat=M.copper,name='Customer L layout'}={}) {
    const g=new T.Group(); g.name=name;g.scale.setScalar(scale);g.position.y=y;parent.add(g);
    // Exactly the same asymmetry is used on the design desk, die and test wafer.
    box(g,[-0.55,0,-0.025],[0.14,0.035,1.25],mat);
    box(g,[0.05,0,0.60],[1.34,0.035,0.14],mat);
    for(const [x,z] of [[-0.55,-0.65],[-0.55,0.60],[0.65,0.60]])
      box(g,[x,0.01,z],[0.25,0.045,0.25],mat);
    box(g,[0.40,0,-0.38],[0.55,0.04,0.38],mat);
    box(g,[0.40,0,0.08],[0.07,0.03,0.56],mat);
    batchFixedParts(g);
    return g;
  }
  function base(parent,w=5.6,d=4) {
    plate(parent,[0,0.08,0],w,d,0.14,M.dark,'Machined base');
    for(const x of [-w/2+0.2,w/2-0.2]) for(const z of [-d/2+0.2,d/2-0.2])
      mesh(smallDiskGeo,M.steel,[x,0.232,z],[0.04,0.012,0.04],parent,'Captive screw');
  }
  function makeLayers() {
    const root=new T.Group();root.name='Pattern transfer and registered connection — cutaway';
    base(root,4.15,3.8);
    const stack=new T.Group();root.add(stack);
    const substrate=plate(stack,[0,0.27,0],3.4,3.2,0.24,M.silicon,'Silicon substrate, section thickness exaggerated');
    const dielectric=plate(stack,[0,0.53,0],3.32,3.12,0.055,M.dielectric,'Insulating surface');
    // Continuous 2D outlines, not a stack of disconnected cubes. The L and its
    // three landing pads retain the design-desk orientation and dimensions.
    const L=[[-.675,-.775],[-.425,-.775],[-.425,-.525],[-.48,-.525],[-.48,.475],
      [-.425,.475],[-.425,.53],[.525,.53],[.525,.475],[.775,.475],[.775,.725],
      [.525,.725],[.525,.67],[-.425,.67],[-.425,.725],[-.675,.725],[-.675,.475],
      [-.62,.475],[-.62,-.525],[-.675,-.525]].map(p=>p.map(v=>v*1.65));
    const island=[[.125,-.57],[.675,-.57],[.675,-.19],[.435,-.19],[.435,.36],
      [.365,.36],[.365,-.19],[.125,-.19]].map(p=>p.map(v=>v*1.65));
    const outer=[[-1.65,-1.55],[1.65,-1.55],[1.65,1.55],[-1.65,1.55]];
    const contour=points=>{const s=new T.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();return s};
    function slab(parent,points,h,mat,name,holes=[]){
      const s=contour(points);for(const p of holes)s.holes.push(contour(p));
      const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,steps:1,curveSegments:1});
      g.rotateX(-Math.PI/2);return mesh(g,mat,[0,0,0],[1,1,1],parent,name);
    }
    const metal=new T.Group();metal.name='Protected metal remains while exposed field is removed';stack.add(metal);metal.position.y=.60;
    const retained=new T.Group();metal.add(retained);
    slab(retained,L,.085,M.copper,'Continuous L conductor and landing pads');
    slab(retained,island,.085,M.copper,'Isolated design island');
    const fieldMetal=slab(metal,outer,.085,M.copper,'Exposed metal field to be etched',[L,island]);
    const resist=new T.Group();resist.name='Positive-tone resist, illustrative';stack.add(resist);resist.position.y=.685;
    const protectedResist=new T.Group();resist.add(protectedResist);
    slab(protectedResist,L,.07,M.resist,'Unexposed resist protects L');
    slab(protectedResist,island,.07,M.resist,'Unexposed resist protects island');
    const exposedMat=M.resist.clone();
    const exposedResist=slab(resist,outer,.07,exposedMat,'Exposed resist field removed during development',[L,island]);
    const mask=new T.Group();mask.name='Pattern correspondence, projection optics omitted';root.add(mask);
    const glass=new T.MeshPhysicalMaterial({color:0xb7c8ce,metalness:.1,roughness:.14,
      transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide});
    box(mask,[0,0,0],[3.52,.018,3.32],glass,'Schematic mask plate');
    slab(mask,L,.018,M.black,'Opaque L pattern');slab(mask,island,.018,M.black,'Opaque island pattern');
    for(const x of [-1.79,1.79])box(mask,[x,.015,0],[.085,.07,3.5],M.steel);
    for(const z of [-1.7,1.7])box(mask,[0,.015,z],[3.66,.07,.085],M.steel);
    const upper=new T.Group();upper.name='Upper interconnect — exposed cutaway';root.add(upper);
    // The missing front-right section is deliberate. It reveals the landing
    // interface instead of hiding the point of the scene under opaque slabs.
    const cutaway=[[-1.64,-1.54],[1.64,-1.54],[1.64,.12],[.40,.12],[.40,1.54],[-1.64,1.54]];
    slab(upper,cutaway,.38,M.dielectric,'Insulator with explanatory cutaway');
    const upperPath=[[.93,1.15],[1.21,1.15],[1.21,-1.22],[-1.08,-1.22],[-1.08,-.93],
      [-.74,-.93],[-.74,-1.0],[.93,-1.0]];
    const upperMetal=slab(upper,upperPath,.075,M.copper,'Upper route around the opposite corner');upperMetal.position.y=.38;
    const via=new T.Group();upper.add(via);
    for(const [x,z]of [[-.9075,-1.0725],[1.0725,.99]])
      cyl(via,[x,.185,z],[.11,.39,.11],M.copper,'Via must meet a lower landing pad');
    const landing=new T.Group();root.add(landing);
    const landingMat=M.copper.clone();
    const ring=new T.Mesh(new T.TorusGeometry(.208,.014,6,48),landingMat);ring.rotation.x=Math.PI/2;
    ring.position.set(1.0725,.693,.99);landing.add(ring);
    const errorMark=new T.Group();landing.add(errorMark);
    for(const a of [-Math.PI/4,Math.PI/4]){const bar=box(errorMark,[1.0725,.711,.99],[.27,.012,.025],M.fail);bar.rotation.y=a;}
    // Scribe lines and a bevel catch light at the die edge, anchoring the macro
    // material section to a recognisable chip instead of a generic layer cake.
    const edge=new T.Group();stack.add(edge);
    for(let i=0;i<19;i++)box(edge,[-1.5+i/6,.395,1.608],[.025,.09,.006],M.steel);
    batchFixedParts(edge);
    let state={};
    function update(u,phase='assembled') {
      u=clamp(u);
      substrate.position.y=.27;dielectric.position.y=.53;metal.position.set(0,.60,0);
      resist.position.set(0,.685,0);resist.scale.set(1,1,1);resist.visible=false;
      fieldMetal.visible=false;fieldMetal.scale.set(1,1,1);
      exposedResist.visible=true;exposedResist.scale.set(1,1,1);protectedResist.scale.set(1,1,1);
      exposedMat.color.set(C.resist);
      mask.position.set(0,2.15,0);mask.visible=false;
      upper.position.set(0,.685,0);upper.visible=false;landing.visible=false;errorMark.visible=false;
      landingMat.color.set(C.copper);
      let error=0,coat=1,develop=1,etch=1,strip=1;
      if(phase==='coat') {
        fieldMetal.visible=true;resist.visible=true;coat=ramp(u,.08,.78);develop=etch=strip=0;
        // An explanatory coverage wipe, not a simulated spin-coating flow.
        resist.scale.x=Math.max(.0001,coat);resist.position.x=-1.65*(1-coat);
      } else if(phase==='pattern') {
        fieldMetal.visible=true;resist.visible=true;mask.visible=u<.88;etch=strip=0;
        mask.position.y=mix(1.75,1.25,ramp(u,0,.25));
        exposedMat.color.lerp(new T.Color(0xd9c6a4),ramp(u,.23,.43));
        develop=ramp(u,.44,.82);exposedResist.scale.y=Math.max(.0001,1-develop);
        exposedResist.visible=develop<1;
      } else if(phase==='etch') {
        exposedResist.visible=false;resist.visible=true;
        etch=ramp(u,.08,.64);fieldMetal.visible=etch<1;fieldMetal.scale.y=Math.max(.0001,1-etch);
        strip=ramp(u,.72,.93);protectedResist.scale.y=Math.max(.0001,1-strip);resist.visible=strip<1;
      } else if(phase==='align') {
        upper.visible=true;landing.visible=true;
        // Compare misregistration with a correctly registered model. The move
        // is explanatory, not a claim that a fabricated layer can be repaired.
        error=.46*(1-ramp(u,.42,.74));upper.position.x=error;upper.position.z=-error*.5;
        upper.position.y=.685+.22*ramp(u,.26,.40)*(1-ramp(u,.74,.88));
        errorMark.visible=u<.42;landingMat.color.set(error>.025?C.fail:C.pass);
      } else if(phase==='explode') {
        dielectric.position.y=.53+.22*ramp(u,.08,.58);
        metal.position.y=.60+.65*ramp(u,.15,.72);
        upper.visible=true;upper.position.y=.685+1.4*ramp(u,.22,.84);
        upper.position.x=.22*ramp(u,.22,.84);
      } else {
        upper.visible=true;
      }
      state={phase,u,alignmentOffset:error,upperHeight:upper.position.y,
        hasPattern:!fieldMetal.visible||develop>0,illustrative:true,resistCoverage:coat,
        exposedResistRemoved:develop,exposedMetalRemoved:etch,protectedResistStripped:strip,
        connectionRegistered:error<.025,alignmentIsComparisonNotRepair:true};
    }
    function cameraAt(u,phase){
      u=clamp(u);
      if(phase==='align')return {position:[3.0,1.65,3.65],target:[.92,.81,.83],fov:29};
      if(phase==='etch')return {position:[3.35,2.65,3.8],target:[0,.64,.16],fov:37};
      if(phase==='pattern')return {position:[2.75,4.9,3.8],target:[0,.8,0],fov:38};
      if(phase==='coat')return {position:[3.4,2.15,4.25],target:[0,.55,0],fov:36};
      if(phase==='explode')return {position:[4.8,3.25,5.6],target:[0,1.15,0],fov:37};
      return {position:[3.7-.25*smooth(u),2.4,4.6],target:[0,.6,0],fov:35};
    }
    update(0,'assembled');
    return {root,update,cameraAt,state:()=>({...state}),
      camera:{from:[3.7,2.4,4.6],to:[3.45,2.4,4.6],target:[0,.6,0],fov:35},
      label:'A design must fit a manufacturing process',
      disclosure:'Schematic pattern transfer · Optics and recipe omitted',
      modelNotes:'Exaggerated cutaway; positive-tone, subtractive pattern-transfer illustration, not a TSMC copper recipe. The L is an interconnect motif, not a transistor or functioning circuit. Alignment compares wrong/right registration; it does not depict repairing a fabricated layer.',
      anchors:{substrate:[-1.7,.40,0],pattern:[1.0725,.685,.99],upper:[1.0725,1.065,.99]}};
  }
  function waferGeometry(r=1.88,h=0.035) {
    const shape=new T.Shape(),start=-Math.PI/2+0.052;
    for(let i=0;i<=128;i++) {
      const a=start+i*(Math.PI*2-0.104)/128,x=r*Math.cos(a),z=r*Math.sin(a);
      if(i===0)shape.moveTo(x,z);else shape.lineTo(x,z);
    }
    shape.lineTo(0,-r+0.105);shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1,curveSegments:1});
    g.rotateX(-Math.PI/2);return g;
  }
  function makeTesting() {
    const root=new T.Group();root.name='Wafer electrical testing, schematic';base(root,5.4,4.7);
    cyl(root,[0,0.44,0],[2.09,0.38,2.09],M.dark,'Chuck pedestal');
    cyl(root,[0,0.655,0],[1.98,0.08,1.98],M.steel,'Wafer chuck');
    mesh(waferGeometry(),M.silicon,[0,0.71,0],[1,1,1],root,'Notched silicon wafer');
    const cells=[];const pitch=0.29;
    for(let iz=-6;iz<=6;iz++)for(let ix=-6;ix<=6;ix++){
      const x=ix*pitch,z=iz*pitch;
      if(Math.hypot(Math.abs(x)+0.13,Math.abs(z)+0.12)<1.81)
        cells.push({x,z,fail:(ix===-1&&iz===1)||(ix===2&&iz===-2)||(ix===-3&&iz===-2)});
    }
    // Authored illustrative states; neither colours nor counts are measured data.
    const cellMat=material(0xffffff,0.64,0.29);
    const dies=new T.InstancedMesh(boxGeo,cellMat,cells.length);dies.name='Individual die surfaces';
    const dummy=new T.Object3D();
    cells.forEach((p,i)=>{dummy.position.set(p.x,0.753,p.z);dummy.scale.set(0.251,0.012,0.235);
      dummy.rotation.set(0,0,0);dummy.updateMatrix();dies.setMatrixAt(i,dummy.matrix);
      dies.setColorAt(i,new T.Color(C.silicon));});
    dies.castShadow=false;dies.receiveShadow=true;dies.frustumCulled=false;root.add(dies);
    const traceGeo=new T.BoxGeometry(1,1,1);
    const traces=new T.InstancedMesh(traceGeo,M.copper,cells.length*2);traces.frustumCulled=false;
    cells.forEach((p,i)=>{
      dummy.position.set(p.x-0.066,0.766,p.z-0.003);dummy.scale.set(0.017,0.004,0.15);dummy.updateMatrix();traces.setMatrixAt(i*2,dummy.matrix);
      dummy.position.set(p.x+0.006,0.766,p.z+0.072);dummy.scale.set(0.16,0.004,0.017);dummy.updateMatrix();traces.setMatrixAt(i*2+1,dummy.matrix);
    });root.add(traces);
    // Conductive contact pads occupy exactly the four local needle positions.
    // Their upper face is y=.774; the fully lowered needle tips meet that face.
    const padOffsets=[[-0.075,-0.075],[-0.075,0.075],[0.075,-0.075],[0.075,0.075]];
    const pads=new T.InstancedMesh(boxGeo,M.copper,cells.length*padOffsets.length);
    pads.name='Four conductive probe pads per illustrative die';pads.frustumCulled=false;
    pads.castShadow=true;pads.receiveShadow=true;
    cells.forEach((p,i)=>padOffsets.forEach(([dx,dz],j)=>{
      dummy.position.set(p.x+dx,0.770,p.z+dz);dummy.rotation.set(0,0,0);
      dummy.scale.set(0.045,0.008,0.045);dummy.updateMatrix();
      pads.setMatrixAt(i*padOffsets.length+j,dummy.matrix);
    }));root.add(pads);
    const markers=new T.InstancedMesh(boxGeo,M.pass,cells.length);markers.frustumCulled=false;root.add(markers);
    const rejects=new T.InstancedMesh(boxGeo,M.fail,6);rejects.name='Illustrative rejected-die crosses';
    rejects.frustumCulled=false;root.add(rejects);
    let rejected=0;cells.forEach(p=>{if(p.fail)for(const angle of [-Math.PI/4,Math.PI/4]){
      dummy.position.set(p.x,.783,p.z);dummy.rotation.set(0,angle,0);dummy.scale.set(.14,.007,.018);
      dummy.updateMatrix();rejects.setMatrixAt(rejected++,dummy.matrix);
    }});
    // Supported x/z gantry. The contact head moves; the wafer stays clamped.
    const rig=new T.Group();rig.name='Probe mechanism, omitted for unobstructed map insert';root.add(rig);
    for(const x of [-2.35,2.35]){
      box(rig,[x,1.42,-1.54],[0.18,2.4,0.22],M.ceramic);
      box(rig,[x,0.31,-1.54],[0.44,0.15,0.54],M.dark);
    }
    box(rig,[0,2.67,-1.54],[4.88,0.24,0.30],M.ceramic,'Gantry beam');
    box(rig,[0,2.50,-1.38],[4.65,0.06,0.07],M.steel,'Linear guide');
    const carriage=new T.Group();rig.add(carriage);
    box(carriage,[0,2.50,-1.38],[0.42,0.35,0.42],M.dark,'X carriage');
    const forearm=box(carriage,[0,2.34,-0.65],[0.18,0.16,1.7],M.steel,'Z rail');
    const head=new T.Group();carriage.add(head);
    const spindle=box(carriage,[0,1.8,0],[0.065,0.95,0.065],M.steel,'Supported vertical probe spindle');
    box(head,[0,0.15,0],[0.52,0.24,0.38],M.ceramic,'Probe head');
    cyl(head,[0,-0.02,0],[0.23,0.12,0.23],M.dark,'Probe card');
    const needleEnds=[];
    for(const x of [-0.075,0.075]) for(const z of [-0.075,0.075]) {
      const needle=mesh(smallDiskGeo,M.copper,[x,-0.17,z],[0.008,0.24,0.008],head,'Contact needle');
      needleEnds.push(needle);
      line(head,[[x*2.4,.025,z*2.4],[x*1.7,-.035,z*1.7],[x,-.050,z]],M.steel,.006);
      box(head,[x*2.4,.036,z*2.4],[.036,.025,.036],M.ceramic,'Needle support insulator');
    }
    const cable=line(rig,[[-2.2,2.9,-1.55],[-1.2,3.0,-1.4],[0,2.82,-1.35]],M.dark,0.04);
    const visit=cells.map((_,i)=>i).sort((a,b)=>{
      const ra=Math.round(cells[a].z/pitch),rb=Math.round(cells[b].z/pitch);
      return ra-rb||(ra%2?cells[b].x-cells[a].x:cells[a].x-cells[b].x);
    });
    // A few readable contacts stand for a whole-wafer test program. This is
    // intentionally not a time-accurate industrial probing recipe.
    const demonstrator=visit.filter((_,i)=>i%Math.max(1,Math.floor(visit.length/7))===0).slice(0,7);
    const selectedIndex=cells.findIndex(p=>p.x===0&&p.z===0);
    const selection=new T.Group();root.add(selection);
    for(const dx of [-0.138,0.138])box(selection,[dx,0.78,0],[0.012,0.012,0.265],M.ceramic);
    for(const dz of [-0.132,0.132])box(selection,[0,0.78,dz],[0.28,0.012,0.012],M.ceramic);
    const failColor=new T.Color(C.fail),passColor=new T.Color(C.pass),baseColor=new T.Color(C.silicon);
    let state={};
    function update(u,phase='measure') {
      u=clamp(u);
      const requestedPhase=phase;
      phase=({unmeasured:'overview',probe:'measure',results:'result'})[phase]||phase;
      rig.visible=phase!=='result'&&phase!=='selected';
      rejects.visible=phase==='result';
      const scan=(phase==='overview'?0:phase==='result'?1:u);
      const k=Math.min(demonstrator.length-1,Math.floor(scan*demonstrator.length));
      const active=cells[demonstrator[k]],f=scan===1?1:(scan*demonstrator.length)%1;
      const prev=cells[demonstrator[Math.max(0,k-1)]];
      const move=ramp(f,0,0.28);
      const x=mix(prev.x,active.x,move),z=mix(prev.z,active.z,move);
      carriage.position.x=x;
      head.position.set(0,1.064+0.22*(1-ramp(f,0.33,0.46))+0.22*ramp(f,0.76,0.95),z);
      if(phase==='overview')head.position.y=1.65;
      if(phase==='result')head.position.y=1.82;
      forearm.scale.z=Math.max(0.35,z+1.38+0.25);forearm.position.z=(z-1.38)/2;
      forearm.position.y=2.34;
      spindle.position.set(0,(2.27+head.position.y+0.27)/2,z);
      spindle.scale.y=Math.max(0.05,2.27-(head.position.y+0.27));
      head.visible=phase!=='selected';carriage.visible=phase!=='selected';cable.visible=phase!=='selected';
      selection.visible=phase==='selected';
      const tested=phase==='result'?cells.length:phase==='selected'?1:Math.max(0,k+(f>=0.76?1:0));
      const testedIds=new Set(phase==='result'?visit:phase==='selected'?[selectedIndex]:demonstrator.slice(0,tested));
      cells.forEach((p,i)=>{
        dies.setColorAt(i,testedIds.has(i)?(p.fail?failColor:passColor):baseColor);
        dummy.position.set(p.x+0.085,0.779,p.z-0.077);
        const show=testedIds.has(i)&&!p.fail;
        dummy.scale.set(show?0.033:0,show?0.008:0,show?0.033:0);dummy.rotation.set(0,0,0);dummy.updateMatrix();markers.setMatrixAt(i,dummy.matrix);
      });
      dies.instanceColor.needsUpdate=true;markers.instanceMatrix.needsUpdate=true;
      state={phase:requestedPhase,u,illustrativeMarkedDies:tested,
        illustrativeDies:cells.length,probe:[x,head.position.y,z],
        conductivePadsPerDie:4,padTop:0.774,loweredNeedleTip:1.064-0.17-0.12,
        maximumDemonstratedContacts:demonstrator.length,
        mapSource:'Authored illustrative outcomes; not acquired by the probe demonstration',
        measuredData:false,numericalYieldClaim:false,waferStationary:true,
        mapIsUnobstructedIllustrativeInsert:phase==='result',selectedDieRemainsOnWafer:phase==='selected'};
    }
    function cameraAt(u,phase){
      u=clamp(u);
      if(phase==='probe'||phase==='measure'){
        const k=Math.min(demonstrator.length-1,Math.floor(u*demonstrator.length)),f=u===1?1:(u*demonstrator.length)%1;
        const a=cells[demonstrator[k]],b=cells[demonstrator[Math.max(0,k-1)]],v=ramp(f,0,.28);
        const x=mix(b.x,a.x,v),z=mix(b.z,a.z,v);
        // Side macro of the actual contact, not a generic orbit of the machine.
        return {position:[x+.82,1.17,z+.46],target:[x,.84,z],fov:35};
      }
      if(phase==='results'||phase==='result')return {position:[0,6.35,.12],target:[0,.75,0],fov:38};
      if(phase==='selected'){
        const q=ramp(u,0,.42);
        return {position:[mix(.95,.34,q),mix(2.05,1.13,q),mix(1.48,.53,q)],target:[0,.758,0],fov:34};
      }
      return {position:[2.8-.25*smooth(u),3.1,3.9],target:[0,.76,0],fov:39};
    }
    update(0,'overview');
    return {root,update,cameraAt,state:()=>({...state}),
      camera:{from:[5.7,5.8,7.4],to:[4.7,5.0,6.8],target:[0,0.95,0],fov:35},
      label:'Looking finished is not the same as working',
      disclosure:'Illustrative test map · not measured data',
      modelNotes:'Seven readable probe moves illustrate contact mechanics. They do not measure every die or generate the result map. Result colours and crosses are authored examples, not TSMC yield data or an electrical simulation. The probe rig is omitted only in the explanatory map/selected-die inserts; the selected die is not lifted from the wafer.',
      anchors:{probe:[0,1.2,0],wafer:[0,0.75,0],notch:[0,0.745,1.80]}};
  }
  function makeCapacity() {
    const root=new T.Group();root.name='One shared tool, several customer commitments — schematic cutaway';
    base(root,7.4,6.1);
    const hardware=new T.Group();hardware.name='Fixed installed manufacturing resource';root.add(hardware);
    // A cluster-tool cutaway replaces the three toy boxes. Capacity is embodied
    // by fixed chambers and one shared loading/transfer path, not by a chart.
    plate(hardware,[0,.25,-.8],5.6,3.9,.13,M.ceramic,'Fixed equipment deck');
    cyl(hardware,[0,.51,-.7],[1.12,.29,1.12],M.dark,'Transfer chamber body');
    const transferRing=mesh(new T.TorusGeometry(1.04,.075,8,64),M.steel,[0,.73,-.7],[1,1,1],hardware,'Transfer-chamber flange');
    transferRing.rotation.x=Math.PI/2;
    const destinations=[[-1.92,-.7],[0,-2.28],[1.92,-.7]],lids=[],processWafers=[],chamberTags=[];
    const waferEdgeGeometry=new T.TorusGeometry(.353,.004,4,48);
    function wafer(parent,name,showLayout=true){
      const g=new T.Group();g.name=name;parent.add(g);
      cyl(g,[0,0,0],[.355,.014,.355],M.silicon,'Illustrative wafer');
      const edge=mesh(waferEdgeGeometry,M.steel,[0,.002,0],[1,1,1],g,'Polished wafer edge');edge.rotation.x=Math.PI/2;
      if(showLayout)motif(g,{scale:.34,y:.012,name:'Customer design carried on wafer'});return g;
    }
    for(let i=0;i<destinations.length;i++){
      const [x,z]=destinations[i],inward=Math.atan2(-x,-.7-z);
      cyl(hardware,[x,.49,z],[.82,.20,.82],M.steel,'Process-chamber flange');
      cyl(hardware,[x,.63,z],[.73,.18,.73],M.dark,'Process chamber interior');
      cyl(hardware,[x,.78,z],[.48,.12,.48],M.ceramic,'Wafer support');
      mesh(new T.CylinderGeometry(.76,.76,.40,48,1,true,inward+Math.PI/4,Math.PI*1.5),M.steel,[x,.84,z],[1,1,1],hardware,'Chamber wall with explanatory open section');
      const lid=new T.Group();root.add(lid);lid.position.set(x,1.12,z);
      cyl(lid,[0,0,0],[.80,.065,.80],M.ceramic,'Process-chamber cover');
      cyl(lid,[0,.052,0],[.22,.07,.22],M.steel,'Cover service cap');lids.push(lid);
      for(let j=0;j<12;j++){
        const a=j*Math.PI/6;
        cyl(hardware,[x+Math.sin(a)*.77,.605,z+Math.cos(a)*.77],[.022,.045,.022],M.dark,'Flange fastener');
      }
      line(hardware,[[x,.49,z],[x,.27,z],[x, .27,z-.8],[x,.95,z-.8]],M.steel,.055);
      const w=wafer(root,'Allocated wafer — not a production-capacity statistic');w.position.set(x,.866,z);processWafers.push(w);
      const tag=new T.Group();root.add(tag);tag.position.set(x,.395,z+.67);
      for(let n=0;n<=i;n++)box(tag,[-.12+n*.12,0,0],[.06,.035,.13],M.copper,'Customer identity mark');
      chamberTags.push(tag);
    }
    plate(hardware,[0,.37,.29],1.02,.74,.27,M.dark,'Single shared load-lock');
    for(const x of [-.55,.55])box(hardware,[x,.75,.08],[.08,.71,.12],M.steel,'Load-lock gate guide');
    const gate=box(root,[0,.65,.08],[1.02,.48,.06],M.steel,'Shared loading gate');
    const statusMat=material(C.copper,.35,.36);
    cyl(root,[.67,1.06,.06],[.055,.19,.055],statusMat,'Availability indicator');
    // All three customers feed the SAME transverse path and loading opening.
    // Extra lots may wait; they do not make chambers or robot speed multiply.
    plate(hardware,[0,.24,1.66],6.55,2.12,.06,M.dark,'Customer lot staging deck');
    const lanes=[-2.25,0,2.25],lots=[],queues=[];
    for(const x of lanes)for(const dx of [-.46,.46])
      box(hardware,[x+dx,.315,1.72],[.035,.025,2.1],M.steel,'Lot alignment rail');
    for(const z of [.17,1.12])box(hardware,[0,.315,z],[5.5,.025,.035],M.steel,'Shared cross-transfer rail');
    function carrier(x,z,customer){
      const g=new T.Group();g.name='Customer carrier '+customer;root.add(g);g.position.set(x,.30,z);
      const casing=new T.Group();g.add(casing);
      plate(casing,[0,0,0],.93,.82,.07,M.dark,'Cassette base');
      for(const side of [-.44,.44]){
        box(casing,[side,.36,0],[.05,.67,.66],M.ceramic,'Cassette side');
        for(let j=0;j<5;j++)box(casing,[side*.88,.14+j*.10,0],[.08,.018,.62],M.steel,'Wafer support slot');
      }
      box(casing,[0,.35,.36],[.91,.67,.05],M.dark,'Cassette rear wall');
      box(casing,[0,.76,0],[.91,.05,.16],M.steel,'Cassette handle');
      for(let n=0;n<=customer;n++)box(casing,[-.14+n*.14,.40,.392],[.055,.27,.012],M.copper,'Customer identity stripe');
      const wafers=[],fixedWafers=new T.Group();fixedWafers.name='Fixed lower cassette slots';g.add(fixedWafers);
      for(let j=0;j<5;j++){const w=wafer(j===4?g:fixedWafers,'Wafer in customer cassette',j===4);w.position.y=.16+j*.10;wafers.push(w);}
      batchFixedParts(fixedWafers);
      batchFixedParts(casing);return {group:g,wafers};
    }
    lanes.forEach((x,i)=>{lots.push(carrier(x,1.65,i));queues.push(carrier(x,2.65,i));});
    // Two-link planar robot: every visible link reaches its actual joint. The
    // end effector carries one wafer through the single shared loading path.
    const robot=new T.Group();robot.name='Shared transfer robot';root.add(robot);
    cyl(robot,[0,.72,-.7],[.20,.20,.20],M.dark,'Robot base');
    const arm1=box(robot,[0,.78,0],[1,.10,.15],M.steel,'First robot link');
    const arm2=box(robot,[0,.81,0],[1,.08,.12],M.ceramic,'Second robot link');
    const elbow=cyl(robot,[0,.81,0],[.10,.10,.10],M.dark,'Elbow joint');
    const fork=new T.Group();robot.add(fork);
    for(const x of [-.17,.17])box(fork,[x,-.025,0],[.045,.025,.58],M.ceramic,'Wafer-handling fork');
    const movingWafer=wafer(root,'Wafer on shared transfer fork');
    function robotAt(x,z){
      const dx=x,dz=z+.7,L1=1.05,L2=1.0,r2=dx*dx+dz*dz;
      const bend=Math.acos(Math.max(-1,Math.min(1,(r2-L1*L1-L2*L2)/(2*L1*L2))));
      const a=Math.atan2(dz,dx)-Math.atan2(L2*Math.sin(bend),L1+L2*Math.cos(bend));
      const jx=L1*Math.cos(a),jz=-.7+L1*Math.sin(a);
      arm1.position.set(jx/2,.78,(jz-.7)/2);arm1.scale.x=L1;arm1.rotation.y=-a;
      arm2.position.set((jx+x)/2,.81,(jz+z)/2);arm2.scale.x=L2;arm2.rotation.y=-Math.atan2(z-jz,x-jx);
      elbow.position.set(jx,.81,jz);fork.position.set(x,.848,z);
      fork.rotation.y=-Math.atan2(z-jz,x-jx)+Math.PI/2;movingWafer.position.set(x,.866,z);
    }
    batchFixedParts(hardware);
    let state={};
    function update(u,phase='shared') {
      u=clamp(u);
      const idle=phase==='empty'||phase==='withdraw',risk=phase==='risk',growth=phase==='growth';
      // Growth is an arrival, not the reverse of a withdrawal: first the
      // independent customers reach staging, then the first shared loading
      // cycle begins. It stops before that carrier would leave the tool.
      const time=u*3,n=idle||risk||growth?0:Math.min(2,Math.floor(time));
      const q=idle||risk?0:growth?.70*ramp(u,.44,1):u===1?1:time-n;
      lots.forEach((c,i)=>{
        c.group.position.set(lanes[i],.30,1.65);c.group.visible=phase!=='empty';
        c.wafers.forEach(w=>w.visible=true);
        if(!idle&&!risk)c.wafers[4].visible=!(i<n||(i===n&&q>.36));
        if(growth){
          const arrived=ramp(u,.06+i*.07,.28+i*.07);
          c.group.position.z=mix(3.4,1.65,arrived);c.group.visible=u>.06+i*.07;
        }
      });
      queues.forEach((c,i)=>{
        c.group.visible=(phase==='queue'&&u>.06+i*.08)||risk;
        c.group.position.set(lanes[i],.30,risk?2.65:mix(3.4,2.65,ramp(u,.06+i*.08,.28+i*.08)));
        c.wafers.forEach(w=>w.visible=true);
      });
      let x=lanes[n],z=1.65,rx=0,rz=.65;
      if(!idle&&!risk&&(!growth||u>=.44)){
        const enterZ=ramp(q,.03,.17),enterX=ramp(q,.18,.33),leaveX=ramp(q,.76,.87),leaveZ=ramp(q,.88,1);
        x=mix(lanes[n],0,enterX)*(1-leaveX)+lanes[n]*leaveX;
        z=mix(1.65,.65,enterZ)*(1-leaveZ)+1.65*leaveZ;
        lots[n].group.position.set(x,.30,z);
        const transfer=ramp(q,.38,.66)*(1-ramp(q,.70,.85));
        rx=mix(0,destinations[n][0],transfer);rz=mix(.65,destinations[n][1],transfer);
      }
      if(phase==='withdraw')lots.forEach((c,i)=>{
        const leave=ramp(u,i*.15,.60+i*.15);c.group.position.z=1.65+1.75*leave;c.group.visible=leave<1;
      });
      processWafers.forEach((w,i)=>{
        w.visible=!idle&&(risk||i<n||(i===n&&q>=.66));
        chamberTags[i].visible=w.visible;
        const closed=w.visible?ramp(q,.67,.76):0;
        lids[i].position.y=growth?(i===0?1.10+.20*ramp(u,.36,.46)-.225*closed:1.10):
          idle?1.10:(risk||i<n?1.075:1.30-.225*closed);
      });
      movingWafer.visible=!idle&&!risk&&q>=.36&&q<.66;
      gate.position.y=!idle&&!risk&&q>.34&&q<.70?1.22:.65;
      statusMat.color.set(risk?C.fail:idle||(growth&&u<=.06)?C.dark:C.copper);
      robotAt(rx,rz);
      if(growth){x=lots[n].group.position.x;z=lots[n].group.position.z;}
      state={phase,u,activeCustomer:n,carrier:[x,.30,z],additionalLotsWaiting:queues.some(c=>c.group.visible),
        machineAvailable:!risk,numericalCapacityClaim:false,sharedLoadingPaths:1,
        illustrativeCommittedSlots:processWafers.filter(w=>w.visible).length,
        additionalIllustrativeLots:queues.filter(c=>c.group.visible).length,
        fixedEquipmentDoesNotScaleWithDemand:true,gateClosed:gate.position.y<1,
        transferWaferVisible:movingWafer.visible,
        ...(growth?{illustrativeArrivedCustomerLots:lots.filter(c=>c.group.visible).length,
          firstLoadingCycleProgress:q/.70,customerFlow:'Arriving independent customer work; not withdrawal'}:{})};
    }
    function cameraAt(u,phase){
      u=clamp(u);
      if(phase==='risk')return {position:[5.0,3.5,6.9],target:[0,.70,.20],fov:40};
      if(phase==='queue')return {position:[4.4,7.3,7.0],target:[0,.55,.15],fov:42};
      if(phase==='committed')return {position:[3.9,4.8,5.9],target:[0,.72,-.3],fov:40};
      // The same frame makes empty/withdraw/growth directly comparable: the
      // installed resource stays fixed while customer work leaves or arrives.
      if(phase==='empty'||phase==='withdraw'||phase==='growth')return {position:[5.8,4.3,7.7],target:[0,.62,-.20],fov:40};
      return {position:[5.6-.25*smooth(u),5.7,7.4],target:[0,.66,-.35],fov:40};
    }
    update(0,'shared');
    return {root,update,cameraAt,state:()=>({...state}),
      camera:{from:[5.6,5.7,7.4],to:[5.35,5.7,7.4],target:[0,.66,-.35],fov:40},
      label:'Sharing a factory does not remove its limits',
      disclosure:'SCHEMATIC capacity relationship • no actual factory capacity represented',
      modelNotes:'An illustrative cluster-tool cutaway makes shared loading, fixed equipment and competing customer work visible. Three chambers, cassette contents and timing are compositional choices, not TSMC tool specifications, production volumes or a manufacturing recipe.',
      anchors:{factory:[0,1.1,-.7],customers:[0,.8,1.65],queue:[0,.8,2.65],bottleneck:[0,.65,.08]}};
  }
  return {layers:makeLayers(),testing:makeTesting(),capacity:makeCapacity()};
}
