/**
 * S1E01 R8 — original, metric editorial geometry. Not manufacturer CAD.
 * Dimensional anchors: Entegris A300 25-slot FOUP (.426×.355×.338 m,
 * 10 mm pitch); TDK TAS300 Type J1 loadport (.472×1.386×.493 m,
 * 900 mm docking datum, 70 mm stroke). All other dimensions are derived.
 * Coordinates are metres, Y up. A tool's operator/front side is local +Z.
 */
export const FAB_DIMENSIONS = Object.freeze({
  foup:{width:.426,depth:.355,height:.338,waferDiameter:.300,slots:25,pitch:.010},
  loadport:{width:.472,height:1.386,depth:.493,datum:.900,stroke:.070},
  evidenceBasis:'Published envelope dimensions; original derived exterior detail and motion illustration',
  sources:[
    'https://www.entegris.com/shop/en/USD/products/wafer-handling/wafer-processing/300-mm-front-opening-unified-pods-%28foups%29/A300-FOUPs/p/A300FOUPs',
    'https://product.tdk.com/en/system/files/dam/doc/product/fa/fa/foup/catalog/fa_foup_tas300-j1_en.pdf'
  ]
});

const clamp=v=>Math.max(0,Math.min(1,v));
export const smooth5=v=>{const a=clamp(v);return a*a*a*(a*(a*6-15)+10);};
export const phase=(p,a,b)=>smooth5((p-a)/(b-a));

export function createFabHardware(T){
  const geometries=new Map(),textures=new Map(),materials=new Map();
  const seeded=n=>()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  function tex(kind){
    if(textures.has(kind))return textures.get(kind);
    const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d'),r=seeded(180318);
    if(kind==='floor'){
      x.fillStyle='#d8ddda';x.fillRect(0,0,512,512);x.strokeStyle='#b6bfbb';x.lineWidth=2;x.strokeRect(1.5,1.5,509,509);
      for(let y=14;y<512;y+=16)for(let a=14;a<512;a+=16){x.fillStyle='#bcc6c1';x.beginPath();x.arc(a,y,1.7,0,Math.PI*2);x.fill();}
      for(const a of[12,500])for(const y of[12,500]){x.fillStyle='#65716d';x.beginPath();x.arc(a,y,3,0,Math.PI*2);x.fill();}
    }else if(kind==='ffu'){
      x.fillStyle='#e3e6e2';x.fillRect(0,0,512,512);x.fillStyle='#cbd1cd';
      for(let y=8;y<512;y+=7)x.fillRect(7,y,498,1);
      x.strokeStyle='#b0bbb4';x.lineWidth=5;x.strokeRect(3.5,3.5,505,505);
    }else if(kind==='steel'){
      x.fillStyle='#acb9b9';x.fillRect(0,0,512,512);
      for(let i=0;i<1500;i++){x.fillStyle=`rgba(${r()>.5?'255,255,255':'46,62,62'},${.015+r()*.06})`;x.fillRect(0,r()*512,512,.2+r()*.5);}
    }else if(kind==='gown'){
      x.fillStyle='#e4e8df';x.fillRect(0,0,512,512);x.strokeStyle='rgba(111,128,121,.12)';x.lineWidth=.5;
      for(let i=0;i<512;i+=6){x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke();}
    }
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;textures.set(kind,map);return map;
  }
  const mat=(id,color,roughness=.55,metalness=0,extra={})=>{
    if(!materials.has(id))materials.set(id,new T.MeshStandardMaterial({name:id,color,roughness,metalness,...extra}));return materials.get(id);
  };
  const M={
    white:mat('cleanroom-enamel','#ecece7',.40,.08),ceramic:mat('porcelain','#f0efe7',.66,0),
    panel:mat('service-panel','#d3d8d6',.53,.1),dark:mat('graphite-polymer','#303c3f',.68,.05),
    steel:mat('brushed-stainless','#b5c3c0',.30,.78,{map:tex('steel')}),rail:mat('anodised-rail','#a9b7b3',.37,.62),
    gasket:mat('gasket','#354442',.86,0),blue:mat('foup-blue','#718e9e',.25,.03,{transparent:true,opacity:.80,depthWrite:false}),
    amber:mat('foup-amber','#b9863c',.29,.04,{transparent:true,opacity:.88,depthWrite:false}),
    edge:mat('foup-base','#42575d',.46,.1),wafer:mat('silicon-wafer','#657e8d',.20,.65),
    light:mat('diffuser','#f5f3e9',.6,0,{emissive:'#e6e5da',emissiveIntensity:.6}),
    green:mat('status-green','#3f8c70',.35,0,{emissive:'#24664b',emissiveIntensity:.3}),
    yellow:mat('status-amber','#e7bd62',.35,0,{emissive:'#7f652b',emissiveIntensity:.18}),
    red:mat('stop-control','#a94c40',.48,0),floor:mat('perforated-tiles','#f4f5ee',.66,.08,{map:tex('floor')}),
    ffu:mat('filter-face','#f2f4ed',.68,.05,{map:tex('ffu')}),
    cloth:mat('cleanroom-gown','#edf0e8',.91,0,{map:tex('gown')}),visor:mat('visor','#899d9d',.16,.18)
  };
  const geom=(id,make)=>{if(!geometries.has(id))geometries.set(id,make());return geometries.get(id);};
  function box(w,h,d,m,x=0,y=0,z=0,chamfer=0){
    const id=['b',w,h,d,chamfer].join('/');const g=geom(id,()=>{
      if(chamfer<=0)return new T.BoxGeometry(w,h,d);
      const g=new T.BoxGeometry(w,h,d,2,2,2),p=g.attributes.position,r=Math.min(chamfer,w*.15,h*.15,d*.15);
      for(let i=0;i<p.count;i++){
        const v=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)),q=new T.Vector3(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z)));
        v.sub(q).normalize().multiplyScalar(r).add(q);p.setXYZ(i,v.x,v.y,v.z);
      }g.computeVertexNormals();return g;
    });
    const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;return a;
  }
  function cylinder(radius,height,m,x=0,y=0,z=0,sides=12){const a=new T.Mesh(geom(['c',radius,height,sides].join('/'),()=>new T.CylinderGeometry(radius,radius,height,sides)),m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;return a;}
  function sphere(radius,m,scale=[1,1,1],pos=[0,0,0]){const a=new T.Mesh(geom('s'+radius,()=>new T.SphereGeometry(radius,12,8)),m);a.scale.set(...scale);a.position.set(...pos);a.castShadow=true;a.receiveShadow=true;return a;}
  function between(a,b,r,m,sides=8){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),d=bb.clone().sub(aa),mesh=cylinder(r,d.length(),m,0,0,0,sides);mesh.position.copy(aa).add(bb).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return mesh;}
  // Submillimetre edge bevels do not survive a wide shot. Keep the silhouette,
  // but reserve bevel subdivisions and wafer interiors for the inspected hero.
  function simplifyDistant(group){
    group.traverse(o=>{const p=o.geometry?.parameters;if(!o.isMesh||o.geometry.type!=='BoxGeometry'||!(p.widthSegments>1))return;
      const id=['b',p.width,p.height,p.depth,0].join('/');o.geometry=geom(id,()=>new T.BoxGeometry(p.width,p.height,p.depth));
    });
  }
  function panelLabel(text,w=.22,h=.08,{bg='#e0e5dd',fg='#34443d'}={}){
    const key='label:'+text+':'+bg+':'+fg;let material=materials.get(key);
    if(!material){const c=document.createElement('canvas');c.width=512;c.height=Math.max(64,Math.round(512*h/w));const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle=fg;x.font=`500 ${Math.round(c.height*.43)}px Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,c.height*.53,475);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;material=new T.MeshBasicMaterial({map});materials.set(key,material);}
    return new T.Mesh(geom('plane:'+w+':'+h,()=>new T.PlaneGeometry(w,h)),material);
  }
  function display(code='RUN'){
    const g=new T.Group();g.add(box(.32,.25,.045,M.dark,0,0,0,.018));
    const key='instrument-screen:'+code;let screenMaterial=materials.get(key);
    if(!screenMaterial){
    const c=document.createElement('canvas');c.width=512;c.height=384;const x=c.getContext('2d');x.fillStyle='#18302f';x.fillRect(0,0,512,384);x.fillStyle='#c4d2c2';x.font='25px Arial';x.fillText('CHAMBER  /  '+code,25,42);x.fillStyle='#43635e';x.fillRect(25,65,460,2);
    for(let i=0;i<4;i++){x.fillStyle='#64867d';x.fillRect(26,92+i*57,122,9);x.fillStyle=i===0?'#89ae8c':'#496b63';x.fillRect(182,89+i*57,210-20*i,17);}
    x.strokeStyle='#91b599';x.lineWidth=3;x.beginPath();x.moveTo(25,346);for(let i=0;i<32;i++)x.lineTo(25+i*14,342-50*(1-Math.exp(-i*.2))-(i%4===0?4:0));x.stroke();
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;screenMaterial=new T.MeshBasicMaterial({map});materials.set(key,screenMaterial);
    }
    const screen=new T.Mesh(geom('screenplane',()=>new T.PlaneGeometry(.285,.211)),screenMaterial);screen.position.z=.024;g.add(screen);return g;
  }
  function contactShadow(w,d,x=0,z=0){
    let shadowMaterial=materials.get('equipment-contact-shadow');
    if(!shadowMaterial){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gradient=x.createRadialGradient(64,64,10,64,64,64);gradient.addColorStop(0,'rgba(32,38,39,.55)');gradient.addColorStop(.55,'rgba(32,38,39,.38)');gradient.addColorStop(1,'rgba(32,38,39,0)');x.fillStyle=gradient;x.fillRect(0,0,128,128);const map=new T.CanvasTexture(c);shadowMaterial=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});materials.set('equipment-contact-shadow',shadowMaterial);}
    const shadow=new T.Mesh(geom('contact:'+w+':'+d,()=>new T.PlaneGeometry(w,d)),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.006,z);shadow.castShadow=false;shadow.renderOrder=1;return shadow;
  }
  function fasteners(group,w,h,z=.011){for(const x of[-w/2+.022,w/2-.022])for(const y of[-h/2+.025,h/2-.025]){const b=cylinder(.004,.003,M.steel,x,y,z,6);b.rotation.x=Math.PI/2;group.add(b);}}
  function foup({colour='blue',detail=true,id='A17'}={}){
    const g=new T.Group();g.name='FOUP-'+id;const plastic=colour==='amber'?M.amber:M.blue;
    g.add(box(.426,.025,.355,M.edge,0,.0125,0,.006));
    // Enclosure is open on +Z before the detachable front door; side mouldings carry ribs.
    g.add(box(.018,.268,.302,plastic,-.185,.160,-.009,.009),box(.018,.268,.302,plastic,.185,.160,-.009,.009),box(.366,.268,.020,plastic,0,.160,-.150,.008),box(.380,.020,.315,plastic,0,.295,-.004,.009));
    for(const sign of[-1,1])for(let i=0;i<7;i++)g.add(box(.016,.223,.012,plastic,sign*.202,.163,-.135+i*.045,.003));
    const door=box(.375,.273,.027,M.edge,0,.162,.164,.012);g.add(door);
    const doorPanel=box(.336,.233,.006,plastic,0,.162,.172,.014);g.add(doorPanel);
    for(const sign of[-1,1]){const latch=cylinder(.016,.008,M.steel,sign*.105,.16,.1735,12);latch.rotation.x=Math.PI/2;g.add(latch);g.add(box(.021,.079,.010,M.gasket,sign*.157,.162,.1725,.004));}
    // Standard-style top handling flange: no invented bayonet/handle on the door.
    const handlingFlange=box(.146,.017,.146,M.edge,0,.3295,0,.004);handlingFlange.name='handling-flange';
    g.add(box(.075,.016,.068,M.edge,0,.313,0,.003),handlingFlange);
    if(detail){
      const wafers=new T.Group();wafers.name='25-wafer-slots';
      for(let i=0;i<25;i++)wafers.add(cylinder(.150,.0008,M.wafer,0,.041+i*.01,-.007,32));g.add(wafers);
      // Derived shelves overlap the wafer from |x|=.137 m and embed to .179 m
      // in the moulded sidewall (nominal inner face .176 m, rounded edges).
      // Their tops meet the wafer undersides at every 10 mm slot pitch.
      for(const sx of[-1,1])for(let i=0;i<25;i++){
        const shelf=box(.042,.003,.215,M.ceramic,sx*.158,.0391+i*.01,-.015);
        shelf.name='wafer-slot-support-'+sx+'-'+i;shelf.userData={kind:'wafer-slot-support',slot:i,side:sx};g.add(shelf);
      }
      const label=panelLabel(id,.105,.044);label.position.set(0,.084,.1775);g.add(label);
      for(const [x,z] of [[-.13,.1],[.13,.1],[0,-.12]]){const a=cylinder(.014,.006,M.steel,x,.003,z,12);g.add(a);}
    }
    if(!detail)simplifyDistant(g);
    g.userData={kind:'FOUP',evidence:'published-envelope/derived-detail',dimension:FAB_DIMENSIONS.foup};
    return {root:g,door,doorPanel};
  }
  function loadport({detail=true,id='LP02',withFoup=false}={}){
    const root=new T.Group();root.name='loadport-'+id;
    root.add(box(.472,1.386,.105,M.white,0,.693,-.314,.006),box(.472,.060,.105,M.dark,0,.030,-.314,.006));
    root.add(box(.422,.626,.014,M.panel,0,.407,-.254),box(.422,.392,.010,M.steel,0,1.162,-.254,.007));
    // At full docking, the FOUP front door plane is z=-.1775-.070=-.2475.
    // Nothing protrudes in front of that FIMS plane into the moving container.
    const aperture=box(.377,.285,.010,M.gasket,0,1.062,-.2555,.011);root.add(aperture);
    const door=box(.351,.258,.016,M.panel,0,1.062,-.2555,.008);root.add(door);
    const table=new T.Group();root.add(table);table.add(box(.456,.026,.493,M.steel,0,.880,-.001,.004),box(.402,.11,.300,M.white,0,.814,-.100,.008));
    // Three kinematic datum pins support a carrier; FOUP bottom at y=.900.
    for(const [x,z] of [[-.13,.1],[.13,.1],[0,-.12]])table.add(cylinder(.012,.007,M.steel,x,.8965,z,8));
    table.add(box(.043,.028,.025,M.dark,0,.914,.211));
    for(const side of[-1,1])root.add(box(.010,.055,.032,M.dark,side*.228,.940,.125,.003));
    if(detail){
      const badge=panelLabel(id,.18,.05);badge.position.set(0,.653,-.2465);root.add(badge);
      for(let i=0;i<8;i++)root.add(box(.240,.003,.003,M.gasket,0,.215+i*.012,-.2455));
      const button=cylinder(.015,.013,M.red,.17,.70,-.244,12);button.rotation.x=Math.PI/2;root.add(button);
      for(const x of[-.196,.196])for(const y of[.13,.65,1.35]){const b=cylinder(.0035,.004,M.steel,x,y,-.2455,6);b.rotation.x=Math.PI/2;root.add(b);}
    }
    if(withFoup){const pod=foup({detail:false,id:id.replace('LP','L')}).root;pod.rotation.y=Math.PI;pod.position.y=.9;root.add(pod);}
    if(!detail)simplifyDistant(root);
    root.userData={kind:'loadport',dimension:FAB_DIMENSIONS.loadport,fimsPlane:-.2475,depthDefinition:'493 mm docking-plate reach from BOLTS reference; not full assembly AABB',evidence:'TDK-envelope/derived-detail'};
    return {root,table,door};
  }
  function oht({pod=false,colour='blue',detail=true,id='T17'}={}){
    const root=new T.Group();root.name='OHT-'+id;
    // origin lies on the suspension/rail datum, not at the carrier centre.
    root.add(box(.54,.12,.88,M.rail,0,-.035,0,.016));
    for(const z of[-.32,.32])for(const x of[-.19,.19]){const wheel=cylinder(.045,.035,M.gasket,x,.018,z,12);wheel.rotation.z=Math.PI/2;root.add(wheel);}
    root.add(box(.620,.340,.93,M.white,0,-.280,0,.035),box(.575,.060,.83,M.panel,0,-.474,0,.012));
    for(const x of[-1,1]){
      root.add(box(.013,.212,.73,M.panel,x*.316,-.285,0));
      for(let i=0;i<9;i++)root.add(box(.004,.032,.032,M.gasket,x*.323,-.286,-.25+i*.062));
    }
    const tag=panelLabel(id,.22,.07);tag.position.set(0,-.285,.472);root.add(tag);
    const hoist=new T.Group();root.add(hoist);hoist.add(box(.245,.040,.22,M.steel,0,.036,0,.007));
    const jaws=[];for(const side of[-1,1]){const jaw=new T.Group();jaw.add(box(.012,.052,.097,M.edge,0,.001,0));const finger=box(.032,.009,.097,M.edge,-side*.010,-.0215,0);finger.name='support-finger';jaw.add(finger);jaw.position.x=side*.080;jaws.push(jaw);hoist.add(jaw);}
    const belts=[];for(const x of[-.10,.10])for(const z of[-.075,.075]){const b=box(.013,1,.003,M.gasket,x,-1,z);root.add(b);belts.push(b);}
    let carrier=null;if(pod){carrier=foup({detail,colour,id:id.replace('T','L')}).root;carrier.rotation.y=Math.PI;root.add(carrier);}
    function setHoist({baseY=3.14,railY=4.35,closed=true,carrierY=baseY}){
      const flangeY=baseY+.338;hoist.position.y=flangeY-railY;
      const beltTop=-.495,beltBottom=hoist.position.y+.058,length=Math.max(.0001,beltTop-beltBottom);
      belts.forEach(b=>{b.scale.y=length;b.position.y=(beltTop+beltBottom)/2;});
      jaws.forEach((j,i)=>j.position.x=(i===0?-1:1)*(closed?.080:.113));
      if(carrier)carrier.position.y=carrierY-railY;
    }
    if(!detail)simplifyDistant(root);
    setHoist({});return {root,hoist,belts,jaws,carrier,setHoist};
  }
  function tower(group,x,y,z,green=true){
    group.add(cylinder(.025,.24,M.steel,x,y+.12,z,8));
    for(let i=0;i<3;i++)group.add(cylinder(.041,.063,i===0&&green?M.green:i===1?M.yellow:M.dark,x,y+.24+i*.066,z,12));
    group.add(cylinder(.045,.013,M.dark,x,y+.443,z,12));
  }
  function tool({type='cluster',detail=false,id='ET01',loaded=true}={}){
    const root=new T.Group();root.name='tool-'+id;const ports=[];
    root.add(contactShadow(type==='lithography'?3.6:3.4,type==='lithography'?4.0:3.5,0,-1.35));
    if(type==='lithography'){
      root.add(box(3.15,3.45,3.15,M.white,0,1.80,-1.95,.025),box(2.72,.62,3.08,M.panel,0,3.50,-1.95,.02));
      for(const sx of[-1,1])root.add(box(.56,2.85,.18,M.panel,sx*1.24,1.64,-.09,.018));
      root.add(box(1.9,1.35,.055,M.dark,0,2.14,-.122,.018));
      for(let i=0;i<3;i++)root.add(box(.43,1.25,.015,M.panel,-.55+i*.55,2.14,-.088));
      root.add(box(2.97,.055,.17,M.rail,0,2.88,-.05));
    }else if(type==='wetbench'){
      root.add(box(3.18,.85,1.72,M.white,0,.48,-1.33,.02),box(3.18,.16,1.8,M.steel,0,.965,-1.33,.015));
      for(let i=0;i<4;i++){const x=-1.12+i*.75;root.add(box(.59,.48,.66,M.dark,x,1.16,-1.36,.015),box(.62,.035,.72,M.panel,x,1.42,-1.36,.012));}
      for(const x of[-1.5,1.5])root.add(box(.085,1.52,.09,M.rail,x,1.75,-.43));
      root.add(box(3.18,.22,1.75,M.white,0,2.42,-1.33,.02));
      root.add(box(3.0,1.26,.015,M.blue,0,1.7,-.455));
    }else{
      // Narrow EFEM front, robot/transfer body and cylindrical process chambers behind.
      root.add(box(2.12,2.25,.49,M.white,0,1.20,-.62,.018));
      root.add(box(2.12,.46,.14,M.white,0,.45,-.27,.008),box(2.12,.22,.14,M.white,0,2.25,-.27,.008));
      root.add(box(1.86,.78,.028,M.dark,0,1.73,-.213,.009));
      for(const x of[-.92,.92])root.add(box(.047,2.05,.035,M.rail,x,1.18,-.204));
      root.add(box(1.45,.80,1.62,M.steel,0,1.30,-1.56,.02),cylinder(.62,.77,M.steel,0,1.64,-1.66,16));
      for(const side of[-1,1])for(const z of[-1.30,-2.30]){
        root.add(cylinder(.53,.73,M.panel,side*.93,1.52,z,16),cylinder(.56,.056,M.steel,side*.93,1.912,z,16),cylinder(.40,.042,M.dark,side*.93,1.960,z,16));
        root.add(box(.61,.82,.50,M.white,side*.93,.68,z,.01));
      }
      root.add(box(2.2,.26,2.55,M.panel,0,.20,-1.62,.01));
    }
    const portCount=type==='wetbench'?2:3;
    for(let i=0;i<portCount;i++){const lp=loadport({detail,id:id+'-'+(i+1),withFoup:loaded&&((i+id.length)%3!==0)});lp.root.position.x=(i-(portCount-1)/2)*.66;root.add(lp.root);ports.push(lp);}
    const screen=display(type==='wetbench'?'CLEAN':type==='lithography'?'EXPOSE':'ETCH');screen.position.set(type==='lithography'?1.33:1.03,1.61,.01);root.add(screen);
    tower(root,type==='lithography'?1.44:1.03,type==='lithography'?3.9:2.32,-.52);
    const name=panelLabel(id,.39,.10);name.position.set(type==='wetbench'?-1.17:-.72,type==='wetbench'?2.43:2.19,-.192);root.add(name);
    for(const x of[-.91,.91])for(const z of[-.42,-2.65]){root.add(cylinder(.050,.070,M.steel,x,.035,z,8),cylinder(.067,.012,M.gasket,x,.006,z,8));}
    if(detail){
      for(let i=0;i<12;i++)root.add(box(.46,.009,.012,M.gasket,.44,.36+i*.038,-.213));
      for(const x of[-1,1])for(let i=0;i<4;i++){root.add(between([x*.96,.5+i*.28,-2.5],[x*1.42,.5+i*.28,-2.5],.019,M.steel),between([x*1.42,.5+i*.28,-2.5],[x*1.42,.08,-2.5],.019,M.steel));}
      for(const x of[-.90,.90])for(const y of[.3,1.15,2.14]){const b=cylinder(.004,.006,M.steel,x,y,-.197,6);b.rotation.x=Math.PI/2;root.add(b);}
    }
    if(!detail)simplifyDistant(root);
    return {root,ports};
  }
  function technician({height=1.72,pose='observe'}={}){
    const root=new T.Group();root.name='derived-cleanroom-technician';
    // No walking loop: planted shoes and a quiet task-oriented stance avoid skating.
    for(const side of[-1,1]){
      const x=side*.105;root.add(box(.115,.09,.258,M.cloth,x,.055,.045,.015));
      root.add(between([x,.12,0],[x,.72,.0],.071,M.cloth,12));
      root.add(sphere(.09,M.cloth,[.8,1.12,.85],[x,.72,0]));
    }
    root.add(sphere(.24,M.cloth,[.90,1.30,.65],[0,1.02,0]));
    root.add(sphere(.147,M.cloth,[.93,1.13,.95],[0,1.50,0]));
    const face=sphere(.10,M.visor,[1,.62,.18],[0,1.515,.127]);root.add(face);
    root.add(box(.158,.070,.025,M.cloth,0,1.446,.122,.012));
    for(const side of[-1,1]){
      const shoulder=[side*.205,1.19,0],elbow=[side*.30,.94,.07],hand=pose==='console'?[side*.21,1.07,.35]:[side*.24,.82,.18];
      root.add(between(shoulder,elbow,.064,M.cloth,12),between(elbow,hand,.052,M.cloth,12),sphere(.056,M.ceramic,[.8,1,.8],hand));
    }
    root.add(box(.009,.38,.010,M.gasket,0,1.04,.158));root.scale.setScalar(height/1.72);return root;
  }
  function batchStatic(group){
    group.updateMatrixWorld(true);const batches=new Map();
    group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;const k=o.geometry.uuid+'/'+o.material.uuid;let b=batches.get(k);if(!b){b={g:o.geometry,m:o.material,matrices:[],cast:o.castShadow,receive:o.receiveShadow};batches.set(k,b);}b.matrices.push(o.matrixWorld.clone());});
    const result=new T.Group();result.name='instanced-static-fab';
    for(const b of batches.values()){const mesh=new T.InstancedMesh(b.g,b.m,b.matrices.length);b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=b.cast;mesh.receiveShadow=b.receive;mesh.frustumCulled=false;mesh.instanceMatrix.needsUpdate=true;result.add(mesh);}
    return result;
  }
  return {M,box,cylinder,sphere,between,panelLabel,display,contactShadow,foup,loadport,oht,tower,tool,technician,batchStatic,tex,geometries,materials};
}

/** Continuous normalized hand-off. Durations are editorial, not measured tool cycle times. */
export function transferState(p){
  p=clamp(p);
  const arrived=phase(p,0,.18),landed=phase(p,.23,.53),raised=phase(p,.64,.84),departure=phase(p,.87,1);
  const vehicleZ=-6.5*(1-arrived)+6.8*departure;
  const podBaseY=3.14-(3.14-.900)*landed;
  const gripBaseY=podBaseY+(3.14-.900)*raised;
  const released=p>=.61;
  const docking=phase(p,.87,.97);
  return {p,vehicleZ,podZ:p<.53?vehicleZ:-.070*docking,podBaseY,gripBaseY,
    jawOpen:phase(p,.57,.61),beltLength:4.35-.495-(gripBaseY+.338+.058),
    podSupport:p<.53?'gripper':p<.61?'gripper-and-kinematic-datum':'loadport',
    gripEngaged:!released,landingComplete:p>=.53,travelEnabled:p<=.18||p>=.87,
    stage:p<.18?'approach':p<.23?'aligned':p<.53?'lower':p<.57?'land-and-clamp':p<.61?'release':p<.64?'clearance-hold':p<.84?'retract':p<.87?'overhead-clear':p<.97?'depart-and-dock':'docked',
    datum:.900,dockingDisplacement:-.070*docking};
}
