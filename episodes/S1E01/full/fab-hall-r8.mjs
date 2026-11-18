import {createFabHardware,transferState,phase,smooth5,FAB_DIMENSIONS} from './fab-hardware-r8.mjs';

const mix=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
const clamp=v=>Math.max(0,Math.min(1,v));

/**
 * A new modern ballroom fab: 26×64 m, 5.7 m cleanroom ceiling.
 * The building dimensions/arrangement are editorial engineering, not a plan of
 * any named plant. OHT, FOUP and loadport appearances use public exterior evidence.
 * Repeated objects are physical equipment rows; no previous film shot is loaded.
 */
export function createFabHall(T,options={}){
  const K=createFabHardware(T),{M,box,cylinder,between,panelLabel,tool}=K;
  const root=new T.Group();root.name='R8-modern-fab-ballroom';const fixed=new T.Group();
  const hero={x:-2.60,z:0,rail:4.35};
  const floorMap=M.floor.map.clone();floorMap.repeat.set(26/.6,64/.6);floorMap.needsUpdate=true;
  const floorMat=M.floor.clone();floorMat.map=floorMap;
  fixed.add(box(26,.10,64,floorMat,0,-.05,0));
  fixed.add(box(26,.16,64,M.panel,0,5.78,0),box(.18,5.7,64,M.white,-13,2.85,0),box(.18,5.7,64,M.white,13,2.85,0),box(26,5.7,.18,M.panel,0,2.85,-32));
  // Two exit vestibules interrupt the long end wall; no camera flies through it.
  for(const x of[-7,7]){
    fixed.add(box(2.35,2.7,.12,M.steel,x,1.35,-31.82),box(2.19,2.53,.05,M.white,x,1.31,-31.73));
    fixed.add(box(.014,2.53,.015,M.rail,x,1.31,-31.69));
    for(const side of[-1,1])fixed.add(box(.63,.64,.026,M.visor,x+side*.55,1.82,-31.68),box(.032,.42,.04,M.steel,x+side*.11,1.12,-31.66));
    const exit=panelLabel('EXIT',.5,.17,{bg:'#3e7361',fg:'#edf6e7'});exit.position.set(x,2.91,-31.69);fixed.add(exit);
  }
  // Suspended filter ceiling has its own module grid; bright strips are actual luminaires.
  const ceilingPanels=[];
  for(let x=-12;x<=12;x+=1.2)for(let z=-30.6;z<=30.6;z+=1.2){
    const light=((Math.round(x/1.2)+Math.round(z/1.2))%5===0);
    const panel=box(1.11,.045,1.11,light?M.light:M.ffu,x,5.665,z);panel.castShadow=false;fixed.add(panel);ceilingPanels.push(panel);
  }
  for(let x=-12.6;x<=12.7;x+=1.2)fixed.add(box(.035,.075,63,M.rail,x,5.67,0));
  for(let z=-31.2;z<=31.3;z+=1.2)fixed.add(box(25.3,.075,.035,M.rail,0,5.67,z));
  for(const x of[-12.75,-6.4,6.4,12.75])for(const z of[-24,-12,0,12,24]){
    fixed.add(box(.39,5.7,.39,M.white,x,2.85,z,.012),box(.46,.11,.46,M.steel,x,.055,z));
    // Protective corners and paired utility conduits follow the columns.
    fixed.add(box(.025,1.05,.43,M.rail,x+.21,.525,z),between([x-.24,.12,z+.15],[x-.24,5.35,z+.15],.023,M.steel));
  }
  // Four equipment banks with different process families and narrow secondary aisles.
  const machinePositions=[];
  for(let bank=0;bank<4;bank++){
    const x=[-9.0,-2.6,2.6,9.0][bank],yaw=bank<2?Math.PI/2:-Math.PI/2;
    for(let j=0;j<9;j++){
      const z=-25.2+j*6.3,isHero=bank===1&&j===4,type=(j+bank)%4===0?'lithography':(j+bank)%4===2?'wetbench':'cluster';
      const id=(type==='lithography'?'L':type==='wetbench'?'W':'E')+String(bank+1)+String(j+1);
      const a=tool({type,detail:Math.abs(z)<7&&bank===1,id,loaded:!isHero});a.root.position.set(x,0,z);a.root.rotation.y=yaw;fixed.add(a.root);machinePositions.push({id,type,x,z,yaw});
    }
  }
  // Nearest hero loadport sits at the centre port of the central etch tool.
  // Replace the repeated bank unit with a distinct detailed hero front-end.
  const heroTool=tool({type:'cluster',detail:true,id:'E-17',loaded:false});
  heroTool.root.position.set(hero.x,0,hero.z);heroTool.root.rotation.y=Math.PI/2;
  // The regular bank's j4 tool is removed before static batching to avoid overlap.
  const replaced=fixed.children.find(o=>o.name==='tool-'+machinePositions.find(m=>m.x===hero.x&&Math.abs(m.z)<.01)?.id);
  if(replaced)fixed.remove(replaced);
  fixed.add(heroTool.root);
  const heroRecord=machinePositions.find(m=>m.x===hero.x&&Math.abs(m.z)<.01);if(heroRecord){heroRecord.id='E-17';heroRecord.type='cluster';}
  // Docking moves the plate and its datums together with the supported FOUP.
  // Keep that one assembly out of the static architectural batch.
  const heroTable=heroTool.ports[1].table;heroTable.removeFromParent();
  heroTable.position.set(hero.x,0,hero.z);heroTable.rotation.y=Math.PI/2;root.add(heroTable);
  // Ceiling rail loops lie along each loadport line. Vertical stays connect them
  // to structural cross-members; the vehicle never floats independently of a rail.
  const lanes=[-9,-2.6,2.6,9],trackZ0=-28.5,trackZ1=28.5,returnOffset=1.02;
  const offsetFor=lane=>lane<2?returnOffset:-returnOffset;
  for(let n=0;n<lanes.length;n++){
    const x=lanes[n],offset=offsetFor(n);
    for(const xx of[x,x+offset]){
      fixed.add(box(.13,.13,trackZ1-trackZ0,M.rail,xx,hero.rail,0),box(.22,.032,trackZ1-trackZ0,M.dark,xx,hero.rail+.080,0));
      for(let z=-27;z<=27;z+=3){fixed.add(box(.047,1.23,.047,M.rail,xx,4.99,z),box(.26,.065,.20,M.steel,xx,4.405,z));}
    }
    for(const z of[trackZ0,trackZ1]){
      const points=[];for(let j=0;j<=16;j++){const theta=(z<0?Math.PI:0)+j*Math.PI/16;points.push(new T.Vector3(x+offset/2+offset/2*Math.cos(theta),hero.rail,z+(z<0?-1:1)*returnOffset/2*Math.sin(j*Math.PI/16)));}
      const path=new T.CatmullRomCurve3(points);const mesh=new T.Mesh(new T.TubeGeometry(path,24,.065,6,false),M.rail);mesh.castShadow=true;fixed.add(mesh);
    }
  }
  // Vertical utility trunks behind the operator-facing equipment, not in walkways.
  for(const x of[-11.7,-5.5,5.5,11.7]){
    fixed.add(box(.48,.20,60,M.steel,x,4.78,0));
    for(let z=-25;z<26;z+=6.3){
      for(let k=0;k<3;k++)fixed.add(between([x+.08*k,.13,z],[x+.08*k,4.70,z],.025+k*.007,k===2?M.panel:M.steel));
    }
  }
  // Buffer rack remains separate from the active loadport and the moving vehicle.
  const buffer=new T.Group();buffer.name='near-tool-buffer';buffer.position.set(9.8,0,9.45);
  for(const x of[-.75,.75])for(const z of[-.28,.28])buffer.add(box(.038,2.38,.038,M.rail,x,1.19,z));
  for(let i=0;i<3;i++){
    buffer.add(box(1.58,.035,.68,M.steel,0,.82+i*.56,0));
    for(let j=0;j<3;j++)if(!(i===0&&j===2)){const pod=K.foup({detail:false,colour:(i+j)%2?'blue':'amber',id:'B'+i+j}).root;pod.position.set(-.5+j*.5,.838+i*.56,0);buffer.add(pod);}
  }
  fixed.add(buffer);
  for(const [x,z,yaw,pose] of [[.45,-10,.65,'observe'],[-7.1,13,1.9,'console'],[7.2,-18,-1.7,'observe']]){
    const person=K.technician({pose});person.position.set(x,0,z);person.rotation.y=yaw;fixed.add(person);
  }
  fixed.updateMatrixWorld(true);
  const transitObstacles=[];
  fixed.traverse(o=>{if(!o.isMesh)return;const b=new T.Box3().setFromObject(o);if(b.min.y<3.478&&b.max.y>3.14)transitObstacles.push({name:o.name||o.material?.name||'geometry',min:b.min.toArray(),max:b.max.toArray()});});
  const staticRoot=K.batchStatic(fixed);root.add(staticRoot);
  // The hand-off carrier is separate from the vehicle: after landing it remains
  // supported by the three loadport datums while the empty hoist rises and leaves.
  const vehicle=K.oht({pod:false,id:'T17'});vehicle.root.position.set(hero.x,hero.rail,0);root.add(vehicle.root);
  const pod=K.foup({detail:true,colour:'amber',id:'A17'}).root;pod.rotation.y=-Math.PI/2;root.add(pod);
  const background=[];
  for(let lane=0;lane<lanes.length;lane++)for(let i=0;i<2;i++){
    if(lane===1)continue; // reserve the hero's full loop; no impossible overtaking.
    const v=K.oht({pod:true,colour:(lane+i)%2?'blue':'amber',detail:false,id:'T'+lane+i});root.add(v.root);background.push({v,lane,offset:i*.5+lane*.067});
  }
  function trackPose(f,lane){
    const radius=returnOffset/2,side=lane<2?1:-1,straight=trackZ1-trackZ0,L=2*straight+2*Math.PI*radius;
    let s=((f%1)+1)%1*L,x=lanes[lane],z=trackZ0,yaw=0;
    if(s<straight){z=trackZ0+s;yaw=0;}
    else if((s-=straight)<Math.PI*radius){const a=s/radius;x+=side*(radius-radius*Math.cos(a));z=trackZ1+radius*Math.sin(a);yaw=side*a;}
    else if((s-=Math.PI*radius)<straight){x+=side*returnOffset;z=trackZ1-s;yaw=side*Math.PI;}
    else{s-=straight;const a=s/radius;x+=side*(radius+radius*Math.cos(a));z=trackZ0-radius*Math.sin(a);yaw=side*(Math.PI+a);}
    return {x,z,yaw};
  }
  function checkTransitClearances(samples=240){
    const collisions=[];let inspected=0;
    for(let lane=0;lane<lanes.length;lane++)for(let i=0;i<samples;i++){
      const p=trackPose(i/samples,lane),c=Math.abs(Math.cos(p.yaw)),s=Math.abs(Math.sin(p.yaw)),hx=(.426*c+.355*s)/2,hz=(.355*c+.426*s)/2;
      for(const b of transitObstacles){inspected++;if(p.x+hx>b.min[0]+1e-6&&p.x-hx<b.max[0]-1e-6&&p.z+hz>b.min[2]+1e-6&&p.z-hz<b.max[2]-1e-6)collisions.push({lane,at:i/samples,obstacle:b.name});}
    }
    return {scope:'FOUP envelope against static mesh AABBs at transport height; not complete robot collision certification',samplesPerLane:samples,lanes:4,obstacleCount:transitObstacles.length,inspected,collisions};
  }
  const cameras={
    'nave-low':{a:[.45,1.62,25.7],b:[.45,1.62,21.3],targetA:[-.5,2.55,-20],targetB:[-.5,2.55,-20],fov:48},
    'bridge-high':{a:[11.8,5.08,26.4],b:[10.0,4.90,23.0],targetA:[-1.2,2.1,-4],targetB:[-1.2,2.1,-7],fov:48},
    'rail-follow':{a:[hero.x+1.4,4.0,-10.8],b:[hero.x+1.4,4.0,-4.6],targetA:[hero.x,3.65,-5.5],targetB:[hero.x,3.40,0],fov:42},
    'hoist-side':{a:[.2,2.8,2.9],b:[-.1,2.6,2.5],targetA:[hero.x,2.22,0],targetB:[hero.x,1.86,0],fov:43},
    'dock-macro':{a:[-1.58,1.39,.91],b:[-1.67,1.36,.85],targetA:[hero.x,1.07,.015],targetB:[hero.x,1.07,.015],fov:39},
    'loadport':{a:[-.25,1.55,1.25],b:[-.43,1.50,1.12],targetA:[hero.x,1.05,0],targetB:[hero.x,1.05,0],fov:40},
    'traverse':{a:[1.2,1.68,-17],b:[1.2,1.68,-10.5],targetA:[-3.6,1.45,-12],targetB:[-3.6,1.45,-5.5],fov:49},
    'long-lens':{a:[-.2,1.7,27],b:[-.2,1.7,24.5],targetA:[-.3,2.05,-14],targetB:[-.3,2.05,-14],fov:23},
    'buffer-level':{a:[6.6,1.8,12.15],b:[6.9,1.72,11.75],targetA:[9.8,1.57,9.45],targetB:[9.8,1.57,9.45],fov:39},
    'service':{a:[-6.7,1.5,-15],b:[-6.7,1.5,-12],targetA:[-5.4,1.8,-19],targetB:[-5.4,1.8,-16],fov:48},
    'ceiling':{a:[.4,1.65,12],b:[.4,2.10,9],targetA:[-2.5,4.9,2],targetB:[-2.5,5.15,0],fov:56},
    'floor':{a:[.55,.30,7.0],b:[.55,.30,5.1],targetA:[.2,.03,3],targetB:[.2,.03,1],fov:51},
    'cross-aisle':{a:[10.5,1.66,3.1],b:[7.8,1.66,3.1],targetA:[-9.0,2.2,3.1],targetB:[-9.0,2.2,3.1],fov:50},
    'quiet-operator':{a:[2.0,1.75,-6.5],b:[1.85,1.75,-7.0],targetA:[.45,1.2,-10],targetB:[.45,1.2,-10],fov:37},
    'departure':{a:[-1.2,3.98,7],b:[-1.2,3.98,11],targetA:[hero.x,3.55,4],targetB:[hero.x,3.55,8],fov:38},
    'deep-reveal':{a:[.6,1.66,-29.5],b:[.6,2.15,-26.5],targetA:[0,2.8,22],targetB:[0,2.8,27],fov:52}
  };
  const viewAliases={wide:'nave-low',aisle:'traverse',rail:'rail-follow',hoist:'hoist-side',dock:'dock-macro',buffer:'buffer-level',operator:'quiet-operator',exit:'departure'};
  const diagnostics={dimensions:{hall:[26,5.7,64],rail:hero.rail,...FAB_DIMENSIONS},geometryBasis:'evidence_plus_derived_editorial',namedPlant:false,mechanism:'closed-form hoist transfer; assumed editorial durations',machinePositions,backgroundLaneCount:3,clearances:{fimsPlaneX:hero.x-.2475,dockGap:.070,loadportDatumY:.900,foupFlangeTopAboveBase:.338,transitPodBaseY:3.14,vehicleLowestY:hero.rail-.504},frameChecks:[]};
  let lastState=null;
  function frame({act='transport',p=0,view='nave-low',u=0,t=0}={}){
    u=clamp(u);p=clamp(p);const transfer=transferState(act==='transfer'?p:act==='docked'||act==='queue'?1:0);
    // Outside the demonstration, hold the completed hand-off or stage a distinct
    // in-transit overhead view. Never restart an already-progressing transfer at a cut.
    let vZ=transfer.vehicleZ,pZ=transfer.podZ,baseY=transfer.podBaseY,gripY=transfer.gripBaseY;
    if(act==='transport'||act==='opening'||act==='exit'){
      vZ=-15+24*p;pZ=vZ;baseY=3.14;gripY=3.14;
    }
    vehicle.root.position.set(hero.x,hero.rail,vZ);vehicle.root.rotation.y=0;
    vehicle.setHoist({baseY:gripY,railY:hero.rail,closed:transfer.jawOpen<.5});
    vehicle.jaws.forEach((j,i)=>j.position.x=(i===0?-1:1)*(.08+.033*transfer.jawOpen));
    pod.position.set(hero.x,baseY,pZ);pod.rotation.y=-Math.PI/2;
    // Docking motion points into the machine (-X in world), not along its rail.
    if(act==='transfer'&&transfer.landingComplete){pod.position.x=hero.x+transfer.dockingDisplacement;pod.position.z=0;}
    if(act==='docked'||act==='queue'){pod.position.set(hero.x-.07,.9,0);}
    const dockTravel=(act==='transfer'||act==='docked'||act==='queue')?transfer.dockingDisplacement:0;
    heroTable.position.set(hero.x+dockTravel,0,hero.z);
    for(const {v,lane,offset} of background){const a=trackPose(t*.009+offset,lane);v.root.position.set(a.x,hero.rail,a.z);v.root.rotation.y=a.yaw;v.setHoist({});}
    const pose=cameras[viewAliases[view]||view]||cameras['nave-low'];
    const e=smooth5(u),position=mix(pose.a,pose.b,e),target=mix(pose.targetA,pose.targetB,e);
    if(view==='rail-follow'&&(act==='opening'||act==='transport')){position[2]=vZ-3.8;target[2]=vZ+.25;}
    if(view==='hoist-side'&&act==='transfer')target[1]=1.15+Math.max(0,baseY-.9)*.50;
    lastState={act,p,transfer,carrierPosition:pod.position.toArray(),vehiclePosition:vehicle.root.position.toArray(),dockingPlatePosition:heroTable.position.toArray(),gripBaseY:gripY,fimsGap:pod.position.x-.1775-(hero.x-.2475),carrierSupport:(act==='transport'||act==='opening'||act==='exit')?'gripper':transfer.podSupport,background:background.map(({v,lane})=>({lane,position:v.root.position.toArray()}))};
    return {position,target,fov:pose.fov,look:{background:'#e2e5e4',key:'#fff9ee',fill:'#e8f0f7',exposure:1.04,fogNear:28,fogFar:82,lightPosition:[3,4.9,8],lightTarget:[0,1.5,0],shadowBounds:17},detail:{label:'Modern 300 mm fab · explanatory reconstruction',mechanism:transfer.stage,dimensions:diagnostics.dimensions},state:lastState};
  }
  frame();
  return {root,frame,cameras,diagnostics,hardware:K,hero,actors:{vehicle,pod,heroTable},checkTransitClearances,get state(){return lastState;}};
}
