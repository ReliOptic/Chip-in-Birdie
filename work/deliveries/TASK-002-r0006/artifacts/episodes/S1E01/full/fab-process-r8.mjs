/**
 * S1E01 R8 — new mechanism studies, metres / Y up. Not a named OEM cutaway.
 * FOUP, wafer, docking datum/stroke use fab-hardware-r8 published anchors.
 * Robot, chamber and package geometry are derived explanatory constructions.
 * Motion durations and layer thicknesses are editorial, not process settings.
 * Sources: TDK TAS300-J1; Muratec Transport System; ASML Six Crucial Steps.
 */
import {createFabHardware, phase} from './fab-hardware-r8.mjs';

const C=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const mix=(a,b,u)=>a+(b-a)*u;
const V=(a,b,u)=>a.map((n,i)=>mix(n,b[i],u));
const BASE=[.42,-.95],L1=.51,L2=.50,WAFER_Y=1.061;

export function efemState(progress=0){
  const p=C(progress),dock=phase(p,0,.16),withdraw=phase(p,.19,.29),lower=phase(p,.29,.41);
  const insert=phase(p,.44,.62),contact=phase(p,.62,.67),lift=phase(p,.67,.72),retract=phase(p,.75,.96);
  const z=mix(-.55,.007,insert)-.557*retract,wy=WAFER_Y+.002*lift;
  const wrist=[0,z-.23],dx=wrist[0]-BASE[0],dz=wrist[1]-BASE[1];
  const cos2=Math.max(-1,Math.min(1,(dx*dx+dz*dz-L1*L1-L2*L2)/(2*L1*L2)));
  const q2=Math.acos(cos2),q1=Math.atan2(dz,dx)-Math.atan2(L2*Math.sin(q2),L1+L2*Math.cos(q2));
  const elbow=[BASE[0]+L1*Math.cos(q1),BASE[1]+L1*Math.sin(q1)];
  const padY=WAFER_Y-.0004-.0035+.0035*contact+.002*lift;
  const picked=p>=.67;
  return {p,dock,withdraw,lower,insert,contact,lift,retract,podZ:.07*(1-dock),doorRetreat:.075*withdraw,
    doorDrop:.34*lower,wafer:[0,wy,picked?z:.007+.07*(1-dock)],padY,bladeZ:z,
    waferDiameter:.300,waferThickness:.0008,base:[...BASE],elbow,wrist,angles:[q1,q2],linkLengths:[L1,L2],
    support:picked?'ceramic-blade-pads':'FOUP-slot-rails',doorClear:lower>.999&&withdraw>.999,
    stage:p<.16?'dock':p<.29?'door-withdraw':p<.41?'door-lower':p<.62?'blade-insert':p<.67?'contact':p<.72?'lift':p<.75?'supported-hold':p<.96?'retract':'wafer-extracted'};
}

export function packageState(progress=0){
  const p=C(progress),pickDie=[-.062,.8013,.012],placeDie=[.044,.8018,0],pickLid=[.044,.805,-.073],placeLid=[.044,.8052,0],safe=.855;
  let head,stage,dieSupport='tray',lidSupport='tray',die=[pickDie[0],pickDie[1]-.0003,pickDie[2]],lid=[pickLid[0],pickLid[1]-.004,pickLid[2]];
  if(p<.08){head=[pickDie[0],mix(safe,pickDie[1],phase(p,0,.08)),pickDie[2]];stage='die-approach';}
  else if(p<.18){head=[pickDie[0],mix(pickDie[1],safe,phase(p,.08,.18)),pickDie[2]];stage='die-lift';}
  else if(p<.31){head=V([pickDie[0],safe,pickDie[2]],[placeDie[0],safe,placeDie[2]],phase(p,.18,.31));stage='die-transfer';}
  else if(p<.42){head=[placeDie[0],mix(safe,placeDie[1],phase(p,.31,.42)),placeDie[2]];stage='die-place';}
  else if(p<.50){head=[placeDie[0],mix(placeDie[1],safe,phase(p,.42,.50)),placeDie[2]];stage='die-release';}
  else if(p<.60){head=V([placeDie[0],safe,placeDie[2]],[pickLid[0],safe,pickLid[2]],phase(p,.50,.60));stage='lid-approach';}
  else if(p<.68){head=[pickLid[0],mix(safe,pickLid[1],phase(p,.60,.68)),pickLid[2]];stage='lid-contact';}
  else if(p<.75){head=[pickLid[0],mix(pickLid[1],safe,phase(p,.68,.75)),pickLid[2]];stage='lid-lift';}
  else if(p<.83){head=V([pickLid[0],safe,pickLid[2]],[placeLid[0],safe,placeLid[2]],phase(p,.75,.83));stage='lid-transfer';}
  else if(p<.93){head=[placeLid[0],mix(safe,placeLid[1],phase(p,.83,.93)),placeLid[2]];stage='lid-place';}
  else{head=[placeLid[0],mix(placeLid[1],safe,phase(p,.93,1)),placeLid[2]];stage='lid-release';}
  if(p>=.08&&p<.42){die=[head[0],head[1]-.0003,head[2]];dieSupport='vacuum-collet';}
  else if(p>=.42){die=[placeDie[0],placeDie[1]-.0003,placeDie[2]];dieSupport='package-substrate';}
  if(p>=.68&&p<.93){lid=[head[0],head[1]-.004,head[2]];lidSupport='vacuum-collet';}
  else if(p>=.93){lid=[placeLid[0],placeLid[1]-.004,placeLid[2]];lidSupport='package-substrate';}
  return {p,head,die,lid,dieSupport,lidSupport,stage,safeTransferHeight:safe,representation:'Selected assembly operations; interconnect, adhesive and cure details omitted'};
}

export function createFabProcess(T){
  const K=createFabHardware(T),{M,box,cylinder,between,panelLabel}=K;
  const root=new T.Group();root.name='r8-original-process-studies';
  const efem=new T.Group(),process=new T.Group(),pack=new T.Group(),chamber=new T.Group(),layers=new T.Group();
  root.add(efem,process,pack);process.add(chamber,layers);
  const ceramic=new T.MeshStandardMaterial({color:'#e3ddca',roughness:.68,metalness:0});
  const graphite=new T.MeshStandardMaterial({color:'#263036',roughness:.46,metalness:.48});
  const titanium=new T.MeshStandardMaterial({color:'#8e9ca7',roughness:.32,metalness:.76,map:K.tex('steel')});
  const copper=new T.MeshStandardMaterial({color:'#b3885a',roughness:.42,metalness:.65});
  const violet=new T.MeshStandardMaterial({color:'#63577f',roughness:.25,metalness:.32});
  const resist=new T.MeshStandardMaterial({color:'#bb804b',roughness:.33,metalness:.02});
  const activated=new T.MeshStandardMaterial({color:'#d8a66f',roughness:.48,metalness:.01});
  const pcb=new T.MeshStandardMaterial({color:'#264b3c',roughness:.57,metalness:.12});
  const optical=new T.MeshStandardMaterial({color:'#718b9f',roughness:.23,metalness:.56});
  const add=(g,...m)=>{g.add(...m);return m[0];};
  const label=(g,text,pos,w=.4,h=.045)=>{const l=panelLabel(text,w,h,{bg:'#263332',fg:'#dce6db'});l.position.set(...pos);g.add(l);return l;};
  const bolt=(g,x,y,z,r=.005)=>g.add(cylinder(r,.004,M.steel,x,y,z,6));
  const tube=(g,points,r=.012,mat=M.steel)=>{const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(c,20,r,7,false),mat);m.castShadow=true;g.add(m);return m;};
  const ring=(g,r,y,z=0,x=0,minor=.009,mat=M.steel)=>{const m=new T.Mesh(new T.TorusGeometry(r,minor,8,48),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);g.add(m);return m;};

  // A real opening replaces the illustrative solid fascia on the distant hall prop.
  const lp=K.loadport({detail:true,id:'EFEM / 01',withFoup:false});efem.add(lp.root);
  const cutawayHousing=[];
  // Rebuild the complete fascia; never infer its identity from a mutable height.
  // Retain only articulated/table assemblies. Any hardware envelope revision
  // therefore cannot reintroduce a solid wall across this aperture.
  for(const m of [...lp.root.children])if(m!==lp.door&&m!==lp.table)lp.root.remove(m);
  add(lp.root,box(.472,.925,.028,M.white,0,.4625,-.21,.004));
  cutawayHousing.push(add(lp.root,box(.472,.144,.028,M.white,0,1.314,-.21,.004)));
  for(const x of[-.221,.221])cutawayHousing.push(add(lp.root,box(.030,.317,.028,M.steel,x,1.0835,-.21,.004)));
  lp.door.position.z=-.1855;lp.door.position.y=1.062;
  label(lp.root,'EFEM / 01',[0,.653,-.194],.18,.05);
  for(const x of[-.196,.196])for(const y of[.14,.72,1.35]){const fastener=cylinder(.0035,.004,M.steel,x,y,-.193,6);fastener.rotation.x=Math.PI/2;lp.root.add(fastener);if(y>1.3)cutawayHousing.push(fastener);}
  const pod=K.foup({detail:true,id:'LOT 017'});pod.root.rotation.y=Math.PI;pod.root.position.y=.9;efem.add(pod.root);
  const podDoor=new T.Group();podDoor.name='detachable-FOUP-door';pod.root.add(podDoor);
  for(const child of [...pod.root.children])if(child!==podDoor&&child.position.z>.154){pod.root.remove(child);podDoor.add(child);}
  const waferStack=pod.root.getObjectByName('25-wafer-slots');waferStack.children[12].visible=false;
  // These are view-only omissions for a declared instructional cutaway. The
  // carrier base, the selected slot rails, moving wafer, blade and every actor's
  // transform/support state remain unchanged. External shots retain the housing.
  const podHousing=pod.root.children.filter(o=>o.isMesh&&(o.material===M.blue||o.material===M.amber||o.position.y>.30));
  const podSlotRails=pod.root.children.filter(o=>o.isMesh&&o.userData.kind==='wafer-slot-support');
  const pickedWafer=cylinder(.15,.0008,optical,0,WAFER_Y,.007,64);pickedWafer.name='wafer-300mm-transfer';efem.add(pickedWafer);
  // Open-sided cutaway enclosure. No invisible wall is crossed by the wafer.
  add(efem,box(1.36,.09,1.20,graphite,0,.65,-.80,.015));
  cutawayHousing.push(add(efem,box(1.36,.14,1.20,M.panel,0,1.72,-.80,.015)));
  for(const x of[-.65,.65])for(const z of[-.24,-1.35])add(efem,box(.044,1.0,.045,M.rail,x,1.18,z,.005));
  cutawayHousing.push(add(efem,box(1.25,.035,1.10,M.ffu,0,1.632,-.80)));
  add(efem,box(1.23,.55,.045,graphite,0,.965,-1.365,.008));
  for(let i=0;i<9;i++)add(efem,box(.40,.009,.005,M.gasket,-.34,.80+i*.032,-1.335));
  for(const x of[-.18,.18]){add(efem,box(.018,.65,.018,M.rail,x,.90,-.30));bolt(efem,x,1.24,-.30);}
  const doorCarriage=add(efem,box(.39,.025,.11,M.steel,0,.83,-.30));
  const doorMotor=add(efem,cylinder(.043,.11,graphite,.26,.79,-.31));doorMotor.rotation.x=Math.PI/2;
  add(efem,box(.025,.65,.025,graphite,.27,1.0,-.31));
  cutawayHousing.push(label(efem,'EFEM / MECHANISM RECONSTRUCTION',[0,1.734,-.187],.79,.054));
  const base=cylinder(.095,.22,graphite,BASE[0],.81,BASE[1],40);efem.add(base,cylinder(.040,.11,M.steel,BASE[0],.975,BASE[1],32));
  ring(efem,.084,.925,BASE[1],BASE[0],.008);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;bolt(efem,BASE[0]+.077*Math.cos(a),.928,BASE[1]+.077*Math.sin(a),.003);}
  const robot=new T.Group();efem.add(robot);
  const shoulder=cylinder(.071,.053,M.steel),elbowJoint=cylinder(.063,.051,M.steel),wristJoint=cylinder(.041,.047,M.steel);
  const upper=box(L1,.036,.082,titanium,0,0,0,.012),fore=box(L2,.032,.062,M.white,0,0,0,.010);robot.add(upper,fore,shoulder,elbowJoint,wristJoint);
  const blade=new T.Group();robot.add(blade);
  add(blade,box(.155,.0022,.047,titanium,0,-.0011,.028,.003),box(.135,.0022,.030,titanium,0,-.0011,.140,.003));
  for(const x of[-.057,.057])add(blade,box(.020,.0022,.280,titanium,x,-.0011,.184,.003));
  for(const [x,z] of[[-.057,.256],[.057,.256],[0,.140]])add(blade,cylinder(.007,.0012,ceramic,x,.0006,z,16));
  const cable=tube(efem,[[.42,.79,-.95],[.50,.76,-1.10],[.54,.83,-1.20],[.55,1.20,-1.28]],.012,M.gasket);
  label(efem,'300 mm / SUPPORT BEFORE RETRACT',[-.35,.695,-.18],.66,.045);

  // Generic vacuum-processing principle. No invented scanner/lens internals.
  add(chamber,box(1.1,.18,.9,graphite,0,.60,0,.025),cylinder(.37,.035,M.steel,0,.720,0,64));
  const shell=new T.Mesh(new T.CylinderGeometry(.37,.37,.54,64,1,true,Math.PI/2,Math.PI),titanium);shell.material= titanium.clone();shell.material.side=T.DoubleSide;shell.position.y=1.0;chamber.add(shell);
  ring(chamber,.37,1.27,0,0,.018);ring(chamber,.37,.733,0,0,.018);
  const chamberUpper=new T.Group();chamber.add(chamberUpper);
  const shower=cylinder(.282,.035,M.steel,0,1.19,0,64);chamberUpper.add(shower);
  for(let row=-4;row<=4;row++)for(let col=-4;col<=4;col++)if(row*row+col*col<19)add(chamberUpper,cylinder(.0032,.002,graphite,col*.052,1.1726,row*.052,8));
  tube(chamberUpper,[[0,1.209,0],[0,1.37,0],[.39,1.37,0],[.50,1.18,0]],.018);
  add(chamber,box(.075,.135,.090,graphite,.50,1.1125,0,.009));
  tube(chamber,[[.50,1.045,0],[.50,.82,0],[.50,.69,.14]],.012);
  add(chamber,cylinder(.082,.17,M.steel,0,.822,0,40),cylinder(.158,.026,ceramic,0,.920,0,64));
  const processWafer=cylinder(.15,.0008,optical,0,.9334,0,64);chamber.add(processWafer);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;bolt(chamber,.325*Math.cos(a),.744,.325*Math.sin(a),.006);}
  tube(chamber,[[.28,.80,-.15],[.46,.80,-.15],[.53,.68,-.15],[.71,.68,-.15]],.044);
  add(chamber,box(.27,.31,.29,M.panel,.78,.67,-.15,.024),cylinder(.095,.29,graphite,.78,.67,-.15,24));
  for(const x of[-.178,.178])add(chamber,box(.028,.14,.10,M.steel,x,.947,.364,.004));
  add(chamber,box(.38,.035,.10,M.steel,0,.892,.364,.004),box(.38,.035,.10,M.steel,0,1.013,.364,.004));
  const gate=add(chamber,box(.326,.088,.012,graphite,0,1.078,.357,.003));
  const plasmaMat=new T.MeshStandardMaterial({color:'#9a83b3',emissive:'#726089',emissiveIntensity:.25,transparent:true,opacity:.20,depthWrite:false});
  const plasma=cylinder(.265,.018,plasmaMat,0,1.022,0,48);chamber.add(plasma);
  label(chamber,'VACUUM PROCESS / PRINCIPLE STUDY',[0,.595,.464],.82,.060);

  // Microscopic cropped section, deliberately enlarged in thickness as well as area.
  add(layers,box(.92,.060,.62,optical,0,.75,0,.006));
  const films=[],resists=[],exposed=[];
  for(let i=0;i<11;i++){
    const gap=i%2===1,x=-.418+i*.0836;
    const film=box(.0836,.025,.62,gap?copper:M.steel,x,.7925,0),coat=box(.0836,.023,.62,gap?activated:resist,x,.8165,0);
    layers.add(film,coat);films.push(film);resists.push(coat);exposed.push(gap);
  }
  for(let i=0;i<12;i++)add(layers,box(.002,.004,.002,M.steel,-.46+i*.0836,.718,.32));
  label(layers,'SELECTED STEPS / LAYERS EXAGGERATED',[0,.66,.324],.91,.055);

  // Packaging machine: a supported pickup/placement sequence, not free-floating parts.
  add(pack,box(.32,.040,.25,graphite,0,.743,-.025,.012),box(.30,.010,.23,M.steel,0,.768,-.025,.004));
  add(pack,box(.101,.025,.094,M.panel,-.064,.7875,.012,.003),box(.082,.025,.082,M.panel,.044,.7875,0,.003),box(.065,.025,.062,M.panel,.044,.7875,-.073,.003));
  const tray=add(pack,box(.094,.0013,.085,graphite,-.064,.80005,.012,.002));
  add(pack,box(.058,.001,.055,graphite,.044,.8005,-.073,.001));
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)if(row!==1||col!==1)add(pack,box(.017,.0006,.017,optical,-.062+(col-1)*.027,.801,.012+(row-1)*.025,.0003));
  const die=add(pack,box(.017,.0006,.017,optical,-.062,.801,.012,.0003));die.name='supported-package-die';
  const substrate=add(pack,box(.048,.0012,.048,pcb,.044,.8006,0,.0004));
  for(let i=0;i<12;i++)for(const side of[-1,1])add(pack,box(.0011,.00018,.0035,copper,.044-.0198+i*.0036,.80129,side*.019,.0001));
  for(let i=0;i<10;i++)for(const side of[-1,1])add(pack,box(.0034,.00018,.0006,copper,.044+side*.019,.80128,-.016+i*.0035,.0001));
  for(const x of[-.10,.10]){add(pack,box(.012,.145,.014,M.rail,x,.847,-.10,.001));bolt(pack,x,.922,-.10,.003);}
  add(pack,box(.225,.018,.018,M.rail,0,.920,-.10,.002));
  const xCarriage=new T.Group();pack.add(xCarriage);
  add(xCarriage,box(.032,.028,.034,graphite,0,.915,-.10,.003),box(.012,.012,.220,M.steel,0,.902,-.025,.001));
  const zCarriage=new T.Group();pack.add(zCarriage);add(zCarriage,box(.026,.020,.030,graphite,0,.902,0,.003));
  const head=new T.Group();pack.add(head);add(head,cylinder(.0042,.005,ceramic,0,.0025,0,20),cylinder(.006,.028,M.steel,0,.019,0,24));
  const spindle=add(pack,cylinder(.0032,.07,M.steel,0,.87,0,16));
  const lid=new T.Group();pack.add(lid);lid.name='hollow-package-lid';
  add(lid,box(.043,.0015,.043,M.steel,0,.00325,0,.001));
  for(const x of[-.020,.020])add(lid,box(.003,.0025,.043,M.steel,x,.00125,0,.0003));
  for(const z of[-.020,.020])add(lid,box(.037,.0025,.003,M.steel,0,.00125,z,.0003));
  for(const x of[-.137,.137])for(const z of[-.125,.075])bolt(pack,x,.776,z,.003);
  label(pack,'PACKAGE ASSEMBLY / SELECTED OPERATIONS',[0,.743,.104],.275,.016);

  const cameras={
    port:{act:'efem',position:[1.55,1.43,1.65],target:[0,1.04,-.45],fov:44,slide:[-.10,0,0]},
    interlock:{act:'efem',position:[.72,1.26,-.68],target:[.035,1.028,-.20],fov:38,slide:[0,.018,-.018]},
    blade:{act:'efem',position:[-.82,1.49,-1.05],target:[.06,1.043,-.31],fov:44,slide:[.035,0,.020]},
    wafer:{act:'efem',position:[-.40,1.36,-.40],target:[0,1.062,.0],fov:39,slide:[.012,-.012,0]},
    robot:{act:'efem',position:[1.15,2.20,-1.57],target:[.12,1.02,-.61],fov:45,slide:[-.035,0,.025]},
    chamber:{act:'process',position:[1.0,1.41,1.53],target:[.06,.98,0],fov:39,slide:[-.045,0,0]},
    gate:{act:'process',position:[.48,.96,.92],target:[0,.956,.23],fov:33,slide:[0,.025,0]},
    chuck:{act:'process',position:[.12,1.56,.43],target:[0,.933,0],fov:35,slide:[.025,0,0]},
    layers:{act:'process',position:[.85,1.27,1.00],target:[0,.79,0],fov:39,slide:[-.07,0,0]},
    pattern:{act:'process',position:[-1.0,1.13,1.12],target:[0,.778,0],fov:43,slide:[.035,-.012,0]},
    etch:{act:'process',position:[.70,.97,.91],target:[0,.80,0],fov:36,slide:[-.04,.015,0]},
    tray:{act:'package',position:[-.23,1.015,.24],target:[-.016,.818,-.026],fov:38,slide:[.01,0,0]},
    die:{act:'package',position:[-.115,.861,.112],target:[-.047,.808,.012],fov:35,slide:[.006,0,0]},
    substrate:{act:'package',position:[.13,.878,.088],target:[.044,.807,0],fov:32,slide:[-.005,0,0]},
    lid:{act:'package',position:[.16,.828,-.002],target:[.044,.804,0],fov:32,slide:[0,.003,0]},
    outgoing:{act:'package',position:[.046,.967,.015],target:[.044,.804,0],fov:33,slide:[.003,0,0]}
  };
  const diagnostics={basis:'Evidence-grounded explanatory reconstruction, not OEM CAD or a calibrated process simulation',units:'metres',
    anchors:{waferDiameter:.300,loadportDatum:.900,dockingStroke:.070},derived:{robotLinks:[L1,L2],robotBase:BASE,packageBody:.048},
    supportedSequence:['dock','door-withdraw','door-lower','blade-insert','contact','lift','retract'],
    unknowns:['manufacturer robot internals','exact timing','process chemistry and dimensions','specific package/interconnect design'],
    microscopicScale:'Both thickness and area exaggerated; no transistor dimensions claimed',renderOnly:true};
  root.traverse(o=>{if(o.isMesh){o.userData.evidence=o.userData.evidence||'derived/editorial';o.castShadow=true;o.receiveShadow=true;}});
  let lastState={};
  function setLink(m,a,b,y){m.position.set((a[0]+b[0])/2,y,(a[1]+b[1])/2);m.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);}
  function frame({act='efem',p=0,view='port',u=.5,t=0}={}){
    p=C(p);u=C(u);efem.visible=act==='efem';process.visible=act==='process';pack.visible=act==='package';
    const pose=cameras[view]||cameras[act==='process'?'chamber':act==='package'?'tray':'port'];
    const cutaway=act==='efem'&&['blade','wafer','robot'].includes(view);
    for(const part of cutawayHousing)part.visible=!cutaway;
    for(const part of podHousing)part.visible=!cutaway;
    waferStack.visible=!cutaway;
    for(const rail of podSlotRails)rail.visible=!cutaway||rail.userData.slot===12;
    if(act==='efem'){
      const s=efemState(p);lastState=s;pod.root.position.z=s.podZ;lp.table.position.z=s.podZ;
      podDoor.position.set(0,-s.doorDrop,s.doorRetreat);lp.door.position.set(0,1.062-s.doorDrop,-.1855-s.doorRetreat);
      doorCarriage.position.y=.83-s.doorDrop;const armY=s.padY-.047;
      setLink(upper,BASE,s.elbow,armY);setLink(fore,s.elbow,s.wrist,armY+.005);
      shoulder.position.set(BASE[0],armY,BASE[1]);elbowJoint.position.set(s.elbow[0],armY+.003,s.elbow[1]);wristJoint.position.set(s.wrist[0],armY+.0201,s.wrist[1]);
      blade.position.set(s.wrist[0],s.padY-.0012,s.wrist[1]);pickedWafer.position.set(...s.wafer);
    }else if(act==='process'){
      const micro=['layers','pattern','etch'].includes(view);layers.visible=micro;chamber.visible=!micro;chamberUpper.visible=view!=='chuck';
      const deposit=phase(p,0,.18),coat=phase(p,.18,.34),develop=phase(p,.54,.70),etch=phase(p,.72,.88),strip=phase(p,.90,1);
      films.forEach((m,i)=>{const h=.025*deposit*(exposed[i]?1-etch:1);m.scale.y=Math.max(.0001,h/.025);m.position.y=.780+h/2;});
      resists.forEach((m,i)=>{const h=.023*coat*(exposed[i]?1-develop:1-strip);m.scale.y=Math.max(.0001,h/.023);m.position.y=.805+h/2;m.visible=h>.00001;m.material=exposed[i]&&p>.36?activated:resist;});
      gate.position.y=1.078-.122*phase(p,.08,.20);plasma.visible=p>=.30&&p<=.72;plasma.material.opacity=.12+.10*Math.sin(Math.PI*phase(p,.30,.72));
      lastState={p,stage:micro?(p<.18?'deposition':p<.34?'photoresist':p<.54?'pattern-transfer':p<.70?'development':p<.90?'etch':'resist-strip'):(p<.20?'gate-closing':p<.30?'sealed':p<.72?'illustrative-plasma-process':'process-complete'),
        gateClosed:p>=.20,waferSupport:'chuck',waferDiameter:.300,processParameters:'not specified',layerExaggeration:true,completeChip:false};
    }else{
      const s=packageState(p);lastState=s;head.position.set(...s.head);die.position.set(...s.die);lid.position.set(...s.lid);
      xCarriage.position.x=s.head[0];zCarriage.position.set(s.head[0],0,s.head[2]);spindle.position.set(s.head[0],(s.head[1]+.033+.902)/2,s.head[2]);spindle.scale.y=(.902-s.head[1]-.033)/.07;
    }
    const position=pose.position.map((n,i)=>n+(pose.slide?.[i]||0)*(u-.5)),target=[...pose.target];
    const amber=act==='process',look={background:amber?'#24282c':act==='package'?'#c5c9c6':'#bdc9c6',key:amber?'#e9d6b9':'#edf2e9',fill:amber?'#aebfc6':'#bcccd1',exposure:amber?1.12:1.0,
      lightPosition:act==='package'?[.3,1.3,.5]:[1.8,3.5,2.8],lightTarget:act==='package'?[0,.80,0]:[0,1,-.3],shadowBounds:act==='package'?.3:1.6,fogNear:50,fogFar:100};
    return {position,target,fov:pose.fov,look,detail:{label:cutaway?'Cutaway · selected wafer only':act==='process'&&layers.visible?'Selected steps · exaggerated microscopic section':'Illustrative mechanism reconstruction · not a named factory',cutaway:cutaway?{active:true,label:'CUTAWAY · ONE WAFER SHOWN',omitted:'Enclosure, ceiling and other wafers omitted for visibility; selected wafer supports and mechanism retained'}:null,mechanism:lastState.stage,unit:'metres'},state:lastState};
  }
  frame();return {root,frame,cameras,diagnostics,get state(){return lastState;}};
}
