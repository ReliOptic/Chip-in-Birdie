/** Node Canvas checks only. Not a browser/GPU/player/listening approval. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {createSoftwareRenderer} from './software-renderer.mjs';
import {createWorlds} from './worlds.mjs';
import {createMechanisms} from './mechanisms.mjs';
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
const [assetsDir,outDir]=process.argv.slice(2);
if(!assetsDir||!outDir)throw new Error('Usage: node qa-software.mjs ASSETS_DIR OUTPUT_DIR');
fs.mkdirSync(outDir,{recursive:true});
const threeURL='data:text/javascript;base64,'+fs.readFileSync(path.join(assetsDir,'vendor/three.module.js')).toString('base64');
const T=await import(threeURL);
globalThis.document={createElement(tag){if(tag!=='canvas')throw new Error('Canvas only');return createCanvas(1,1);}};
const canvas=createCanvas(960,540),renderer=createSoftwareRenderer(T,{canvas,quality:'balanced'});
renderer.setSize(960,540);renderer.toneMappingExposure=1.03;
const scene=new T.Scene();scene.background=new T.Color('#0d151b');scene.fog=new T.Fog('#0d151b',22,50);
scene.add(new T.HemisphereLight(0xc7dbe7,0x3c3025,1.3));
const key=new T.DirectionalLight(0xffe1b4,3.3);key.position.set(-4,9,6);key.castShadow=true;key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=10;key.shadow.camera.bottom=-10;key.shadow.camera.near=.1;key.shadow.camera.far=40;scene.add(key,key.target);
const rim=new T.DirectionalLight(0x9dbbd3,2.4);rim.position.set(4,6,-5);scene.add(rim);
const fill=new T.DirectionalLight(0xc4e1e2,.9);fill.position.set(3,2,5);scene.add(fill);
const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0x18242b,roughness:.86}));floor.rotation.x=-Math.PI/2;floor.position.y=-.23;floor.receiveShadow=true;scene.add(floor);
const worlds={...createWorlds(T),...createMechanisms(T)};
// Import the exact vendored loader with its actual inlined utility dependency.
// This is Node module resolution, not browser automation or a rendering flag.
function inlineThree(source){return source.replace(/from '(data:text\/javascript;base64,([^']+))'/g,(_,url,data)=>"from 'data:text/javascript;base64,"+Buffer.from(inlineThree(Buffer.from(data,'base64').toString())).toString('base64')+"'").replaceAll("from 'three'","from '"+threeURL+"'");}
const {GLTFLoader}=await import('data:text/javascript;base64,'+Buffer.from(inlineThree(fs.readFileSync(path.join(assetsDir,'vendor/GLTFLoader.js'),'utf8'))).toString('base64'));
const glb=fs.readFileSync(path.join(assetsDir,'scene.glb'));
const gltf=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
const mixer=new T.AnimationMixer(gltf.scene);for(const clip of gltf.animations)mixer.clipAction(clip).play();
gltf.scene.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const name=o.material.name;if(/Silicon thin film/.test(name)){o.material.color.set('#365473');o.material.roughness=.26;o.material.metalness=.75;}if(/Brushed stainless/.test(name)){o.material.color.set('#6c808c');o.material.roughness=.37;}if(/white|porcelain/i.test(name))o.material.roughness=.52;});
worlds.fab={root:gltf.scene,update(u){mixer.setTime(u*5.95);},cameraAt(){gltf.scene.updateMatrixWorld(true);const p=new T.Vector3(),q=new T.Quaternion();gltf.cameras[0].getWorldPosition(p);gltf.cameras[0].getWorldQuaternion(q);return{position:p.toArray(),target:p.clone().add(new T.Vector3(0,0,-1).applyQuaternion(q)).toArray(),fov:gltf.cameras[0].fov};}};
for(const w of Object.values(worlds)){w.root.visible=false;scene.add(w.root);w.root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}
const camera=new T.PerspectiveCamera(37,16/9,.03,90);
const cases=[['design','drawing',.5],['archive','partners',.5],['boundary','close',.8],['layers','etch',.8],['testing','probe',.65],['capacity','growth',.8],['capacity','queue',.65],['return','final',.5],['fab','handoff',.5]];
function renderCase([name,phase,u]){
  for(const [id,w]of Object.entries(worlds))w.root.visible=id===name;
  const w=worlds[name];w.update(u,phase);
  floor.visible=name!=='fab';
  const c=w.cameraAt?.(u,phase,name+'-'+phase);
  if(c){camera.position.fromArray(c.position);camera.lookAt(...c.target);camera.fov=c.fov;}
  else{const q=u*u*(3-2*u);camera.position.fromArray(w.camera.from).lerp(new T.Vector3(...w.camera.to),q);camera.lookAt(...w.camera.target);camera.fov=w.camera.fov;}
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const start=performance.now();renderer.render(scene,camera);const renderMs=performance.now()-start;
  const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  const sha=crypto.createHash('sha256').update(data).digest('hex');
  return{name,phase,u,sha,renderMs,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,submittedTriangles:renderer.info.software.submittedTriangles,shadowTriangles:renderer.info.software.shadowTriangles};
}
const samples=[];
for(const spec of cases){const r=renderCase(spec);samples.push(r);fs.writeFileSync(path.join(outDir,r.name+'-'+r.phase+'.png'),canvas.toBuffer('image/png'));console.log(JSON.stringify(r));}
let orderIndependent=true;const warm=[];
for(let i=cases.length-1;i>=0;i--){const check=renderCase(cases[i]);warm.push({name:check.name,phase:check.phase,renderMs:check.renderMs});if(check.sha!==samples[i].sha)orderIndependent=false;}
for(let i=0;i<4;i++){const check=renderCase(cases.at(-1));warm.push({name:check.name,phase:check.phase,renderMs:check.renderMs});}
const gl=renderer.getContext(),readback=new Uint8Array(960*540*4);gl.readPixels(0,0,960,540,gl.RGBA,gl.UNSIGNED_BYTE,readback);
const buf=canvas.getContext('2d').getImageData(0,0,960,540).data;
let readbackMatch=true;for(let row=0;row<540;row++)for(let col=0;col<960*4;col++)if(buf[(539-row)*960*4+col]!==readback[row*960*4+col]){readbackMatch=false;break;}
const playbackSize=[];renderer.setSize(800,450);
for(const spec of cases){const r=renderCase(spec);playbackSize.push({name:r.name,phase:r.phase,renderMs:r.renderMs});}
// Small semantic checks prevent a stable but flat/static implementation from
// passing merely by returning the same checksum. No extra PNGs are generated.
const small=createCanvas(160,90),sr=createSoftwareRenderer(T,{canvas:small});sr.setSize(160,90);sr.shadowMap.enabled=false;
const ss=new T.Scene();ss.background=new T.Color(0);const sc=new T.PerspectiveCamera(45,16/9,.1,20);sc.position.z=3;sc.lookAt(0,0,0);
const front=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({color:0xff0000}));front.position.z=.1;
const back=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({color:0x0000ff}));const group=new T.Group();group.add(front,back);ss.add(group);
const rgb=(x=80,y=45)=>Array.from(small.getContext('2d').getImageData(x,y,1,1).data).slice(0,3);
sr.render(ss,sc);let p=rgb();const depthOcclusion=p[0]>150&&p[2]<5;
front.position.x=4;sr.render(ss,sc);p=rgb();const actualTransform=p[2]>150&&p[0]<5;
group.visible=false;sr.render(ss,sc);const inheritedVisibility=rgb().every(v=>v===0);ss.remove(group);
const im=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0x00ff00}),2),imx=new T.Matrix4();
for(let i=0;i<2;i++){imx.makeScale(.7,.7,.7);imx.setPosition(i? .6:-.6,0,0);im.setMatrixAt(i,imx);}ss.add(im);sr.render(ss,sc);
const instancePixels=[-.6,.6].map(x=>{const v=new T.Vector3(x,0,0).project(sc);return rgb(Math.floor((v.x*.5+.5)*160),45);});
const instancing=instancePixels.every(p=>p[1]>150&&p[0]<5&&p[2]<5);ss.remove(im);
const texCanvas=createCanvas(4,4),tc=texCanvas.getContext('2d');for(const [x,y,color]of[[0,0,'red'],[2,0,'lime'],[0,2,'blue'],[2,2,'white']]){tc.fillStyle=color;tc.fillRect(x,y,2,2);}
const texturePlane=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({map:new T.CanvasTexture(texCanvas)}));ss.add(texturePlane);sr.render(ss,sc);
const top=rgb(65,25),bottom=rgb(65,65),textureOrientation=top[0]>150&&top[2]<5&&bottom[2]>150&&bottom[0]<5;ss.remove(texturePlane);
const nearGeometry=new T.BufferGeometry();nearGeometry.setAttribute('position',new T.Float32BufferAttribute([-.4,-.4,2,.4,-.4,2,0,.4,3.05],3));
ss.add(new T.Mesh(nearGeometry,new T.MeshBasicMaterial({color:0xff0000,side:T.DoubleSide})));sr.render(ss,sc);const nearClip=sr.info.render.triangles>0;
const semantics={depthOcclusion,actualTransform,inheritedVisibility,instancing,textureOrientation,nearClip,explicitSoftwareLabel:sr.isSoftwareRenderer&&sr.getContext().getParameter(sr.getContext().RENDERER).includes('not WebGL')};
const sourceHashes=Object.fromEntries(['software-renderer.mjs','worlds.mjs','mechanisms.mjs'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(new URL(file,import.meta.url))).digest('hex')]));
const report={scope:'Actual Node @napi-rs/canvas pixels from the CPU 3D renderer. NOT browser/WebGL/audio/player/release verification.',resolution:[960,540],orderIndependent,readbackMatch,semantics,sourceHashes,backend:gl.getParameter(gl.RENDERER),samples,warm,playbackSize:{resolution:[800,450],samples:playbackSize},knownLimits:['Approximate lighting instead of full PBR','No PMREM/transmission/skinning/custom shaders','Node timings are not browser or GPU performance']};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2)+'\n');
if(!orderIndependent||!readbackMatch||samples.some(x=>!x.triangles)||Object.values(semantics).some(x=>!x))process.exitCode=1;
