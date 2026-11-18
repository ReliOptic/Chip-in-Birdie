/**
 * S1E01 illustrative mechanism stages.
 * Authored geometry, not a reconstruction of a TSMC process or production line.
 * All transforms are functions of (phase, u); no frame history, random state,
 * timers, physics integrator, renderer, or audio clock is owned by this module.
 *
 * Visual methods: hierarchical exploded parts and material-led lighting,
 * informed by aimotion technique notes 148 / 147; no demo assets are copied.
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
    const root=new T.Group();root.name='Illustrative material stack';base(root,5.3,4.3);
    const stack=new T.Group();root.add(stack);
    const substrate=plate(stack,[0,0.32,0],3.4,3.2,0.3,M.silicon,'Silicon substrate');
    const dielectric=plate(stack,[0,0.66,0],3.35,3.15,0.1,M.dielectric,'Insulating layer');
    const blanket=plate(stack,[0,0.79,0],3.31,3.11,0.045,M.copper,'Blanket metal film');
    const traced=motif(stack,{scale:1.65,y:0.84,name:'Patterned metal'});
    const resistMat=M.resist.clone();resistMat.transparent=true;
    const resist=plate(stack,[0,0.86,0],3.30,3.10,0.10,resistMat,'Full resist coating');
    const resistTrace=motif(stack,{scale:1.65,y:0.93,mat:M.resist,name:'Retained resist pattern'});
    const mask=new T.Group();mask.name='Schematic reticle';root.add(mask);
    for(const x of [-1.9,1.9]) box(mask,[x,0,0],[0.13,0.14,3.7],M.steel);
    for(const z of [-1.8,1.8]) box(mask,[0,0,z],[3.9,0.14,0.13],M.steel);
    const glass=new T.MeshBasicMaterial({color:0xc4d7dc,transparent:true,opacity:0.11,
      depthWrite:false,side:T.DoubleSide});
    box(mask,[0,0,0],[3.7,0.035,3.5],glass);
    motif(mask,{scale:1.65,y:0.035,mat:M.dark,name:'Opaque reticle pattern'});
    const exposure=new T.MeshBasicMaterial({color:0xc8deed,transparent:true,opacity:0.09,
      depthWrite:false,side:T.DoubleSide});
    const lightVolume=box(root,[0,1.55,0],[3.28,1.3,3.08],exposure,'Exposure region, schematic');
    lightVolume.castShadow=false;
    const upper=new T.Group();root.add(upper);
    const upperInsulator=plate(upper,[0,0,0],3.29,3.09,0.10,M.dielectric,'Next insulating layer');
    const upperTrace=motif(upper,{scale:1.65,y:0.17,name:'Aligned upper connection'});
    const via=new T.Group();upper.add(via);
    for(const [x,z] of [[-0.9075,-1.0725],[1.0725,0.99]])
      cyl(via,[x,-0.03,z],[0.115,0.4,0.115],M.copper,'Vertical connection');
    // Small datum marks remain on the base, not in screen space.
    for(const [x,z] of [[-1.7,-1.55],[1.7,1.55]]) {
      box(root,[x,0.245,z],[0.28,0.012,0.025],M.ceramic);
      box(root,[x,0.245,z],[0.025,0.012,0.28],M.ceramic);
    }
    let state={};
    function update(u,phase='assembled') {
      u=clamp(u);
      stack.position.set(0,0,0);stack.rotation.set(0,0,0);
      substrate.position.y=0.32;dielectric.position.y=0.66;blanket.position.y=0.79;
      traced.position.set(0,0.84,0);traced.scale.setScalar(1.65);
      resist.position.set(0,0.86,0);resist.scale.set(1,1,1);resistMat.opacity=1;
      resistTrace.position.set(0,0.93,0);resistTrace.scale.setScalar(1.65);
      mask.position.set(0,2.55,0);mask.rotation.set(0,0,0);
      upper.position.set(0,1.10,0);upper.rotation.set(0,0,0);
      upperInsulator.visible=true;upperTrace.visible=true;via.visible=true;
      blanket.visible=false;traced.visible=true;resist.visible=false;
      resistTrace.visible=false;mask.visible=false;lightVolume.visible=false;upper.visible=false;
      let error=0;
      if(phase==='coat') {
        blanket.visible=true;traced.visible=false;resist.visible=true;
        resist.scale.y=Math.max(0.01,ramp(u,0.12,0.76));
        resist.position.y=0.85;
      } else if(phase==='pattern') {
        blanket.visible=true;traced.visible=false;mask.visible=true;
        mask.position.y=mix(2.8,2.30,ramp(u,0,0.25));
        lightVolume.visible=u>0.24&&u<0.56;
        resist.visible=u<0.82;resistMat.opacity=1-ramp(u,0.56,0.82);
        resistTrace.visible=u>=0.56;
      } else if(phase==='etch') {
        blanket.visible=u<0.65;blanket.scale.y=Math.max(0.015,1-ramp(u,0.12,0.65));
        traced.visible=true;resistTrace.visible=u<0.84;
        resistTrace.position.y=0.93+0.45*ramp(u,0.66,0.84);
      } else if(phase==='align') {
        upper.visible=true;upper.position.y=mix(1.9,1.10,ramp(u,0.62,0.94));
        error=0.46*(1-ramp(u,0.18,0.60));
        upper.position.x=error;upper.position.z=-error*0.5;
      } else if(phase==='explode') {
        const e=ramp(u,0.08,0.80);
        dielectric.position.y=0.66+e*0.35;
        traced.position.y=0.84+e*0.80;
        upper.visible=true;upper.position.y=1.10+e*1.55;
      } else {
        upper.visible=true;
        upper.position.y=1.10+0.035*(1-ramp(u,0,0.3));
      }
      if(phase!=='etch') blanket.scale.set(1,1,1);
      state={phase,u,alignmentOffset:error,upperHeight:upper.position.y,
        hasPattern:traced.visible||resistTrace.visible,illustrative:true};
    }
    update(0,'assembled');
    return {root,update,state:()=>({...state}),
      camera:{from:[6.0,5.1,6.4],to:[5.0,4.4,6.0],target:[0,1.05,0],fov:35},
      label:'A design must fit a manufacturing process',
      disclosure:'Schematic pattern transfer · Optics and recipe omitted',
      modelNotes:'Layer thickness is exaggerated. The L shape is an interconnect motif, not a transistor or a functioning circuit model. No TSMC process recipe is reproduced.',
      anchors:{substrate:[-1.7,0.5,0],pattern:[1.08,0.9,0.99],upper:[0,2.5,0]}};
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
    // Cell colours change only after a measurement; no implied real yield value.
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
    // Supported x/z gantry. The contact head moves; the wafer stays clamped.
    for(const x of [-2.35,2.35]){
      box(root,[x,1.42,-1.54],[0.18,2.4,0.22],M.ceramic);
      box(root,[x,0.31,-1.54],[0.44,0.15,0.54],M.dark);
    }
    box(root,[0,2.67,-1.54],[4.88,0.24,0.30],M.ceramic,'Gantry beam');
    box(root,[0,2.50,-1.38],[4.65,0.06,0.07],M.steel,'Linear guide');
    const carriage=new T.Group();root.add(carriage);
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
    }
    const cable=line(root,[[-2.2,2.9,-1.55],[-1.2,3.0,-1.4],[0,2.82,-1.35]],M.dark,0.04);
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
      const scan=(phase==='overview'?0:phase==='result'?1:u);
      const k=Math.min(demonstrator.length-1,Math.floor(scan*demonstrator.length));
      const active=cells[demonstrator[k]],f=(scan*demonstrator.length)%1;
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
        measuredData:false,numericalYieldClaim:false,waferStationary:true};
    }
    update(0,'overview');
    return {root,update,state:()=>({...state}),
      camera:{from:[5.7,5.8,7.4],to:[4.7,5.0,6.8],target:[0,0.95,0],fov:35},
      label:'Looking finished is not the same as working',
      disclosure:'Illustrative test map · not measured data',
      modelNotes:'Seven readable probe moves illustrate contact mechanics. They do not measure every die or generate the result map. Result colours are authored examples, not TSMC yield data or an electrical simulation.',
      anchors:{probe:[0,1.2,0],wafer:[0,0.75,0],notch:[0,0.745,1.80]}};
  }
  function makeCapacity() {
    const root=new T.Group();root.name='Shared manufacturing capacity, schematic';base(root,7.0,5.1);
    const body=plate(root,[0,0.24,-1.35],3.5,1.65,2.25,M.ceramic,'Shared production module');
    box(root,[0,1.52,-0.503],[2.82,1.63,0.07],M.dark,'Process bay');
    for(const x of [-1.08,0,1.08]) {
      box(root,[x,1.40,-0.445],[0.86,1.15,0.06],M.steel,'Fixed tool bay');
      box(root,[x,1.40,-0.400],[0.72,0.98,0.04],M.dark,'Process chamber door');
      box(root,[x,0.84,-0.20],[0.94,0.12,0.46],M.steel,'Load shelf');
      cyl(root,[x,2.56,-1.34],[0.15,0.22,0.15],M.steel,'Exhaust riser');
    }
    const statusMat=material(C.pass,0.1,0.4);
    const status=box(root,[1.44,2.16,-0.493],[0.08,0.16,0.025],statusMat,'Machine availability');
    for(let i=0;i<9;i++)box(root,[-1.25+i*0.31,0.50,-0.490],[0.19,0.018,0.025],M.dark);
    const lanes=[-2.35,0,2.35];
    const lots=[],queues=[];
    function carrier(parent,x,z,scale=1) {
      const g=new T.Group();parent.add(g);g.position.set(x,0.30,z);g.scale.setScalar(scale);
      plate(g,[0,0,0],0.9,0.80,0.07,M.dark,'Carrier base');
      for(const side of [-0.44,0.44]) {
        box(g,[side,0.36,0],[0.065,0.68,0.66],M.dark);
        for(let j=0;j<5;j++)box(g,[side*0.88,0.14+j*0.10,0],[0.08,0.025,0.62],M.steel);
      }
      box(g,[0,0.38,-0.36],[0.9,0.76,0.055],M.dark);
      box(g,[0,0.77,0],[0.92,0.07,0.18],M.steel,'Carrier handle');
      for(let j=0;j<5;j++){
        cyl(g,[0,0.16+j*0.1,0],[0.36,0.015,0.36],M.silicon,'Wafer in carrier');
        if(j===4)motif(g,{scale:0.35,y:0.578,name:'Top wafer customer layout'});
      }
      batchFixedParts(g);
      return g;
    }
    for(let i=0;i<3;i++) {
      const x=lanes[i];
      plate(root,[x,0.24,1.20],1.35,1.75,0.09,M.ceramic,'Customer staging lane');
      for(const dx of [-0.48,0.48])box(root,[x+dx,0.36,1.22],[0.045,0.06,1.55],M.steel,'Carrier alignment rail');
      lots.push(carrier(root,x,1.12));
      const ticket=new T.Group();root.add(ticket);ticket.position.set(x,0.32,2.08);
      plate(ticket,[0,0,0],0.58,0.26,0.025,M.ceramic);
      // A/B/C are abstract customer lanes, not actual historical companies.
      for(let n=0;n<=i;n++)box(ticket,[-0.16+n*0.16,0.04,0],[0.065,0.025,0.13],M.copper);
      const q=carrier(root,x,2.36,0.62);queues.push(q);
    }
    const gantry=new T.Group();root.add(gantry);
    for(const x of [-3.25,3.25])box(root,[x,1.74,0.25],[0.12,3.0,0.18],M.steel,'Handling gantry column');
    box(root,[0,3.23,0.25],[6.65,0.16,0.2],M.ceramic,'Handling gantry beam');
    const travel=box(gantry,[0,3.12,0.25],[0.4,0.26,0.4],M.dark,'Gantry carriage');
    const zRail=box(gantry,[0,2.95,0.48],[0.18,0.12,2.8],M.steel,'Supported longitudinal guide');
    const zRunner=box(gantry,[0,2.83,0.25],[0.28,0.20,0.35],M.dark,'Longitudinal carriage');
    const wrist=box(gantry,[0,2.05,0.25],[0.10,2.0,0.10],M.steel,'Lift column');
    const gripper=new T.Group();gantry.add(gripper);
    box(gripper,[0,0,0],[0.72,0.09,0.16],M.steel);
    for(const x of [-0.36,0.36])box(gripper,[x,-0.10,0],[0.05,0.22,0.16],M.dark);
    let state={};
    function update(u,phase='shared') {
      u=clamp(u);statusMat.color.set(phase==='risk'?C.fail:C.pass);
      lots.forEach((g,i)=>{g.position.set(lanes[i],0.30,1.12);g.rotation.set(0,0,0);g.visible=true;});
      queues.forEach((g,i)=>{g.visible=phase==='queue'||phase==='risk';g.position.set(lanes[i],0.30,2.36);});
      const n=phase==='risk'?0:Math.min(2,Math.floor(u*3)),q=(u*3)%1;
      const startX=lanes[n],bayX=[-1.08,0,1.08][n];
      let x=startX,z=1.12,y=0.30;
      if(phase!=='risk'&&phase!=='empty'&&phase!=='withdraw') {
        const lift=ramp(q,0.08,0.22)*(1-ramp(q,0.68,0.82));
        const go=ramp(q,0.22,0.45)*(1-ramp(q,0.52,0.68));
        x=mix(startX,bayX,go);z=mix(1.12,-0.05,go);y=0.30+lift*0.66;
        lots[n].position.set(x,y,z);
      }
      if(phase==='empty')lots.forEach(g=>g.visible=false);
      if(phase==='withdraw')lots.forEach((g,i)=>{
        g.position.z=1.12+1.6*ramp(u,i*0.2,i*0.2+0.5);
        g.visible=u<i*0.2+0.5;
      });
      gantry.position.x=x;
      travel.position.z=0.25;zRail.position.z=0.48;zRunner.position.z=z;
      wrist.position.set(0,(2.75+y+0.84)/2,z);
      wrist.scale.y=2.75-(y+0.84);
      gripper.position.set(0,y+0.89,z);
      state={phase,u,activeCustomer:n,carrier:[x,y,z],additionalLotsWaiting:queues[0].visible,
        machineAvailable:phase!=='risk',numericalCapacityClaim:false};
    }
    update(0,'shared');
    return {root,update,state:()=>({...state}),
      camera:{from:[7.8,6.1,8.2],to:[6.7,5.5,7.8],target:[0,1.25,0],fov:36},
      label:'Sharing a factory does not remove its limits',
      disclosure:'SCHEMATIC capacity relationship • no actual factory capacity represented',
      anchors:{factory:[0,2.5,-1.2],customers:[0,0.55,1.2],queue:[0,0.55,2.36]}};
  }
  return {layers:makeLayers(),testing:makeTesting(),capacity:makeCapacity()};
}
