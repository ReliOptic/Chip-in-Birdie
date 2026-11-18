/**
 * S1E01 inspection and circuit inserts. Original illustrative film sets.
 *
 * The wafer test, package trays and enlarged specimens are different process
 * stages, joined by editorial cuts. Counts are NOT reported historical yields.
 * The copper bridge is one possible circuit failure, NOT a diagnosis of the
 * NVIDIA manufacturing problem in 1997. B is a separate corrected specimen;
 * nothing on specimen A magically heals. All animation is absolute in act p.
 */
export function createLabSet(T, kit) {
  const {box, cyl, mat, label, tube, M} = kit;
  const root = new T.Group(); root.name = 'illustrative-inspection-and-circuit';
  const room = new T.Group(); room.name = 'inspection-room-metres'; root.add(room);
  const macro = new T.Group(); macro.name = 'magnified-separate-test-specimens'; root.add(macro);
  const clamp = v => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  const smooth = (a,b,v) => { const q=clamp((v-a)/(b-a));return q*q*(3-2*q); };
  const lerp = (a,b,v) => a+(b-a)*v;
  const add = (g,o,name) => {if(name)o.name=name;g.add(o);return o;};
  const B = (g,w,h,d,m,x=0,y=0,z=0,r=.006) => add(g,box(w,h,d,m,x,y,z,r));
  const C = (g,r,h,m,x=0,y=0,z=0,n=20) => add(g,cyl(r,h,m,x,y,z,n));
  const plate = (g,text,w,h,x,y,z,rotX=0,options={}) => {
    const o=label(text,w,h,options);o.position.set(x,y,z);o.rotation.x=rotX;return add(g,o);
  };
  const grey = mat('#6e7d80',.57,.32);
  const enclosure = mat('#d4d5cc',.68,.06);
  const darkEnclosure = mat('#34464b',.64,.17);
  const silicon = mat('#324559',.24,.61);
  const siliconDie = mat('#3d526b',.31,.55);
  const scribe = mat('#aaa98d',.45,.52);
  const bronze = mat('#ba874d',.28,.68);
  const red = mat('#ad3e2f',.57,.02);
  const green = mat('#4e8b63',.62,.02);
  const amber = mat('#c99a4c',.55,.04);
  const screenOff = mat('#213131',.72,.05);
  const screenInk = mat('#091416',.68,0);
  const ceramic = mat('#bcc2bb',.78,.02);
  const copperTop = mat('#ce946d',.34,.67,{map:kit.texture('steel',311)});
  const copperEdge = mat('#8e5b3c',.43,.57);
  const copperFine = mat('#ab7442',.48,.53);
  const dielectric = mat('#405066',.59,.21,{map:kit.texture('floor',519)});
  const magnifiedSilicon = mat('#52627b',.52,.21,{map:kit.texture('floor',911)});
  const caution = 'Illustrative reconstruction · not archival footage';
  const macroCaution = 'Magnified illustrative circuit · not the diagnosed NVIDIA 1997 failure';

  // An actual-sized room, not a tabletop island. Its walls stay behind the
  // action; the front and ceiling are open to accommodate physical coverage.
  B(room,6,.10,5,M.floor,0,-.06,-.6,0);
  B(room,6,3.2,.12,enclosure,0,1.55,-2.30,0);
  B(room,.10,3.2,3.3,enclosure,-2.5,1.55,-.70,0);
  B(room,6,.13,.06,darkEnclosure,0,.12,-2.20,0);
  for(let i=0;i<6;i++) B(room,.014,3,.018,grey,-2.4+i*.96,1.55,-2.225,0);
  for(let i=0;i<5;i++) B(room,5.8,.003,.012,grey,0,-.006,-2+i*.85,0);
  for(let i=0;i<6;i++) B(room,.012,.003,4.6,grey,-2.4+i*.94,-.006,-.5,0);
  B(room,2.4,.88,.055,darkEnclosure,.9,1.83,-2.21,.015);
  B(room,2.28,.76,.012,mat('#8fa9ad',.32,.12),.9,1.83,-2.172,.005);
  B(room,.035,.78,.025,enclosure,.90,1.83,-2.153,0);
  B(room,2.3,.035,.025,enclosure,.90,1.83,-2.153,0);
  // Opaque far-room silhouettes behind an observation window. No period or
  // company identity is asserted by this illustrative architecture.
  for(let i=0;i<4;i++) {
    B(room,.30,.26,.008,grey,.05+i*.49,1.63,-2.158,0);
    B(room,.20,.055,.009,screenOff,.05+i*.49,1.80,-2.155,0);
  }
  plate(room,'ELECTRICAL TEST',1.0,.14,-1.40,2.27,-2.13,0,{background:'#d4d5cc',color:'#35494a',size:32});
  // Service cabinet at the room edge: a recognisable scale and lived-in work
  // setting without clutter in the wafer/probe sightline.
  B(room,.76,1.4,.52,enclosure,-1.65,.72,-1.4,.015);
  for(let i=0;i<4;i++) {
    B(room,.65,.27,.025,grey,-1.65,.25+i*.31,-1.127,.003);
    B(room,.21,.022,.035,M.steel,-1.65,.33+i*.31,-1.10,.003);
  }

  // Bench and prober: both the vertical movement and the XY wafer indexing
  // have guides, mounts and clear contact surfaces.
  B(room,1.92,.11,1.08,M.steel,0,.86,-.03,.013);
  B(room,1.80,.69,.94,enclosure,0,.46,-.03,.018);
  B(room,.02,.56,.014,grey,0,.46,.447,0);
  for(const x of [-.43,.43]) B(room,.18,.026,.04,M.steel,x,.67,.465,.003);
  for(const x of [-.79,.79]) for(const z of [-.42,.35]) C(room,.055,.12,M.rubber,x,.06,z,12);
  B(room,.82,.055,.69,darkEnclosure,-.29,.94,-.09,.007);
  for(const x of [-.57,-.01]) B(room,.032,.045,.58,M.steel,x,.984,-.08,.003);
  const xyStage=add(room,new T.Group(),'xy-stage');
  xyStage.position.set(-.29,1.018,-.07);
  B(xyStage,.43,.044,.43,grey,0,-.022,0,.006);
  C(xyStage,.184,.035,M.steel,0,.006,0,48);
  C(xyStage,.171,.012,M.rubber,0,.029,0,48);
  const wafer=add(xyStage,new T.Group(),'wafer-physical-no-colour-classification');
  C(wafer,.162,.003,silicon,0,.038,0,64);
  const diePositions=[];
  for(let ix=-3;ix<=3;ix++) for(let iz=-3;iz<=3;iz++) {
    const x=ix*.038,z=iz*.036;
    if(Math.hypot(Math.abs(x)+.016,Math.abs(z)+.014)>.156) continue;
    const die=B(wafer,.034,.0007,.032,siliconDie,x,.040,z,0);
    die.name=`physical-wafer-die-${ix}-${iz}`;
    // Two lithographic areas are enough to read a die without a fantasy
    // glowing network. Thin metallic pads remain normal in failed tests.
    B(wafer,.012,.0002,.020,silicon,x-.006,.0405,z,0);
    B(wafer,.009,.0002,.011,scribe,x+.008,.0405,z-.004,0);
    diePositions.push([x,z]);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    C(xyStage,.005,.003,M.ink,Math.cos(a)*.176,.025,Math.sin(a)*.176,8);
  }
  // C-frame supports the head from the rear, leaving its front open.
  B(room,.11,.78,.14,darkEnclosure,-.64,1.31,-.38,.008);
  B(room,.47,.11,.14,darkEnclosure,-.435,1.65,-.38,.008);
  B(room,.12,.10,.42,darkEnclosure,-.23,1.65,-.23,.008);
  for(const x of [-.268,-.192]) C(room,.012,.50,M.steel,x,1.40,-.20,12);
  const probe=add(room,new T.Group(),'probe-carriage'); probe.position.x=-.23;probe.position.z=-.07;
  B(probe,.15,.05,.22,grey,0,.055,-.09,.005);
  B(probe,.16,.16,.15,enclosure,0,.015,0,.009);
  C(probe,.043,.072,M.ink,0,-.09,0,24);
  C(probe,.058,.012,bronze,0,-.127,0,24);
  C(probe,.031,.018,M.steel,0,-.140,0,20);
  const needles=[];
  for(const x of [-.009,.008]) for(const z of [-.006,0]) {
    const n=new T.Mesh(new T.ConeGeometry(.0018,.016,8),M.steel);
    n.rotation.z=Math.PI;n.position.set(x,-.157,z);n.castShadow=true;add(probe,n);needles.push(n);
  }
  add(room,tube([[-.61,1.57,-.40],[-.56,1.79,-.46],[-.24,1.81,-.36],[-.18,1.61,-.10]],.017,M.rubber));
  C(room,.027,.012,red,-.76,.930,.32,16);
  plate(room,'STOP',.11,.025,-.76,.938,.39,-Math.PI/2,{background:'#ccd1c8',size:25});

  // A modest 1990s-shaped terminal, but no invented manufacturer/period model.
  const terminal=add(room,new T.Group(),'test-terminal');terminal.position.set(.58,1.255,-.25);
  B(terminal,.47,.35,.33,enclosure,0,0,0,.025);
  B(terminal,.385,.273,.015,M.ink,0,.008,.174,.018);
  B(terminal,.345,.235,.008,screenInk,0,.013,.185,.008);
  B(room,.14,.15,.15,enclosure,.58,.988,-.24,.009);
  B(room,.46,.03,.28,enclosure,.58,.924,-.24,.008);
  plate(terminal,'ELECTRICAL TEST',.29,.036,0,.098,.192,0,{background:'#091416',color:'#b7cbb8',size:27});
  plate(terminal,'ILLUSTRATIVE SAMPLE',.30,.022,0,-.079,.192,0,{background:'#091416',color:'#8caaa4',size:22});
  const statuses=[];
  for(let i=0;i<6;i++) {
    const x=(i%3-1)*.095,y=.034-Math.floor(i/3)*.055;
    B(terminal,.080,.043,.004,grey,x,y,.192,0);
    statuses.push(B(terminal,.071,.034,.004,screenOff,x,y,.197,0));
  }
  const resultLamp=C(room,.018,.014,amber,.83,1.02,-.06,16);resultLamp.rotation.x=Math.PI/2;
  B(room,.30,.028,.14,enclosure,.59,.937,.16,.005);
  for(let y=0;y<3;y++) for(let x=0;x<9;x++) B(room,.021,.006,.021,grey,.475+x*.028,.956,.12+y*.032,.001);

  function packageChip(parent,x,y,z) {
    const g=add(parent,new T.Group());g.position.set(x,y,z);
    B(g,.058,.009,.056,M.ink,0,.0045,0,.002);
    B(g,.029,.002,.027,grey,0,.010,0,.001);
    for(let i=0;i<4;i++) {
      const a=(i-1.5)*.012;
      B(g,.006,.002,.009,M.steel,a,.002,-.032,0);
      B(g,.006,.002,.009,M.steel,a,.002,.032,0);
      B(g,.009,.002,.006,M.steel,-.033,.002,a,0);
      B(g,.009,.002,.006,M.steel,.033,.002,a,0);
    }
    return g;
  }
  function tray(parent,x,z,name,colour,columns,rows) {
    const g=add(parent,new T.Group(),`${name.toLowerCase()}-package-tray`);g.position.set(x,.945,z);
    const w=columns*.091+.035,d=rows*.086+.065;
    B(g,w,.025,d,darkEnclosure,0,0,0,.004);
    const pockets=[];
    for(let j=0;j<rows;j++) for(let i=0;i<columns;i++) {
      const px=(i-(columns-1)/2)*.091,pz=(j-(rows-1)/2)*.086;
      B(g,.075,.004,.073,M.rubber,px,.015,pz,0);
      for(const sx of [-1,1]) B(g,.005,.012,.078,grey,px+sx*.040,.020,pz,0);
      for(const sz of [-1,1]) B(g,.079,.012,.005,grey,px,.020,pz+sz*.039,0);
      pockets.push(packageChip(g,px,.017,pz));
    }
    B(g,w-.03,.003,.025,colour,0,.015,d/2-.015,0);
    plate(g,name,w-.04,.023,0,.019,d/2-.014,-Math.PI/2,{background:name==='HOLD'?'#ad3e2f':'#4e8b63',color:'#ffffff',size:29});
    return {group:g,pockets,x,z};
  }
  const accept=tray(room,.45,.40,'WORKING',green,4,2);
  const reject=tray(room,-.17,.41,'HOLD',red,3,2);

  // The macro set is a different, explicitly magnified stage. The specimen
  // swap has a lateral rail, two labelled carriers, and a probe that lifts
  // before translation. It is not an impossible repair of the old specimen.
  B(macro,6,.09,4,M.ink,0,-.09,0,0);
  B(macro,4.10,.10,1.13,darkEnclosure,0,-.005,0,.012);
  for(const z of [-.41,.41]) B(macro,3.9,.038,.045,M.steel,0,.063,z,.005);
  for(const x of [-1.88,1.88]) B(macro,.11,.10,.98,grey,x,.042,0,.006);
  B(macro,.18,.48,.13,grey,0,.26,-.62,.010);
  B(macro,.78,.07,.53,grey,0,.51,-.39,.008);
  for(const x of [-.21,.21]) C(macro,.010,.22,M.steel,x,.44,-.19,12);
  const macroProbe=add(macro,new T.Group(),'macro-test-probe');
  B(macroProbe,.45,.07,.14,ceramic,0,.06,-.19,.008);
  for(const x of [-.14,.14]) {
    C(macroProbe,.009,.105,M.steel,x,-.020,-.19,12);
    const tip=new T.Mesh(new T.ConeGeometry(.009,.035,12),M.steel);tip.rotation.z=Math.PI;
    tip.position.set(x,-.090,-.19);tip.castShadow=true;add(macroProbe,tip);
    C(macroProbe,.022,.025,bronze,x,.020,-.19,12);
  }
  add(macro,tube([[-.27,.54,-.44],[-.39,.66,-.57],[.39,.66,-.57],[.27,.54,-.44]],.014,M.rubber));
  const macroResult=add(macro,new T.Group(),'macro-test-readout');macroResult.position.set(.91,.22,-.48);
  B(macroResult,.36,.26,.08,enclosure,0,0,0,.012);
  B(macroResult,.25,.12,.007,screenInk,0,.02,.048,.004);
  const shortLabel=plate(macroResult,'SHORT',.22,.09,0,.02,.055,0,{background:'#ad3e2f',color:'#fff4e4',size:40});
  const clearLabel=plate(macroResult,'ISOLATED',.22,.09,0,.02,.056,0,{background:'#4e8b63',color:'#f4fff2',size:32});
  plate(macroResult,'TEST',.16,.034,0,-.078,.052,0,{background:'#d4d5cc',color:'#34464b',size:28});

  function specimen(id,hasBridge) {
    const g=add(macro,new T.Group(),`separate-specimen-${id}`);
    B(g,1.17,.037,.81,grey,0,.082,0,.007);
    B(g,1.02,.045,.66,dielectric,0,.121,0,.005);
    B(g,1.00,.003,.64,magnifiedSilicon,0,.1455,0,.001);
    // The raised two-wire circuit is deliberately simple enough to read in
    // a close shot: a real air/insulator gap versus a conductive bridge.
    for(const x of [-.14,.14]) {
      B(g,.074,.018,.51,copperEdge,x,.156,0,.002);
      B(g,.068,.003,.50,copperTop,x,.166,0,.001);
      for(const z of [-.227,.227]) {
        C(g,.063,.018,copperEdge,x,.157,z,24);
        C(g,.058,.003,copperTop,x,.167,z,24);
        C(g,.018,.004,bronze,x,.171,z,16);
      }
    }
    // Peripheral routing provides scale/material specificity without turning
    // the central two conductors into a decorative circuit-board wallpaper.
    for(const side of [-1,1]) for(let i=0;i<4;i++) {
      const x=side*(.29+i*.044),z=-.07+i*.04;
      B(g,.009,.005,.38-i*.045,copperFine,x,.151,z,0);
      B(g,.06,.005,.009,copperFine,x-side*.025,.151,.12+i*.017,0);
      C(g,.012,.005,bronze,x,.153,-.27+i*.031,10);
    }
    for(const x of [-.535,.535]) for(const z of [-.35,.35]) {
      C(g,.014,.008,M.steel,x,.108,z,12);
      B(g,.018,.002,.003,M.ink,x,.113,z,0);
    }
    plate(g,`SPECIMEN ${id}`, .40,.048,0,.105,.365,-Math.PI/2,{background:'#6e7d80',color:'#f3efe0',size:30});
    let bridge=null;
    if(hasBridge) {
      const shape=new T.Shape();
      shape.moveTo(-.110,-.030);shape.lineTo(-.042,-.022);shape.lineTo(-.010,-.037);
      shape.lineTo(.034,-.017);shape.lineTo(.110,-.025);shape.lineTo(.114,.028);
      shape.lineTo(.029,.024);shape.lineTo(-.013,.034);shape.lineTo(-.061,.018);shape.lineTo(-.110,.026);shape.closePath();
      const geometry=new T.ExtrudeGeometry(shape,{depth:.007,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.001,bevelThickness:.001});
      geometry.scale(1,.26,1);
      geometry.rotateX(-Math.PI/2);
      bridge=new T.Mesh(geometry,copperTop);bridge.position.set(0,.160,.035);bridge.castShadow=bridge.receiveShadow=true;
      bridge.name='possible-bridge-defect-not-NVIDIA-diagnosis';add(g,bridge);
    }
    return {group:g,bridge};
  }
  const specimenA=specimen('A',true),specimenB=specimen('B',false);
  // Bed end stops and an index stripe reveal the actual lateral movement.
  for(const x of [-1.65,0,1.65]) B(macro,.018,.002,.12,M.white,x,.116,.50,0);

  const passPattern=[false,true,false,false,true,false];
  // Positions correspond to actual die centres in the physical wafer grid.
  const sampleSites=[[0,0],[.038,0],[.038,.036],[0,.036],[-.038,.036],[-.038,0]];
  const waferTop=1.018+.0406,probeTipOffset=-.165;
  let latest={act:'inspection',p:0,shot:'probe'};

  function scanState(p,repeating) {
    const count=6,q=clamp((p-.055)/.82)*count;
    const cycle=Math.min(count-1,Math.floor(q)),u=q>=count?1:q-cycle;
    // Index only while the probe is clear. Finite strokes, not oscillating
    // screen decoration; all tests settle into a final state after p=.875.
    const index=smooth(0,.18,u),contact=smooth(.20,.39,u)*(1-smooth(.75,.91,u));
    const previous=sampleSites[Math.max(0,cycle-1)],next=sampleSites[cycle];
    const dx=lerp(previous[0],next[0],index),dz=lerp(previous[1],next[1],index);
    const tested=Math.min(count,cycle+(u>=.67?1:0));
    const outcome=u>=.57&&u<.90?(repeating?true:passPattern[cycle]):null;
    return {cycle,cycleProgress:u,contact,dx,dz,tested,outcome};
  }
  function roomFrame(act,p) {
    room.visible=true;macro.visible=false;
    const repeating=act==='repeat';
    const s=scanState(p,repeating);
    // Fixed probe axis x=-.23. The wafer makes a small, visible linear XY step
    // under it. It does not rotate with the camera.
    xyStage.position.set(-.23-s.dx,1.018,-.07-s.dz);
    probe.position.y=waferTop-probeTipOffset+.23*(1-s.contact);
    resultLamp.material=s.outcome===null?amber:s.outcome?green:red;
    statuses.forEach((o,i)=>o.material=i<s.tested?(repeating||passPattern[i]?green:red):screenOff);
    const goodCount=repeating?s.tested:passPattern.slice(0,s.tested).filter(Boolean).length;
    const rejectCount=repeating?0:s.tested-goodCount;
    accept.pockets.forEach((o,i)=>o.visible=i<goodCount);
    reject.pockets.forEach((o,i)=>o.visible=i<rejectCount);
    // A drawer pull exposes the empty compartments as the consequence.
    const reveal=smooth(.78,.96,p);
    accept.group.position.set(accept.x,.945,accept.z+.085*reveal);
    reject.group.position.set(reject.x,.945,reject.z+.085*reveal);
    return {
      act,p,stage:'electrical-test-and-later-package-results',illustrative:true,
      sampleCountsNotHistorical:true,tested:s.tested,accepted:goodCount,rejected:rejectCount,
      probeTipY:probe.position.y+probeTipOffset,waferSurfaceY:waferTop,
      contact:s.contact>.999,probeClearance:.23*(1-s.contact),
      waferIndex:[s.dx,s.dz],testOutcome:s.outcome,drawerReveal:reveal,
      historyClaim:'No actual NVIDIA 1997 wafer, equipment, yield or sorting sequence is reconstructed.'
    };
  }
  function macroFrame(act,p) {
    room.visible=false;macro.visible=true;
    const repairing=act==='repair',swap=repairing?smooth(.20,.61,p):0;
    specimenA.group.position.set(-1.65*swap,0,0);
    specimenB.group.position.set(1.65*(1-swap),0,0);
    specimenA.group.visible=true;specimenB.group.visible=repairing;
    // Contact is always released before the lateral exchange starts.
    const contact=repairing?(1-smooth(.02,.15,p))+smooth(.68,.83,p):smooth(.09,.25,p);
    macroProbe.position.y=.1685+.1075+.16*(1-contact);
    const resultVisible=repairing?(p<.02||p>.86):p>.32;
    shortLabel.visible=resultVisible&&(!repairing||p<.15);
    clearLabel.visible=resultVisible&&repairing&&p>.86;
    return {
      act,p,stage:'magnified-separate-specimens',illustrative:true,
      actualNvidiaFailureCause:false,specimenAHasPermanentBridge:true,specimenBHasNoBridge:true,
      activeSpecimen:swap<.5?'A':'B',specimenAX:specimenA.group.position.x,specimenBX:specimenB.group.position.x,
      specimenSwap:swap,probeContact:contact>.999,probeClearance:.16*(1-contact),
      response:shortLabel.visible?'short':clearLabel.visible?'isolated':'pending',
      historyClaim:'One possible bridge mechanism; separate corrected specimen. Not a diagnosis or repair record of NVIDIA in 1997.'
    };
  }
  function camera(position,target,fov,look,u,push=.035) {
    const q=1-(1-u)*(1-u),k=1-push*q;
    return {position:position.map((v,i)=>target[i]+(v-target[i])*k),target:[...target],fov,look};
  }
  const roomLook={background:'#b5bfbb',key:'#fff2dc',fill:'#c5d8df',exposure:1.03};
  const macroLook={background:'#111b22',key:'#ffe1b9',fill:'#b4ccdc',exposure:1.07};
  function frame({act='inspection',p=0,shot='probe',u=0,t=0}={}) {
    p=clamp(p);u=clamp(u);
    const enlarged=act==='defect'||act==='repair';
    // Reset both sets, including the currently hidden one. A -> B -> A seeks
    // reproduce the entire scene graph, not only whichever pixels are visible.
    const roomState=roomFrame(enlarged?'inspection':act,enlarged?0:p);
    const macroState=macroFrame(enlarged?act:'defect',enlarged?p:0);
    room.visible=!enlarged;macro.visible=enlarged;
    const state=enlarged?macroState:roomState;
    let pose;
    if(enlarged) {
      // Overhead, grazing side and three-quarter close-up are different camera
      // setups. No azimuth is advanced by time and no set turns for variety.
      if(shot==='gap') pose=camera([.015,.68,.12],[0,.160,.035],29,macroLook,u,.045);
      else if(shot==='section') pose=camera([.33,.205,.69],[0,.153,.035],30,macroLook,u,.045);
      else if(act==='repair'&&p<.68) pose=camera([.26,1.09,1.88],[-.06,.12,0],42,macroLook,u,.015);
      else pose=camera([.58,.62,.94],[0,.155,.015],39,macroLook,u,.045);
    } else if(shot==='wafer') {
      // A genuinely overhead insert is offset from the probe axis so the
      // opaque head does not cover the wafer. The probe remains at screen edge.
      pose=camera([-.69,1.84,.29],[-.25,1.052,-.055],35,roomLook,u,.035);
    } else if(shot==='test') pose=camera([1.00,1.32,.80],[.54,1.255,-.075],31,roomLook,u,.025);
    else if(shot==='reject') pose=camera([.36,1.37,1.28],[.17,.956,.48],39,roomLook,u,.045);
    else if(shot==='repeat') pose=camera([1.28,1.43,1.65],[.12,1.02,.10],40,roomLook,u,-.035);
    else if(shot==='probe') pose=camera([.12,1.16,.58],[-.23,1.07,-.06],37,roomLook,u,.035);
    else pose=camera([1.84,1.51,2.10],[0,1.06,-.12],43,roomLook,u,.025);
    latest={...state,shot,t:Number.isFinite(t)?t:0,cameraPosition:pose.position,cameraTarget:pose.target};
    return {
      ...pose,
      label:enlarged?'ILLUSTRATIVE CIRCUIT · NOT HISTORICAL FAILURE DIAGNOSIS':'ILLUSTRATIVE RECONSTRUCTION',
      detail:enlarged?macroCaution:`${caution} · sample counts are not historical yield`,
      state:latest
    };
  }
  let meshes=0,triangles=0;
  root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  frame();
  return {
    root,frame,
    inspect:()=>({name:root.name,meshes,triangles,triangleBudget:25000,withinBudget:triangles<=25000,
      supportedActs:['inspection','defect','repair','repeat'],
      supportedShots:['probe','wafer','test','reject','macro','section','gap','repeat'],
      geometryCreatedOnlyAtSetup:true,closedFormAnimation:true,noOrbit:true,
      physicalWaferDies:diePositions.length,waferNeverPaintedToPretendFailures:true,
      separateCorrectedSpecimen:true,actualNvidiaFailureCause:false,...latest})
  };
}
