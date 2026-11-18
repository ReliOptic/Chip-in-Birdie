import * as T from 'three';
import {createFabHall} from './fab-hall-r8.mjs';
import {createFabProcess} from './fab-process-r8.mjs';
import {createFabFacility} from './fab-facility-r8.mjs';
import {createSoftwareRenderer} from './software-renderer.mjs';
import {createFabEditorial} from './fab-editorial-r8.mjs';
import {buildFabShots,eventProgress} from './fab-shotplan-r8.mjs';

const clamp=x=>Math.max(0,Math.min(1,x));
/** Film presentation is retained; R8 picture content is exclusively new modules. */
export function createCinematicFilm({canvas,images,script,timeline,credits=[],forceSoftware=false}){
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Film canvas unavailable');
 const shots=buildFabShots(script,timeline),reportingCanvas=document.createElement('canvas');
 const reporting=createFabEditorial({canvas:reportingCanvas,images,credits});
 let picture=document.createElement('canvas'),renderer,backend;
 if(!forceSoftware){const gl=picture.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});if(gl){renderer=new T.WebGLRenderer({canvas:picture,context:gl,antialias:true,alpha:false});backend='WebGL2 · Three.js';renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.outputColorSpace=T.SRGBColorSpace;}}
 if(!renderer){picture=document.createElement('canvas');renderer=createSoftwareRenderer(T,{canvas:picture});backend='CPU 3D · compatibility renderer';}
 renderer.shadowMap.enabled=true;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,16/9,.008,200);
 const sets={hall:createFabHall(T),process:createFabProcess(T),facility:createFabFacility(T)};
 Object.values(sets).forEach(s=>{s.root.visible=false;scene.add(s.root);});
 const ambient=new T.HemisphereLight('#f1f3ed','#818984',1.55),key=new T.DirectionalLight('#fff4df',2.25),fill=new T.DirectionalLight('#dbe7ee',1.1);
 key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00008;key.shadow.normalBias=.008;key.shadow.radius=3;
 scene.add(ambient,key,key.target,fill);
 // An authored neutral light environment gives stainless steel broad reflections.
 // It is a lighting rig, not a generated photo or a claimed real cleanroom HDRI.
 let environment=null,pmrem=null;
 if(!renderer.isSoftwareRenderer){
  const width=512,height=256,data=new Float32Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const v=y/(height-1),u=x/width,top=Math.max(0,Math.cos(v*Math.PI));
   const strip=(Math.abs(v-.26)<.052&&((u>.10&&u<.33)||(u>.61&&u<.83)))?3.1:0;
   const val=.24+.52*top+strip,k=(y*width+x)*4;data[k]=val*1.02;data[k+1]=val;data[k+2]=val*.95;data[k+3]=1;
  }
  const tex=new T.DataTexture(data,width,height,T.RGBAFormat,T.FloatType);tex.mapping=T.EquirectangularReflectionMapping;tex.needsUpdate=true;
  pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromEquirectangular(tex);scene.environment=environment.texture;scene.environmentIntensity=.75;tex.dispose();
 }
 let state=null,lastSpatial=null,sizeKey='',lastSet=null;
 function size(){const k=canvas.width+'x'+canvas.height;if(k===sizeKey)return;sizeKey=k;reportingCanvas.width=canvas.width;reportingCanvas.height=canvas.height;
  const width=renderer.isSoftwareRenderer?Math.min(768,canvas.width):Math.min(1920,canvas.width);renderer.setPixelRatio(1);renderer.setSize(width,Math.round(width*9/16),false);}
 function lighting(s,f){
  const look=f.look||{},hall=s.set==='hall',macro=s.set==='process',ext=s.set==='facility'&&s.act==='exterior';
  scene.background=new T.Color(look.background||'#dfe3de');key.color.set(look.key||'#fff4df');fill.color.set(look.fill||'#dce7ea');
  const far=ext?250:hall?150:macro?30:90;camera.far=far;camera.near=macro?.003:.02;
  // Hall key stays below the opaque ceiling. Other rigs follow their own scale.
  const kp=look.lightPosition||(hall?[camera.position.x+2,4.85,camera.position.z+1]:macro?[-1.7,3,1.5]:ext?[-15,30,25]:[-12,21,12]);
  const kt=look.lightTarget||(hall?[f.target[0],1.5,f.target[2]]:f.target);
  key.position.fromArray(kp);key.target.position.fromArray(kt);fill.position.set(camera.position.x-2,camera.position.y+2,camera.position.z-1);
  const bounds=look.shadowBounds||(hall?15:macro?2.2:ext?44:22);key.shadow.camera.left=-bounds;key.shadow.camera.right=bounds;key.shadow.camera.top=bounds;key.shadow.camera.bottom=-bounds;key.shadow.camera.near=.01;key.shadow.camera.far=far;key.shadow.camera.updateProjectionMatrix();
  ambient.intensity=look.ambient??(hall?1.55:macro?.9:ext?.9:1.25);key.intensity=look.keyIntensity??(hall?1.6:macro?3.0:2.3);fill.intensity=look.fillIntensity??(macro?.65:1.05);
  scene.fog=new T.Fog(scene.background,look.fogNear??(hall?35:macro?8:ext?100:40),look.fogFar??(hall?110:macro?28:ext?245:90));
  renderer.toneMappingExposure=look.exposure||1.05;
 }
 function label(text,x,y,align='left',size=23){ctx.textAlign=align;ctx.font=`500 ${size}px Arial, sans-serif`;const w=ctx.measureText(text).width,xx=align==='right'?x-w:x;ctx.fillStyle='#f8f6ebee';ctx.fillRect(xx-12,y-size-9,w+24,size+21);ctx.fillStyle='#263331';ctx.fillText(text,x,y);}
 function project(point){const v=new T.Vector3(...point).project(camera);return[(v.x+1)*800,(1-v.y)*450,v.z];}
 function annotation(text,point,dx=85,dy=-30){const[x,y,z]=project(point);if(z< -1||z>1||x<50||x>1500||y<180||y>720)return;const tx=Math.max(65,Math.min(1300,x+dx)),ty=Math.max(215,Math.min(730,y+dy));ctx.strokeStyle='#a34c29';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx-18,ty-8);ctx.stroke();ctx.fillStyle='#a34c29';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();label(text,tx,ty);}
 function overlay(s,u,f){
  ctx.save();ctx.scale(canvas.width/1600,canvas.height/900);
  if(s.heading){ctx.globalAlpha=1;const g=ctx.createLinearGradient(0,0,0,s.ending?240:190);g.addColorStop(0,'rgba(12,23,23,.74)');g.addColorStop(1,'rgba(12,23,23,0)');ctx.fillStyle=g;ctx.fillRect(0,0,1600,s.ending?240:190);ctx.fillStyle='#fffaf1';ctx.textAlign='left';let font=s.ending?57:39;ctx.font=`400 ${font}px Georgia, serif`;if(ctx.measureText(s.heading).width>1460){font*=1460/ctx.measureText(s.heading).width;ctx.font=`400 ${font}px Georgia, serif`;}ctx.fillText(s.heading,64,s.ending?115:85);if(s.ending){ctx.font='500 19px Arial';ctx.fillText('CHIP IN BIRDIE  /  S1E01',68,163);}}
  if(s.callout==='qualification'){label('ILLUSTRATIVE OPERATION: TOOL ELIGIBILITY',65,721,'left',20);}
  if(s.callout==='waiting'){label('WAITING ≠ TRANSPORT FAILURE',65,720,'left',23);}
  if(s.set==='hall'&&f.state?.carrierPosition){const q=f.state.carrierPosition;
   if(s.callout==='sealed')annotation('SEALED CARRIER',[q[0],q[1]+.17,q[2]],100,38);
   if(s.callout==='hoist')annotation('VEHICLE STOPPED · VERTICAL LOWERING',[q[0],q[1]+.34,q[2]],85,-70);
   if(s.callout==='land')annotation('SUPPORT BEFORE RELEASE',[q[0],q[1],q[2]],95,70);
   if(s.callout==='dock')annotation('70 mm LOADPORT STROKE',[q[0],q[1]-.015,q[2]],90,80);
  }
  if(s.set==='facility'&&s.act==='airflow'){label('FILTER DECK → CLEANROOM → SUBFAB → RETURN',65,738,'left',22);}
  if(s.set==='facility'&&s.act==='subfab'){label('PUMPS · UTILITIES · EXHAUST BELOW THE PRODUCTION FLOOR',65,738,'left',21);}
  if(f.detail?.cutaway?.active){label('CUTAWAY / ONE WAFER SHOWN',65,86,'left',24);label('Enclosure, ceiling and other wafers omitted; supports retained.',65,738,'left',20);}
  if(s.set==='process'&&s.act==='process'){label('SELECTED PROCESS MECHANISMS · VERTICAL SCALE EXAGGERATED',65,738,'left',20);}
  if(s.set==='process'&&['layers','pattern','etch'].includes(s.view)){
   const stage=f.state?.stage||'',names={deposition:'DEPOSITION / ADD A FILM',photoresist:'COATING / ADD LIGHT-SENSITIVE RESIST','pattern-transfer':'EXPOSURE / A PATTERN IN THE RESIST',development:'DEVELOPMENT / OPEN THE RESIST',etch:'ETCH / TRANSFER INTO THE FILM','resist-strip':'STRIP / REMOVE THE REMAINING RESIST'};
   label(names[stage]||'SELECTED SURFACE OPERATIONS',65,86,'left',25);
   if((f.state?.p||0)>.19&&(f.state?.p||0)<.94)annotation('PHOTORESIST',[.25,.827,.30],90,-70);
   if(s.view==='etch')annotation('FILM BELOW THE RESIST',[.335,.791,.30],85,80);
  }
  const g=ctx.createLinearGradient(0,800,0,900);g.addColorStop(0,'rgba(10,19,18,0)');g.addColorStop(1,'rgba(10,19,18,.72)');ctx.fillStyle=g;ctx.fillRect(0,800,1600,100);
  ctx.fillStyle='#f7f5e9';ctx.textAlign='left';ctx.font='500 18px Arial';ctx.fillText('3D EXPLANATORY RECONSTRUCTION · NOT FOOTAGE OF A NAMED FAB',64,853);ctx.textAlign='right';ctx.fillText(s.set==='hall'?'MODERN 300 mm FAB':s.set==='process'?'MECHANISM STUDY':'FACILITY / PROCESS STUDY',1536,853);ctx.restore();
 }
 function draw(t){
  t=Math.max(0,Math.min(timeline.duration_seconds||timeline.duration,t));size();
  const s=shots.find(s=>t>=s.t0&&t<s.t1)||shots.at(-1),u=clamp((t-s.t0)/(s.t1-s.t0));
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(s.kind!=='spatial'){state=reporting.draw(s,u,t);ctx.drawImage(reportingCanvas,0,0,canvas.width,canvas.height);return state;}
  Object.entries(sets).forEach(([id,set])=>set.root.visible=id===s.set);
  const p=eventProgress(s,t),f=sets[s.set].frame({act:s.act,p,view:s.view,shot:s.view,u,t});
  if(!f?.position?.every(Number.isFinite)||!f?.target?.every(Number.isFinite)||!Number.isFinite(f.fov))throw new Error('Invalid authored R8 camera '+s.id);
  const pos=s.camera?.position||f.position,target=s.camera?.target||f.target;
  camera.position.fromArray(pos);camera.lookAt(new T.Vector3(...target));camera.fov=s.camera?.fov||f.fov;lighting(s,{...f,target});camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const before=performance.now();renderer.render(scene,camera);const renderMs=performance.now()-before;ctx.drawImage(picture,0,0,canvas.width,canvas.height);overlay(s,u,f);
  state={id:s.id,shotId:s.id,rowId:s.rowId,kind:'3D · '+s.set,assetIds:[],shot:s,backend,event:s.event,eventProgress:p,camera:{position:pos,target,fov:camera.fov},detail:f.detail,action:f.state,time:t,local:u,renderMs,renderResolution:[picture.width,picture.height],triangles:renderer.info.render.triangles};lastSpatial=state;lastSet=s.set;return state;
 }
 return {draw,shots,backend,sets,get state(){return state;},get lastSpatial(){return lastSpatial;},dispose(){renderer.dispose();environment?.dispose();pmrem?.dispose();}};
}
