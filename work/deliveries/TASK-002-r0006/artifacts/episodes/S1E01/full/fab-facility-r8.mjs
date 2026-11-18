import {createFabHardware,phase,smooth5} from './fab-hardware-r8.mjs';

const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const mix=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);

/**
 * NEW R8 editorial sets. Metres, Y up. No R7 scene or photograph imported.
 * Intel's public fab-tour account supplies the ceiling → cleanroom → perforated
 * floor → subfab → side return relationship. The architecture, utility routing,
 * inspection instrument and construction stages are explicitly derived designs,
 * not any named manufacturer's CAD, measured airflow or a calibrated simulator.
 * Technique: material roughness distinguishes enamel/steel/concrete; restrained
 * finite camera moves reveal connected structure. No product-turntable motion.
 */
export function createFabFacility(T){
  const K=createFabHardware(T),{M,box,cylinder,between,panelLabel}=K;
  const root=new T.Group();root.name='R8-facility-evidence-reconstruction';
  const section=new T.Group(),metrology=new T.Group(),exterior=new T.Group();
  section.name='architectural-cutaway';metrology.name='inspection-bay';exterior.name='fab-envelope-and-logistics';root.add(section,metrology,exterior);
  const concrete=new T.MeshStandardMaterial({name:'cast-concrete',color:'#a7aea8',roughness:.94,metalness:0});
  const warm=new T.MeshStandardMaterial({name:'service-enamel',color:'#c2ad86',roughness:.64,metalness:.10});
  const pipeBlue=new T.MeshStandardMaterial({name:'utility-marker-blue',color:'#788f97',roughness:.51,metalness:.26});
  const pipeBrown=new T.MeshStandardMaterial({name:'utility-marker-brown',color:'#9f8665',roughness:.60,metalness:.23});
  const granite=new T.MeshStandardMaterial({name:'granite-reference-base',color:'#555d59',roughness:.77,metalness:.03});
  const glass=new T.MeshStandardMaterial({name:'architectural-dark-glass',color:'#6e898a',roughness:.16,metalness:.41});
  const arrowMat=new T.MeshStandardMaterial({name:'illustrative-air-path',color:'#b88f4a',roughness:.63,metalness:.04,transparent:true,opacity:.72,depthWrite:false});
  const serviceLamp=new T.MeshStandardMaterial({name:'warm-service-luminaire',color:'#ece4ce',roughness:.5,emissive:'#a58c57',emissiveIntensity:.43});
  const geometryBasis={basis:'evidence_plus_derived_editorial',namedPlant:false,manufacturerCAD:false,flowModel:'schematic route, not CFD',stageModel:'derived supported XY raster, not vendor metrology performance'};
  for(const g of[section,metrology,exterior])g.userData={...geometryBasis};
  const fixedSection=new T.Group();
  function flange(group,a,b,r,material=M.steel){
    group.add(between(a,b,r,material,10));
    const aa=new T.Vector3(...a),bb=new T.Vector3(...b),d=bb.clone().sub(aa).normalize();
    for(const p of[aa,bb]){const ring=cylinder(r*1.42,.045,material,0,0,0,12);ring.position.copy(p);ring.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d);group.add(ring);}
  }
  function floorMaterial(width,depth){
    const m=M.floor.clone(),map=M.floor.map.clone();map.repeat.set(width/.6,depth/.6);map.needsUpdate=true;m.map=map;return m;
  }
  function louver(group,w,h,x,y,z,material=M.gasket){
    const n=Math.max(4,Math.floor(h/.06));for(let i=0;i<n;i++)group.add(box(w,.014,.018,material,x,y-h/2+i*h/n,z));
  }
  function supportFrame(group,x,y,z,w,h,d){
    for(const xx of[-w/2,w/2])for(const zz of[-d/2,d/2])group.add(box(.07,h,.07,M.rail,x+xx,y+h/2,z+zz));
    for(const yy of[y+.10,y+h]){group.add(box(w,.06,.07,M.rail,x,yy,z-d/2),box(w,.06,.07,M.rail,x,yy,z+d/2));}
  }
  // Three connected architectural strata, with two faces removed as a deliberate
  // section. This is not a camera travelling through an invisible solid wall.
  fixedSection.add(box(20,.28,28,concrete,0,-4.54,0));
  fixedSection.add(box(18,.08,26,floorMaterial(18,26),0,-.04,0));
  fixedSection.add(box(18,.14,26,M.panel,0,4.90,0));
  fixedSection.add(box(.18,11.5,26,concrete,-9.10,1.30,0),box(18,11.5,.18,concrete,0,1.30,-13.10));
  // Discontinuous raised-floor support leaves the subfab and utility paths legible.
  for(let z=-12;z<=12;z+=3){
    fixedSection.add(box(18,.28,.18,M.steel,0,-.39,z));
    for(let x=-8.4;x<=8.4;x+=2.8)fixedSection.add(box(.06,.30,.06,M.rail,x,-.19,z));
  }
  for(const x of[-8.5,-3,3,8.5])for(const z of[-12,-6,0,6,12]){
    fixedSection.add(box(.30,11.7,.30,concrete,x,1.31,z),box(.52,.14,.52,M.steel,x,-4.33,z));
    for(const yy of[-.56,4.7,7.12])fixedSection.add(box(.40,.11,.40,M.rail,x,yy,z));
  }
  for(let z=-12;z<=12;z+=6)fixedSection.add(box(18,.24,.23,M.steel,0,7.08,z));
  for(const x of[-8.5,-3,3,8.5])fixedSection.add(box(.16,.24,26,M.rail,x,7.08,0));
  // Equipment and operator scale above; service hardware below. The cleanroom
  // is a small contextual slice, not another replay of the hall's OHT shot.
  for(const x of[-5.0,5.0])for(let j=0;j<3;j++){
    const a=K.tool({type:j===1?'wetbench':'cluster',detail:false,id:'SEC-'+(x<0?'A':'B')+j,loaded:true});
    a.root.position.set(x,0,-8+j*8);a.root.rotation.y=x<0?Math.PI/2:-Math.PI/2;fixedSection.add(a.root);
  }
  const person=K.technician({pose:'observe'});person.position.set(.8,0,6.5);person.rotation.y=-.7;fixedSection.add(person);
  // Filter faces and a visibly connected fan deck. Access deck is deliberately
  // open at the section edge; fans remain mounted in housings, never floating.
  const fanRotors=[];
  for(let x=-7.2;x<=7.3;x+=2.4)for(let z=-10.8;z<=10.9;z+=3.6){
    fixedSection.add(box(2.18,.18,3.34,M.ffu,x,4.75,z),box(2.18,.08,3.34,M.steel,x,5.20,z));
    const isFan=(Math.round(x/2.4)+Math.round(z/3.6))%3===0;
    if(isFan){
      fixedSection.add(cylinder(.37,.30,M.panel,x,5.40,z,16),cylinder(.42,.06,M.steel,x,5.24,z,16));
      const rotor=new T.Group();rotor.position.set(x,5.57,z);
      rotor.add(cylinder(.095,.06,M.dark,0,0,0,12));
      for(let i=0;i<4;i++){const blade=box(.45,.018,.13,M.steel,.19,0,0);const pivot=new T.Group();pivot.rotation.y=i*Math.PI/2;pivot.add(blade);rotor.add(pivot);}
      section.add(rotor);fanRotors.push(rotor);
      for(const dx of[-.38,.38])fixedSection.add(box(.045,.38,.045,M.rail,x+dx,5.38,z));
    }
  }
  for(let z=-10;z<=10;z+=5){
    fixedSection.add(box(14.5,.055,.9,M.dark,-.6,6.06,z));
    for(const x of[-7.5,6.3])fixedSection.add(box(.045,.58,.045,M.rail,x,6.37,z),box(.045,.035,2.1,M.rail,x,6.65,z));
  }
  // Pump trains are bolted to a frame with inlet/exhaust and service-panel detail.
  const pumpCenters=[];
  for(const x of[-5.4,5.4])for(let j=0;j<4;j++){
    const z=-9+j*6;supportFrame(fixedSection,x,-4.39,z,1.95,1.48,1.16);
    fixedSection.add(box(2.10,.12,1.28,M.dark,x,-4.30,z));
    for(const off of[-.50,.48]){
      const pump=cylinder(.28,1.13,M.panel,x+off,-3.86,z,16);pump.rotation.x=Math.PI/2;fixedSection.add(pump);
      const motor=cylinder(.23,.42,M.steel,x+off,-3.86,z+.68,16);motor.rotation.x=Math.PI/2;fixedSection.add(motor);
      fixedSection.add(box(.53,.18,.65,M.rail,x+off,-4.14,z));
      for(let f=0;f<7;f++){const fin=cylinder(.242,.013,M.rail,x+off,-3.86,z+.48+f*.045,16);fin.rotation.x=Math.PI/2;fixedSection.add(fin);}
      flange(fixedSection,[x+off,-3.86,z-.55],[x+off,-3.15,z-.55],.095);
      flange(fixedSection,[x+off,-3.15,z-.55],[x,-3.15,z-.55],.095);
    }
    flange(fixedSection,[x,-3.15,z-.55],[x,-.36,z-.55],.13);
    fixedSection.add(box(.54,.86,.12,warm,x+.86,-3.25,z+.66,.014));
    const tag=panelLabel('DRY PUMP',.38,.085);tag.position.set(x+.86,-2.99,z+.73);fixedSection.add(tag);
    louver(fixedSection,.38,.24,x+.86,-3.43,z+.733);
    pumpCenters.push([x,-3.65,z]);
  }
  // Gas/service cabinets stand along the rear wall, with connections rising on
  // the service side rather than passing through an operator's route.
  for(let x=-7;x<=7;x+=2){
    fixedSection.add(box(1.35,2.35,.82,warm,x,-3.18,-11.6,.02),box(1.20,2.12,.025,M.panel,x,-3.16,-11.17));
    fixedSection.add(box(.025,.37,.04,M.dark,x+.44,-3.0,-11.14),box(.46,.24,.025,M.visor,x,-2.48,-11.14));
    louver(fixedSection,.9,.35,x,-3.9,-11.13);
    for(let k=0;k<3;k++)flange(fixedSection,[x-.22+k*.22,-1.99,-11.60],[x-.22+k*.22,-.35,-11.60],.024,k===2?pipeBlue:M.steel);
  }
  // Main service canyon: actual pipe rack, transverse hangers, elbows and flanges.
  for(let i=0;i<5;i++){
    const x=-1.00+i*.45,y=-1.20-(i%2)*.27;
    flange(fixedSection,[x,y,-12],[x,y,12],.10+(i%3)*.025,i===1?pipeBlue:i===3?pipeBrown:M.steel);
  }
  for(let z=-12;z<=12;z+=3){
    fixedSection.add(box(3.4,.07,.08,M.rail,0,-1.68,z));
    for(const x of[-1.6,1.6])fixedSection.add(box(.025,.98,.025,M.steel,x,-1.14,z));
    fixedSection.add(box(1.25,.05,.10,serviceLamp,0,-.74,z));
  }
  // Side return is a connected open-sided duct for a cutaway, not a second supply.
  for(const z of[-8,0,8]){
    const x=9.55;
    fixedSection.add(box(1.0,10.4,.09,M.rail,x,1.0,z-.69),box(1.0,10.4,.09,M.rail,x,1.0,z+.69),box(.08,10.4,1.38,M.panel,x+.48,1.0,z));
    fixedSection.add(box(1.02,.08,1.38,M.steel,x,-4.19,z),box(1.02,.08,1.38,M.steel,x,6.20,z));
    fixedSection.add(box(2.1,.65,1.38,M.panel,8.97,6.10,z));
    for(let y=-3.8;y<6;y+=1.5)fixedSection.add(box(.045,.08,1.50,M.dark,x-.50,y,z));
  }
  section.add(K.batchStatic(fixedSection));
  // Sparse moving arrows explicitly represent a route; not dust, particles or CFD.
  const airPaths=[],arrowGeometry=new T.ConeGeometry(.105,.23,6),up=new T.Vector3(0,1,0);
  for(const z of[-8,0,8]){
    const points=[[1,4.48,z],[1,.20,z],[1,-3.48,z],[9.55,-3.48,z],[9.55,6.07,z],[1,6.07,z],[1,4.48,z]];
    const segments=points.slice(1).map((b,i)=>{const a=points[i],d=new T.Vector3(...b).sub(new T.Vector3(...a));return {a,b,length:d.length(),direction:d.normalize()};});
    const length=segments.reduce((a,s)=>a+s.length,0);
    for(let i=0;i<8;i++){
      const g=new T.Group();const shaft=cylinder(.028,.46,arrowMat,0,0,0,6);const head=new T.Mesh(arrowGeometry,arrowMat);head.position.y=.30;g.add(shaft,head);section.add(g);airPaths.push({g,segments,length,offset:i/8});
    }
  }

  // METROLOGY: an original inspection instrument with a stationary objective
  // and a physically supported, two-axis stage. Never recolour the whole wafer
  // from bad to good: a sample map is returned, measurement does not heal dies.
  const mStatic=new T.Group();
  mStatic.add(box(8,.10,8,floorMaterial(8,8),0,-.05,0),box(8,3.7,.12,M.white,0,1.85,-3.95),box(.12,3.7,8,M.panel,-3.95,1.85,0));
  for(let x=-3;x<=3;x+=1.2)for(let z=-3;z<=3;z+=1.2)mStatic.add(box(1.08,.08,1.08,(Math.round(x+z)%3===0)?M.light:M.ffu,x,3.65,z));
  mStatic.add(box(1.35,.78,1.25,M.white,0,.43,0,.022),box(1.48,.18,1.34,granite,0,.91,0,.012));
  for(const x of[-.52,.52])for(const z of[-.46,.46]){mStatic.add(cylinder(.09,.10,M.dark,x,.05,z,12),cylinder(.068,.15,M.steel,x,.165,z,12));}
  for(const x of[-.49,.49])mStatic.add(box(.41,.56,.025,M.panel,x,.45,.639,.007),box(.018,.16,.026,M.dark,x+.12,.44,.66));
  louver(mStatic,.90,.18,0,.24,.663);const metTag=panelLabel('INSPECTION  /  M-04',.65,.09);metTag.position.set(0,.734,.654);mStatic.add(metTag);
  // X guide supports, ballscrew/encoder representation, and physical stops.
  for(const z of[-.21,.21]){
    mStatic.add(box(.83,.042,.035,M.steel,0,1.028,z));
    for(const x of[-.40,.40])mStatic.add(box(.035,.10,.064,M.dark,x,1.07,z));
    for(let x=-.35;x<=.36;x+=.10){const bolt=cylinder(.006,.007,M.dark,x,1.053,z,6);mStatic.add(bolt);}
  }
  mStatic.add(between([-.40,1.052,-.30],[.40,1.052,-.30],.013,M.steel),box(.83,.012,.016,M.dark,0,1.063,.28));
  for(const x of[-.47,.47])mStatic.add(box(.08,.09,.10,M.panel,x,1.05,-.30,.006));
  const stageX=new T.Group(),stageZ=new T.Group();stageX.name='inspection-X-carriage';stageZ.name='inspection-Z-carriage';stageX.add(stageZ);metrology.add(stageX);
  stageX.add(box(.45,.044,.53,M.rail,0,1.083,0,.006));
  for(const x of[-.14,.14])for(const z of[-.21,.21])stageX.add(box(.10,.024,.075,M.dark,x,1.056,z,.003));
  for(const x of[-.17,.17]){
    stageX.add(box(.035,.038,.44,M.steel,x,1.125,0));
    for(const z of[-.22,.22])stageX.add(box(.064,.075,.025,M.dark,x,1.145,z));
  }
  stageX.add(between([.245,1.13,-.23],[.245,1.13,.23],.009,M.steel),box(.014,.01,.44,M.dark,-.24,1.15,0));
  for(const x of[-.17,.17])for(const z of[-.11,.11])stageZ.add(box(.063,.026,.10,M.dark,x,1.141,z,.003));
  stageZ.add(box(.40,.040,.37,M.panel,0,1.166,0,.006),cylinder(.146,.028,M.dark,0,1.200,0,48));
  // Wafer markings are illustrative die layout, not measured yield data.
  const waferCanvas=document.createElement('canvas');waferCanvas.width=waferCanvas.height=512;const wx=waferCanvas.getContext('2d');
  wx.fillStyle='#3f575b';wx.fillRect(0,0,512,512);
  for(let j=0;j<32;j++)for(let i=0;i<32;i++){
    const hue=155+(i+j)*.9;wx.fillStyle=`hsl(${hue} 17% ${26+((i*13+j*7)%11)}%)`;wx.fillRect(i*16+1,j*16+1,14,14);
    wx.fillStyle='rgba(197,200,152,.20)';wx.fillRect(i*16+3,j*16+3,8,2);
  }
  const waferMap=new T.CanvasTexture(waferCanvas);waferMap.colorSpace=T.SRGBColorSpace;
  const waferMat=new T.MeshStandardMaterial({name:'illustrative-patterned-silicon',color:'#c2d1cf',map:waferMap,roughness:.24,metalness:.59});
  const wafer=cylinder(.150,.0008,waferMat,0,1.2144,0,64);wafer.name='300mm-supported-inspection-wafer';stageZ.add(wafer);
  const notchedge=box(.006,.001,.002,M.dark,0,1.2149,.149);stageZ.add(notchedge);
  // A proper bridge carries the optics; clear space under the objective is intentional.
  for(const x of[-.65,.65]){
    mStatic.add(box(.13,.94,.18,M.panel,x,1.47,-.42,.007),box(.24,.07,.28,M.steel,x,1.035,-.42));
    for(const z of[-.50,-.34]){const bolt=cylinder(.009,.012,M.dark,x,1.077,z,6);mStatic.add(bolt);}
  }
  mStatic.add(box(1.43,.18,.23,M.white,0,1.92,-.42,.015),box(.24,.18,.60,M.rail,0,1.83,-.18,.008));
  mStatic.add(box(.28,.28,.27,M.white,0,1.64,.0,.015),cylinder(.095,.08,M.dark,0,1.465,0,24));
  mStatic.add(cylinder(.026,.14,M.steel,0,1.32,0,24),cylinder(.033,.035,M.dark,0,1.403,0,24),cylinder(.018,.004,glass,0,1.248,0,24));
  // Second parked objective belongs to the turret, not an unsupported floating lens.
  mStatic.add(cylinder(.022,.105,M.steel,.065,1.337,-.018,16));
  mStatic.add(box(.07,.20,.08,M.dark,0,1.91,.0),between([0,2.0,0],[0,2.0,-.45],.012,M.gasket),between([0,2.0,-.45],[-.63,2.0,-.45],.012,M.gasket));
  const console=K.display('MEASURE');console.position.set(1.20,1.48,.32);mStatic.add(console);
  mStatic.add(box(.07,1.35,.07,M.rail,1.2,.675,.32),box(.46,.06,.38,M.dark,1.2,.03,.32),box(.40,.035,.26,M.panel,1.2,1.21,.49));
  const operator=K.technician({pose:'console'});operator.position.set(1.22,0,1.12);operator.rotation.y=Math.PI;mStatic.add(operator);
  // Isolation feet on an adjacent power cabinet and real connected utility lines.
  mStatic.add(box(.68,1.1,.66,M.panel,-1.57,.60,-.50,.015));louver(mStatic,.47,.35,-1.57,.55,-.162);
  flange(mStatic,[-1.57,.25,-.83],[-1.57,.25,-1.15],.018);flange(mStatic,[-1.57,.25,-1.15],[0,.25,-1.15],.018);flange(mStatic,[0,.25,-1.15],[0,.65,-.63],.018);
  const chain=[];for(let i=0;i<18;i++){const a=box(.035,.025,.031,M.dark,0,0,0,.003);metrology.add(a);chain.push(a);}
  metrology.add(K.batchStatic(mStatic));
  const mapSamples=Array.from({length:45},(_,i)=>{const row=Math.floor(i/9),col=i%9;return {x:-.10+col*.025,z:-.08+row*.04,exampleClass:(i===7||i===21||i===32)?'flagged':'nominal'};});

  // EXTERIOR: separate large-envelope scene. Discrete installed components mark
  // a compressed illustrative build sequence; no growing walls or melting plant.
  const eStatic=new T.Group(),envelope=new T.Group();exterior.add(envelope);
  const asphalt=new T.MeshStandardMaterial({name:'asphalt',color:'#59645f',roughness:.96});
  eStatic.add(box(110,.18,92,concrete,0,-.13,0),box(106,.02,12,asphalt,0,-.025,26),box(68,.02,4,asphalt,0,-.025,-22));
  eStatic.add(box(60,.35,32,concrete,0,.165,0));
  for(let x=-27;x<=27;x+=6)for(const z of[-13,-6.5,0,6.5,13]){
    eStatic.add(box(.28,11.4,.28,M.rail,x,5.9,z),box(.70,.16,.70,concrete,x,.43,z));
    if((z===-13||z===13)&&x<27){
      eStatic.add(between([x-.1,1,z],[x+5.8,10.9,z],.055,M.steel));
    }
  }
  for(let x=-27;x<=27;x+=6){
    eStatic.add(box(.19,.30,30,M.steel,x,11.52,0));
    for(let z=-14;z<14;z+=3.5)eStatic.add(between([x,11.35,z],[x,10.55,z+1.75],.055,M.rail),between([x,10.55,z+1.75],[x,11.35,z+3.5],.055,M.rail));
  }
  for(const z of[-13,0,13])eStatic.add(box(59,.26,.22,M.rail,0,11.38,z));
  const installed=[];
  for(let i=0;i<20;i++)for(const sign of[-1,1]){
    const x=-28.5+i*3,g=new T.Group();g.add(box(2.96,10.9,.17,M.white,x,5.98,sign*16));
    for(let k=0;k<5;k++)g.add(box(2.96,.027,.026,M.panel,x,1.5+k*2.05,sign*16.10));
    if(sign===1&&(i<4||i>15))g.add(box(2.70,2.0,.035,glass,x,2.70,16.11));
    envelope.add(g);installed.push({g,at:.16+.48*(i/20)+.05*(sign<0)});
  }
  for(const x of[-30,30]){
    const g=new T.Group();g.add(box(.17,10.9,32,M.panel,x,5.98,0));
    for(let z=-15;z<=15;z+=1.5)g.add(box(.025,10.5,.018,M.white,x+(x>0?.1:-.1),5.98,z));
    envelope.add(g);installed.push({g,at:.55});
  }
  const roof=new T.Group();roof.add(box(60,.25,32,M.panel,0,11.55,0));
  for(let x=-23;x<=23;x+=9.2)for(const z of[-8,5]){
    roof.add(box(4.0,2.2,3.0,M.white,x,12.77,z,.03));
    for(const xx of[-1.7,1.7])roof.add(box(.10,.60,2.5,M.rail,x+xx,11.92,z));
    louver(roof,3.6,1.25,x,12.85,z+1.51);
    for(const dx of[-.9,.9])roof.add(cylinder(.64,.11,M.dark,x+dx,13.93,z,16));
  }
  envelope.add(roof);installed.push({g:roof,at:.72});
  for(let x=-26;x<=26;x+=4){
    eStatic.add(box(.025,.012,9,M.panel,x,.001,26));
    if(x%8===-2){eStatic.add(cylinder(.06,5.8,M.rail,x,2.9,19,8),box(.45,.10,.20,serviceLamp,x,5.80,19.12));}
  }
  for(let i=0;i<6;i++){
    const x=-10+i*4;const dock=new T.Group();dock.add(box(3.05,3.35,.18,M.dark,x,1.92,16.15),box(2.72,2.9,.04,M.panel,x,1.88,16.26));
    for(let k=0;k<12;k++)dock.add(box(2.72,.022,.018,M.rail,x,.5+k*.23,16.292));
    dock.add(box(3.25,.27,1.5,M.steel,x,.33,16.85));envelope.add(dock);installed.push({g:dock,at:.78});
  }
  exterior.add(K.batchStatic(eStatic));
  // A road vehicle is mechanically one assembly: tractor, trailer, axles and
  // wheels translate together. Travel direction is fixed; no scene-wide spin.
  const truck=new T.Group();truck.name='service-logistics-vehicle';
  truck.add(box(9.8,2.7,2.6,M.white,-3.5,2.12,0,.07),box(11.6,.28,2.1,M.dark,-3.15,.83,0));
  truck.add(box(2.45,2.25,2.52,M.panel,3.13,1.90,0,.12),box(1.0,.75,2.45,M.white,4.18,1.15,0,.10));
  truck.add(box(.06,.80,2.1,glass,4.37,2.30,0));
  const truckWheels=[];for(const x of[-7.1,-5.85,1.5,3.75])for(const z of[-1.14,1.14]){
    const wheel=cylinder(.46,.24,M.gasket,x,.47,z,16);wheel.rotation.x=Math.PI/2;truck.add(wheel);truckWheels.push(wheel);
    const hub=cylinder(.22,.25,M.steel,x,.47,z,12);hub.rotation.x=Math.PI/2;truck.add(hub);
  }
  exterior.add(truck);

  const cameras={
    'section-wide':{a:[25,13,32],b:[22.7,12,30],targetA:[.5,1.1,0],targetB:[.5,1.1,0],fov:42},
    'filter-deck':{a:[8.2,8.3,12.0],b:[7.2,7.8,10.8],targetA:[-1,5.4,0],targetB:[-1,5.4,-1],fov:46},
    'downflow-floor':{a:[3.2,3.2,10.8],b:[3.2,1.7,9.8],targetA:[1,2.1,0],targetB:[1,.8,0],fov:46},
    'return-rise':{a:[15.9,3.0,12],b:[15.9,4.2,10],targetA:[9.55,1.6,0],targetB:[9.55,3.4,0],fov:44},
    'service-canyon':{a:[2.1,-3.1,11.8],b:[2.1,-3.1,8.6],targetA:[-.6,-2.5,-11],targetB:[-.6,-2.5,-11],fov:54},
    'pump-rack':{a:[1.8,-2.55,11.7],b:[2.2,-2.75,10.9],targetA:[5.4,-3.5,9],targetB:[5.4,-3.5,9],fov:43},
    'utility-riser':{a:[6.5,-2.2,-6.5],b:[5.9,-1.5,-7],targetA:[3.0,-1.8,-11.6],targetB:[3.0,-.8,-11.6],fov:44},
    'bay-entry':{a:[3.25,2.15,3.6],b:[2.8,1.96,3.15],targetA:[0,1.1,0],targetB:[0,1.2,0],fov:43},
    'wafer-stage':{a:[.73,1.80,.94],b:[.62,1.71,.84],targetA:[0,1.22,0],targetB:[0,1.22,0],fov:37},
    'objective-close':{a:[.38,1.39,.40],b:[.34,1.37,.36],targetA:[0,1.278,0],targetB:[0,1.278,0],fov:33},
    'structural-build':{a:[52,25,57],b:[49,24,54],targetA:[0,5,0],targetB:[0,5,0],fov:46},
    'commissioned-dusk':{a:[-49,14,49],b:[-45,13,47],targetA:[1,5,-2],targetB:[3,5,-2],fov:48},
    'logistics-close':{a:[27,4.8,41],b:[24,4.6,40],targetA:[1,2.2,23],targetB:[-2,2.2,23],fov:43}
  };
  function raster(p){
    const rows=5,q=clamp(p)*(rows-.0000001),row=Math.floor(q),f=q-row,direction=row%2?-1:1;
    const sweep=phase(f,0,.78),step=phase(f,.78,1);
    return {x:direction*(-.10+.20*sweep),z:-.08+row*.04+(row<rows-1?.04*step:0),row,phase:f<.78?'scan':'row-step',visited:Math.min(45,Math.floor(p*45)),rows};
  }
  let lastState=null;
  function frame({act='airflow',p=0,view,u=0,t=0}={}){
    p=clamp(p);u=clamp(u);t=Number.isFinite(t)?t:0;
    section.visible=act==='airflow'||act==='subfab';metrology.visible=act==='metrology';exterior.visible=act==='exterior';
    const fallback=act==='metrology'?'bay-entry':act==='subfab'?'service-canyon':act==='exterior'?'commissioned-dusk':'section-wide';
    const selected=cameras[view]?view:fallback,pose=cameras[selected],e=smooth5(u);
    for(let i=0;i<fanRotors.length;i++)fanRotors[i].rotation.y=t*1.8+i*.7;
    for(const a of airPaths){
      a.g.visible=act==='airflow';let d=(((t*.036+a.offset)%1)+1)%1*a.length,s=a.segments[0];
      for(const seg of a.segments){s=seg;if(d<=seg.length)break;d-=seg.length;}
      const f=Math.min(1,d/s.length);a.g.position.set(...mix(s.a,s.b,f));a.g.quaternion.setFromUnitVectors(up,s.direction);
    }
    const r=raster(p);stageX.position.x=r.x;stageZ.position.z=r.z;
    // Closed-form flexible service loop, with a stationary and moving endpoint.
    for(let i=0;i<chain.length;i++){
      const q=i/(chain.length-1),x=-.44+(.44+r.x)*q,z=.35+.09*Math.sin(Math.PI*q),y=1.14+.07*Math.sin(Math.PI*q);
      chain[i].position.set(x,y,z);chain[i].rotation.y=-Math.atan2(.09*Math.PI*Math.cos(Math.PI*q),.44+r.x);
    }
    const build=act==='exterior'&&selected==='structural-build'?p:1;
    for(const a of installed)a.g.visible=build>=a.at;
    const roadDistance=act==='exterior'?68*p:0;truck.position.set(-34+roadDistance,0,25.3);
    for(const w of truckWheels)w.rotation.y=-roadDistance/.46;
    const metro=act==='metrology',outside=act==='exterior',below=act==='subfab';
    const look=outside?{background:'#ced8d6',key:'#f2dfbe',fill:'#c2d2d5',exposure:1.04,fogNear:100,fogFar:230,lightPosition:[-20,36,28],lightTarget:[0,4,0],shadowBounds:48}:
      metro?{background:'#dce4dd',key:'#f0f4ec',fill:'#d3dfdf',exposure:1.06,fogNear:12,fogFar:35,lightPosition:[1.5,4.2,3.4],lightTarget:[0,1.1,0],shadowBounds:4.2}:
      {background:'#dce3dc',key:below?'#f2e4c7':'#eef3e9',fill:'#b9ccca',exposure:below?1.10:1.03,fogNear:30,fogFar:90,lightPosition:below?[1,-.8,10]:[11,15,16],lightTarget:below?[0,-3,-4]:[0,1,0],shadowBounds:22};
    lastState={act,view:selected,p,airflowBasis:'diagram, not CFD',inspection:{...r,waferDiameter:.300,waferBottomY:1.214,chuckTopY:1.214,objectiveBottomY:1.246,objectiveClearance:.0312,exampleMap:mapSamples},installedComponents:installed.filter(a=>a.g.visible).length,totalEnvelopeComponents:installed.length,truckX:truck.position.x};
    return {position:mix(pose.a,pose.b,e),target:mix(pose.targetA,pose.targetB,e),fov:pose.fov,look,detail:{label:metro?'300 mm inspection · derived mechanism':outside?'Fab building · explanatory reconstruction':'Cleanroom / subfab · architectural reconstruction',mechanism:metro?r.phase:act,geometryBasis},state:lastState};
  }
  const diagnostics={...geometryBasis,dimensions:{section:[18,11.7,26],cleanroomCeiling:4.8,subfabFloor:-4.4,fanDeck:5.2,waferDiameter:.300,metrologyStroke:[.20,.16]},cameraNames:Object.keys(cameras),newSetOnly:true,sources:['https://virtualmuseum.intel.com/fabtour/cleanroom.html','https://virtualmuseum.intel.com/fabtour/airflow.html','https://www.tsmc.com/sites/dcom/2026-08/2026_tsmc_corporate_video_en.mp4'],sampleMapIsIllustrative:true};
  let triangles=0,meshes=0;root.traverse(o=>{if(o.isMesh){const n=o.isInstancedMesh?o.count:1;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*n;meshes++;}});diagnostics.totalTriangles=triangles;diagnostics.meshObjects=meshes;diagnostics.under100k=triangles<100000;
  frame();return {root,frame,cameras,diagnostics,actors:{stageX,stageZ,wafer,truck},get state(){return lastState;}};
}
