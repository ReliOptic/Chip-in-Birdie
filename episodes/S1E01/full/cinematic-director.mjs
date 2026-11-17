import * as T from 'three';
import {createStoryKit} from './story-kit.mjs';
import {createPCSet} from './story-pc.mjs';
import {createFactorySet} from './story-factory.mjs';
import {createLabSet} from './story-lab.mjs';
import {createDeskSet} from './story-desk.mjs';
import {createSoftwareRenderer} from './software-renderer.mjs';
import {createArchiveCinema} from './archive-cinema.mjs';
import {buildCinematicShots,eventProgress} from './cinematic-shotplan.mjs';

export function createCinematicFilm({canvas,images,script,timeline,forceSoftware=false}){
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Film presentation canvas unavailable');
  const shots=buildCinematicShots(script,timeline);
  const archiveCanvas=document.createElement('canvas');archiveCanvas.width=canvas.width;archiveCanvas.height=canvas.height;
  const archive=createArchiveCinema({canvas:archiveCanvas,images,script,timeline,editShots:shots.filter(s=>s.kind!=='spatial')});
  let picture=document.createElement('canvas'),renderer,backend;
  if(!forceSoftware){
    const gl=picture.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
    if(gl){renderer=new T.WebGLRenderer({canvas:picture,context:gl,antialias:true,alpha:false});backend='WebGL2 · Three.js';renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.outputColorSpace=T.SRGBColorSpace;}
  }
  if(!renderer){picture=document.createElement('canvas');renderer=createSoftwareRenderer(T,{canvas:picture});backend='CPU 3D · compatibility renderer';}
  renderer.shadowMap.enabled=true;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,16/9,.008,80),kit=createStoryKit(T);
  const sets={pc:createPCSet(T,kit),factory:createFactorySet(T,kit),lab:createLabSet(T,kit),desk:createDeskSet(T,kit)};
  Object.values(sets).forEach(set=>{set.root.visible=false;scene.add(set.root);});
  const ambient=new T.HemisphereLight('#e8efea','#5c625a',1.35),key=new T.DirectionalLight('#f8dfba',3.2),fill=new T.DirectionalLight('#afcee1',1.3);
  key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.00012;key.shadow.normalBias=.012;key.shadow.radius=3;
  fill.position.set(2,2.5,-1);scene.add(ambient,key,key.target,fill);
  let state=null,sizeKey='',lastSpatial=null;
  const clamp=v=>Math.max(0,Math.min(1,v));
  function updateSize(){
    const resolution=canvas.width+'x'+canvas.height;if(resolution===sizeKey)return;
    sizeKey=resolution;archiveCanvas.width=canvas.width;archiveCanvas.height=canvas.height;
    // Software compatibility is deliberately capped; it is not a GPU quality mode.
    const width=renderer.isSoftwareRenderer?Math.min(800,canvas.width):Math.min(1920,canvas.width);
    renderer.setPixelRatio(1);renderer.setSize(width,Math.round(width*9/16),false);
  }
  function light(set,act,look){
    scene.background=new T.Color(look.background||'#253336');
    const macro=set==='lab'&&(act==='defect'||act==='repair');
    const factory=set==='factory',bounds=factory?12:macro?.8:3.0;
    key.position.set(...(factory?[-4,3.4,4.5]:macro?[-.65,1.25,.65]:[-2.2,3.1,1.6]));
    key.target.position.set(...(factory?[0,.8,-1]:macro?[0,.16,0]:[0,.9,0]));
    key.color.set(look.key||'#f6dbb1');fill.color.set(look.fill||'#b6d4e0');
    key.intensity=factory?1.8:macro?3.5:3.2;fill.intensity=macro?1.0:1.3;ambient.intensity=macro?.7:1.25;
    key.shadow.camera.left=-bounds;key.shadow.camera.right=bounds;key.shadow.camera.top=bounds;key.shadow.camera.bottom=-bounds;key.shadow.camera.near=.02;key.shadow.camera.far=factory?35:macro?5:16;key.shadow.camera.updateProjectionMatrix();
    scene.fog=new T.Fog(scene.background,factory?13:macro?3:5,factory?32:macro?8:15);
    renderer.toneMappingExposure=look.exposure||1;
  }
  function overlay(s,u,detail){
    const w=canvas.width,h=canvas.height;
    ctx.save();ctx.scale(w/1600,h/900);
    // Minimal film metadata, not a slideshow of statements over the 3D action.
    const grad=ctx.createLinearGradient(0,720,0,900);grad.addColorStop(0,'rgba(10,16,18,0)');grad.addColorStop(1,'rgba(10,16,18,.75)');ctx.fillStyle=grad;ctx.fillRect(0,720,1600,180);
    ctx.font='500 19px Arial, sans-serif';ctx.textAlign='left';ctx.fillStyle='#fff8e8';
    ctx.fillText(s.set==='lab'&&(s.act==='defect'||s.act==='repair')?'ILLUSTRATIVE MECHANISM · NOT A DIAGNOSIS OF THE NVIDIA INCIDENT':'3D EDITORIAL ILLUSTRATION · NOT HISTORICAL FOOTAGE',52,844);
    if(s.set==='pc'){ctx.textAlign='right';ctx.fillText('1990s PC · illustrative assembly',1548,844);ctx.textAlign='left';}
    if(s.heading){
      const a=s.ending?clamp(u*3):Math.min(1,clamp(u*7),clamp((1-u)*9));ctx.globalAlpha=a;
      const top=ctx.createLinearGradient(0,0,0,200);top.addColorStop(0,'rgba(8,15,16,.64)');top.addColorStop(1,'rgba(8,15,16,0)');ctx.fillStyle=top;ctx.fillRect(0,0,1600,200);
      let font=s.ending?63:40;ctx.font=`500 ${font}px Georgia, serif`;const max=1496,measured=ctx.measureText(s.heading).width;if(measured>max){font*=max/measured;ctx.font=`500 ${font}px Georgia, serif`;}
      ctx.fillStyle='#fffaf0';ctx.fillText(s.heading,52,s.ending?112:92);
      if(s.ending){ctx.font='400 19px Arial, sans-serif';ctx.fillText('CHIP IN BIRDIE  /  S1E01',55,154);}
    }
    ctx.restore();
  }
  function draw(t){
    const duration=timeline.duration_seconds||timeline.duration;t=Math.max(0,Math.min(duration,t));updateSize();
    const s=shots.find(s=>t>=s.t0&&t<s.t1)||shots.at(-1),u=clamp((t-s.t0)/(s.t1-s.t0));
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.imageSmoothingEnabled=true;
    if(s.kind!=='spatial'){
      archive.draw(t);ctx.drawImage(archiveCanvas,0,0,canvas.width,canvas.height);
      state={...archive.state,backend:'archive-canvas',shot:s};return state;
    }
    Object.entries(sets).forEach(([id,set])=>set.root.visible=id===s.set);
    const p=eventProgress(s,t),frame=sets[s.set].frame({act:s.act,p,shot:s.view,u,t});
    camera.position.fromArray(frame.position);camera.lookAt(new T.Vector3(...frame.target));camera.fov=frame.fov;camera.updateProjectionMatrix();light(s.set,s.act,frame.look||{});
    const started=performance.now();renderer.render(scene,camera);const renderMs=performance.now()-started;
    ctx.drawImage(picture,0,0,canvas.width,canvas.height);overlay(s,u,frame.detail);
    state={id:s.id,shotId:s.id,rowId:s.rowId,kind:'3D · '+s.set,assetIds:[],shot:s,backend,event:s.event,eventProgress:p,camera:{position:frame.position,target:frame.target,fov:frame.fov,lensMm:21/(2*Math.tan(frame.fov*Math.PI/360))},detail:frame.detail,action:frame.state,time:t,local:u,renderMs,renderResolution:[picture.width,picture.height],triangles:renderer.info.render.triangles};
    lastSpatial=state;return state;
  }
  return {draw,shots,backend,get state(){return state;},get lastSpatial(){return lastSpatial;},dispose(){renderer.dispose();}};
}
