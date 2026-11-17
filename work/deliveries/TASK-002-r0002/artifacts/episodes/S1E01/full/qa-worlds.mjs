/**
 * Reusable producer-side CPU model QA. No browser, WebGL context, GPU pixels,
 * player playback, sound, factual review or release approval is exercised here.
 *
 * node qa-worlds.mjs --assets RECOVERED_ASSETS --out results.json
 * Optional: --fab-export /absolute/path/fab-handoff.json (Blender inspection input).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createWorlds} from './worlds.mjs';
import {createMechanisms} from './mechanisms.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const args={};
for(let i=2;i<process.argv.length;i+=2){
  assert(process.argv[i].startsWith('--')&&process.argv[i+1], 'Expected --option value');
  args[process.argv[i].slice(2)]=process.argv[i+1];
}
assert(args.assets, 'Usage: node qa-worlds.mjs --assets RECOVERED_ASSETS [--out results.json]');
const assets=path.resolve(args.assets), out=path.resolve(args.out||path.join(here,'results.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p,'utf8');
const inputPaths={script:path.join(here,'script.json'),worlds:path.join(here,'worlds.mjs'),
  mechanisms:path.join(here,'mechanisms.mjs'),film:path.join(here,'film.mjs'),
  three:path.join(assets,'vendor/three.module.js'),gltfLoader:path.join(assets,'vendor/GLTFLoader.js'),
  geometryUtils:path.join(assets,'vendor/BufferGeometryUtils.js'),scene:path.join(assets,'scene.glb'),
  qa:fileURLToPath(import.meta.url)};
const inputHashes=Object.fromEntries(Object.entries(inputPaths).map(([k,p])=>[k,sha(fs.readFileSync(p))]));
const script=JSON.parse(read(inputPaths.script)), film=read(inputPaths.film);
const report={schema:'cib-cpu-world-qa-v1',revision:script.revision,status:'RUNNING',
  scope:'Producer-side CPU geometry, transforms, material state and production camera determinism only',
  notValidated:['Browser/WebGL execution','Rendered pixels or shader fidelity','Playback and audio',
    'Human viewing quality','Historical/scientific accuracy','Asset rights','Independent release approval'],
  browserUsed:false,webglUsed:false,gpuPixelComparison:false,releaseApproval:false,
  inputs:inputHashes,runtime:{node:process.version,platform:process.platform,arch:process.arch},
  samples:[0,.2,.5,.8,1],failures:[],cases:[]};
const started=Date.now();
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
// A real CPU canvas is used only for authored model label textures. This is not
// a DOM, browser emulation, WebGL substitute or evidence of player execution.
globalThis.document={createElement(tag){assert.equal(tag,'canvas');return createCanvas(1,1)}};
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const threeUri=uri(fs.readFileSync(inputPaths.three));
const T=await import(threeUri);
report.runtime.threeRevision=T.REVISION;
report.runtime.canvas='@napi-rs/canvas; model textures only';

// Recovered GLTFLoader has an embedded BufferGeometryUtils import. Bind both
// it and relative vendor imports to exactly the same recovered Three module.
const moduleCache=new Map();
function vendorModule(code,base){
  const key=sha(code);if(moduleCache.has(key))return moduleCache.get(key);
  const rewritten=String(code).replace(/(from\s*)(['"])([^'"]+)\2/g,(all,lead,q,spec)=>{
    if(spec==='three')return lead+q+threeUri+q;
    if(spec.startsWith('data:text/javascript;base64,')){
      const child=Buffer.from(spec.slice(spec.indexOf(',')+1),'base64').toString('utf8');
      return lead+q+vendorModule(child,base)+q;
    }
    if(spec.startsWith('./')||spec.startsWith('../')){
      const child=path.resolve(base,spec);
      assert(child.startsWith(assets+path.sep),'Vendor import escapes supplied assets');
      return lead+q+vendorModule(read(child),path.dirname(child))+q;
    }
    return all;
  });
  const result=uri(rewritten);moduleCache.set(key,result);return result;
}
const {GLTFLoader}=await import(vendorModule(read(inputPaths.gltfLoader),path.dirname(inputPaths.gltfLoader)));
const {mergeGeometries}=await import(vendorModule(read(inputPaths.geometryUtils),path.dirname(inputPaths.geometryUtils)));
const glb=fs.readFileSync(inputPaths.scene);
assert.equal(glb.toString('ascii',0,4),'glTF');
const gltfJSON=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString('utf8'));
assert((gltfJSON.buffers||[]).every(x=>!x.uri),'QA does not fetch external buffers');
assert(!(gltfJSON.images||[]).length,'This CPU harness does not emulate GLTF image loading');
class LocalGLTFLoader extends GLTFLoader {
  async loadAsync(request){
    assert.equal(request,'qa:local-scene');
    return this.parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
  }
}
// Execute these exact checked-in production functions, not a parallel copy of
// their animation/merge/material/camera implementation. Only the file transport
// is adapted: the real GLTF parser receives the supplied local binary buffer.
function extract(start,end){
  const a=film.indexOf(start),b=film.indexOf(end,a+start.length);
  assert(a>=0&&b>a, 'Production function boundaries changed: '+start);
  return film.slice(a,b);
}
const loadFabSource=extract('async function loadFab(){','function resize(){');
const cameraSource=extract('function cameraFor(w,shot,u){','function setCaption(');
report.productionFunctions={loadFab_sha256:sha(loadFabSource),cameraFor_sha256:sha(cameraSource),
  loading:'Actual GLTFLoader.parseAsync; local binary transport; no network',
  fab:'Actual production material edits, static mesh merging, AnimationMixer.setTime and cameraFor'};
const makeHost=new Function('T','GLTFLoader','mergeGeometries','DATA','worlds','scene','camera',
  `const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
   let fabMixer,fabCamera,fabRoot;
   ${loadFabSource}\n${cameraSource}
   return {loadFab,cameraFor,fabState:()=>({time:fabMixer.time,timeScale:fabMixer.timeScale,
     actions:fabMixer._actions.map(a=>({clip:a.getClip().name,time:a.time,enabled:a.enabled,
       paused:a.paused,weight:a.getEffectiveWeight(),timeScale:a.getEffectiveTimeScale(),
       loop:a.loop,repetitions:a.repetitions,loopCount:a._loopCount}))})};`);
async function construct(){
  const worlds={...createWorlds(T),...createMechanisms(T)},scene=new T.Scene();
  const camera=new T.PerspectiveCamera(37,16/9,.03,90);
  for(const [name,w]of Object.entries(worlds)){
    w.root.name='world-'+name;w.root.visible=false;scene.add(w.root);
    w.root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false}});
  }
  const host=makeHost(T,LocalGLTFLoader,mergeGeometries,{assets:{scene:'qa:local-scene'}},worlds,scene,camera);
  await host.loadFab();
  return {worlds,scene,camera,host};
}

const finiteArrays=new Set();
function typed(a){
  const hash=sha(Buffer.from(a.buffer,a.byteOffset,a.byteLength));
  if(!finiteArrays.has(hash)){
    for(const n of a)assert(Number.isFinite(n),'Non-finite numeric array');
    finiteArrays.add(hash);
  }
  return {type:a.constructor.name,length:a.length,sha256:hash};
}
function exactNumbers(a){return typed(new Float64Array(a))}
function plain(v){
  if(v===undefined)return {type:'undefined'};
  if(typeof v==='number')return Object.is(v,-0)?'-0':Number.isFinite(v)?v:String(v);
  if(v===null||typeof v==='string'||typeof v==='boolean')return v;
  if(typeof v==='function')return {function:v.name};
  if(ArrayBuffer.isView(v))return typed(v);
  if(Array.isArray(v))return v.map(plain);
  if(v.isColor||v.isVector2||v.isVector3||v.isVector4||v.isQuaternion||v.isMatrix3||v.isMatrix4)
    return {type:v.constructor.name,values:plain(v.toArray())};
  if(v.isPlane)return {normal:plain(v.normal),constant:plain(v.constant)};
  return Object.fromEntries(Object.keys(v).sort().filter(k=>!['uuid','id','version','_listeners'].includes(k))
    .map(k=>[k,plain(v[k])]));
}
function digest(v){return sha(JSON.stringify(v))}
function snapshot(env,c){
  const w=env.worlds[c.world];assert(w,'Missing world: '+c.world);
  for(const [name,item]of Object.entries(env.worlds))item.root.visible=name===c.world;
  w.update(c.u,c.phase);env.scene.updateMatrixWorld(true);
  env.host.cameraFor(w,{id:c.shot,world:c.world,phase:c.phase},c.u);
  const geometryCache=new Map(),materialCache=new Map(),textureCache=new Map();
  function texture(t){
    if(textureCache.has(t))return textureCache.get(t);
    const image=t.image;let pixels=null;
    if(image?.getContext){
      const bytes=image.getContext('2d').getImageData(0,0,image.width,image.height).data;
      pixels={width:image.width,height:image.height,rgba_sha256:sha(Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength))};
    }else if(image?.data)pixels={width:image.width,height:image.height,data:typed(image.data)};
    else assert(!image,'Unhandled non-canvas texture source');
    const fields=['name','mapping','channel','wrapS','wrapT','magFilter','minFilter','anisotropy',
      'format','type','offset','repeat','center','rotation','matrix','matrixAutoUpdate',
      'generateMipmaps','premultiplyAlpha','flipY','unpackAlignment','colorSpace'];
    const data={pixels,...Object.fromEntries(fields.map(k=>[k,plain(t[k])]))};
    textureCache.set(t,data);return data;
  }
  function material(m){
    if(Array.isArray(m))return m.map(material);
    if(materialCache.has(m))return materialCache.get(m);
    const data=Object.fromEntries(Object.keys(m).sort()
      .filter(k=>!['id','uuid','version','_listeners'].includes(k))
      .map(k=>[k,m[k]?.isTexture?texture(m[k]):plain(m[k])]));
    materialCache.set(m,data);return data;
  }
  const attribute=a=>({itemSize:a.itemSize,count:a.count,normalized:a.normalized,
    gpuType:a.gpuType,usage:a.usage,array:typed(a.isInterleavedBufferAttribute?a.data.array:a.array),
    ...(a.isInterleavedBufferAttribute?{stride:a.data.stride,offset:a.offset}:{})});
  function geometry(g){
    if(geometryCache.has(g))return geometryCache.get(g);
    const data={type:g.type,drawRange:plain(g.drawRange),groups:plain(g.groups),
      index:g.index?attribute(g.index):null,
      attributes:Object.fromEntries(Object.entries(g.attributes).sort().map(([k,v])=>[k,attribute(v)])),
      morphAttributes:Object.fromEntries(Object.entries(g.morphAttributes).sort().map(([k,v])=>[k,v.map(attribute)])),
      morphTargetsRelative:g.morphTargetsRelative};
    geometryCache.set(g,data);return data;
  }
  const objects=[];let visibleMeshObjects=0,visibleInstances=0,triangles=0,submittedTriangles=0,totalMeshObjects=0;
  function visit(o,where,parentVisible){
    const visible=parentVisible&&o.visible, record={path:where,type:o.type,name:o.name,visible:o.visible,
      effectiveVisible:visible,position:exactNumbers(o.position.toArray()),quaternion:exactNumbers(o.quaternion.toArray()),
      scale:exactNumbers(o.scale.toArray()),rotationOrder:o.rotation.order,
      matrix:exactNumbers(o.matrix.elements),matrixWorld:exactNumbers(o.matrixWorld.elements),
      matrixAutoUpdate:o.matrixAutoUpdate,matrixWorldAutoUpdate:o.matrixWorldAutoUpdate,
      layers:o.layers.mask,renderOrder:o.renderOrder,frustumCulled:o.frustumCulled,
      castShadow:o.castShadow,receiveShadow:o.receiveShadow,userData:plain(o.userData)};
    if(o.geometry)record.geometry=geometry(o.geometry);
    if(o.material)record.material=material(o.material);
    if(o.isInstancedMesh){record.count=o.count;record.instanceMatrix=attribute(o.instanceMatrix);
      record.instanceColor=o.instanceColor?attribute(o.instanceColor):null;}
    if(o.morphTargetInfluences)record.morphTargetInfluences=exactNumbers(o.morphTargetInfluences);
    if(o.isCamera)record.camera={fov:o.fov,aspect:o.aspect,near:o.near,far:o.far,
      projectionMatrix:exactNumbers(o.projectionMatrix.elements)};
    if(o.isMesh){
      totalMeshObjects++;
      const matVisible=(Array.isArray(o.material)?o.material:[o.material]).some(m=>m.visible&&m.opacity>0);
      if(visible&&matVisible){
        const g=o.geometry,available=g.index?g.index.count:g.attributes.position.count;
        const perMesh=Math.max(0,Math.min(available-g.drawRange.start,g.drawRange.count))/3;
        const count=o.isInstancedMesh?o.count:1;
        let nondegenerate=0;
        for(let i=0;i<count;i++){
          const m=o.matrixWorld.clone();if(o.isInstancedMesh){const im=new T.Matrix4();o.getMatrixAt(i,im);m.multiply(im)}
          if(Math.abs(m.determinant())>1e-15)nondegenerate++;
        }
        if(nondegenerate)visibleMeshObjects++;
        visibleInstances+=nondegenerate;triangles+=perMesh*nondegenerate;submittedTriangles+=perMesh*count;
      }
    }
    objects.push(record);o.children.forEach((child,i)=>visit(child,where+'/'+i,visible));
  }
  visit(w.root,'root',true);
  const state=plain(w.state?w.state():c.world==='fab'?env.host.fabState():null);
  const camera={position:exactNumbers(env.camera.position.toArray()),quaternion:exactNumbers(env.camera.quaternion.toArray()),
    matrixWorld:exactNumbers(env.camera.matrixWorld.elements),projectionMatrix:exactNumbers(env.camera.projectionMatrix.elements),
    fov:env.camera.fov,aspect:env.camera.aspect,near:env.camera.near,far:env.camera.far};
  const metadata=plain({label:w.label,disclosure:w.disclosure,modelNotes:w.modelNotes,anchors:w.anchors,camera:w.camera});
  const componentHashes={objects:digest(objects),state:digest(state),camera:digest(camera),metadata:digest(metadata)};
  return {hash:digest(componentHashes),componentHashes,objectHashes:objects.map(o=>({path:o.path,name:o.name,hash:digest(o)})),
    metrics:{totalMeshObjects,estimatedVisibleDrawObjects:visibleMeshObjects,visibleNondegenerateInstances:visibleInstances,
      visibleTriangleInstances:triangles,submittedTriangleInstancesUpperBound:submittedTriangles}};
}

function contacts(env){
  const w=env.worlds.testing,pads=w.root.getObjectByName('Four conductive probe pads per illustrative die');
  const dies=w.root.getObjectByName('Individual die surfaces'),needles=[];
  w.root.traverse(o=>{if(o.name==='Contact needle')needles.push(o)});
  assert.equal(needles.length,4);assert.equal(pads.count,dies.count*4);assert(pads.material.metalness>.5);
  let maximumError=0,checks=0;const touchedDies=new Set(),visits=[];
  for(let k=0;k<7;k++){
    const u=(k+.6)/7;w.update(u,'probe');w.root.updateMatrixWorld(true);
    const matches=[];
    for(const needle of needles){
      let minY=Infinity;const attr=needle.geometry.attributes.position;
      for(let j=0;j<attr.count;j++)minY=Math.min(minY,attr.getY(j));
      const tip=needle.localToWorld(new T.Vector3(0,minY,0));
      let best=Infinity,bestIndex=-1;
      for(let j=0;j<pads.count;j++){
        const instance=new T.Matrix4();pads.getMatrixAt(j,instance);
        const top=new T.Vector3(0,.5,0).applyMatrix4(instance).applyMatrix4(pads.matrixWorld);
        const err=tip.distanceTo(top);if(err<best){best=err;bestIndex=j}
      }
      assert(best<1e-6,'Needle tip is not on its conductive pad: '+best);
      maximumError=Math.max(maximumError,best);matches.push(bestIndex);checks++;
    }
    assert.equal(new Set(matches).size,4,'Needles do not contact four distinct pads');
    const dieIndices=new Set(matches.map(i=>Math.floor(i/4)));
    assert.equal(dieIndices.size,1,'Needles span different dies');
    touchedDies.add([...dieIndices][0]);visits.push({u,padIndices:matches});
  }
  assert.equal(touchedDies.size,7);
  w.update(.5,'results');assert.equal(w.disclosure,'Illustrative test map · not measured data');
  assert.equal(w.state().measuredData,false);assert.equal(w.state().numericalYieldClaim,false);
  assert.equal(w.state().maximumDemonstratedContacts,7);
  assert(w.state().mapSource.includes('not acquired'));
  assert(env.worlds.layers.disclosure.includes('Optics and recipe omitted'));
  return {status:'PASS',needles:4,conductivePads:pads.count,illustrativeDies:dies.count,
    padsPerDie:4,demonstratedContacts:7,checkedTipPadPairs:checks,maximumCenterError:maximumError,
    tolerance:1e-6,visits,measuredData:false,
    limitation:'Geometric tip-to-pad coincidence only; no electrical simulation or measured yield'};
}

function exportFab(env,filename){
  const c={world:'fab',phase:'handoff',shot:'fab-handoff',u:.65};snapshot(env,c);
  const meshes=[];
  env.worlds.fab.root.traverse(o=>{
    if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(!p.visible)return;
    assert(!Array.isArray(o.material),'Fab export requires one material per merged mesh');
    const g=o.geometry,vertices=[];
    for(let i=0;i<g.attributes.position.count;i++){
      const v=new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(o.matrixWorld);
      vertices.push([v.x,-v.z,v.y]);
    }
    const idx=g.index?Array.from(g.index.array):vertices.map((_,i)=>i),faces=[];
    for(let i=0;i<idx.length;i+=3)faces.push(idx.slice(i,i+3));
    const m=o.material;
    meshes.push({vertices,faces,uv:g.attributes.uv?Array.from(g.attributes.uv.array):null,
      material:{color:m.color.toArray(),roughness:m.roughness??.5,metalness:m.metalness??0,
        opacity:m.opacity,texture:null,emissive:m.emissive?.toArray()||[0,0,0],emissiveIntensity:m.emissiveIntensity||0}});
  });
  const position=env.camera.position.clone(),target=position.clone().add(env.camera.getWorldDirection(new T.Vector3()).multiplyScalar(4));
  const xyz=v=>[v.x,-v.z,v.y];
  const data={scope:'Exact production CPU geometry/camera export for Blender inspection; NOT WebGL or shader validation',
    ...c,inputs:inputHashes,camera:{position:xyz(position),target:xyz(target),fov:env.camera.fov},meshes};
  fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,JSON.stringify(data));
  return {path:filename,sha256:sha(fs.readFileSync(filename)),meshes:meshes.length,
    triangles:meshes.reduce((n,m)=>n+m.faces.length,0),camera:data.camera};
}

try{
  const beats=[];
  for(const row of script.sentences){
    let p=beats.at(-1);
    if(!p||p.shot!==row.shot||p.world!==row.world||p.phase!==row.phase)
      beats.push(p={beat:beats.length+1,shot:row.shot,world:row.world,phase:row.phase,sentences:[]});
    p.sentences.push(row.id);
  }
  const cases=beats.flatMap(b=>report.samples.map(u=>({...b,u,key:`${b.beat}:${b.world}:${b.phase}:${u}`})));
  const env=await construct();
  for(const c of cases)assert(env.worlds[c.world],'Script world is not implemented: '+c.world);
  report.coverage={scriptSentences:script.sentences.length,phaseAwareBeats:beats.length,
    namedShots:new Set(beats.map(b=>b.shot)).size,uniqueWorldPhases:new Set(beats.map(b=>b.world+':'+b.phase)).size,
    worlds:[...new Set(beats.map(b=>b.world))],cases:cases.length,
    strategies:['Script-order baseline','Exact reverse revisit in the same objects',
      'Freshly reconstructed worlds, deterministic shuffled cross-world visits'],
    drawCountScope:'CPU mesh/material visibility and non-degenerate instances, before camera culling; not measured renderer draw calls'};
  const baseline=new Map();
  for(const c of cases){const snap=snapshot(env,c);baseline.set(c.key,snap);report.cases.push({...c,...snap});}
  function compare(c,snap,strategy){
    const expected=baseline.get(c.key);
    if(snap.hash!==expected.hash){
      report.failures.push({case:c.key,strategy,
        differentComponents:Object.keys(expected.componentHashes).filter(k=>expected.componentHashes[k]!==snap.componentHashes[k]),
        differentObjects:expected.objectHashes.filter((o,i)=>o.hash!==snap.objectHashes[i]?.hash).slice(0,8),
        expected:expected.hash,actual:snap.hash});
    }
  }
  for(const c of [...cases].reverse())compare(c,snapshot(env,c),'reverse-revisit');
  const fresh=await construct();
  for(const c of [...cases].sort((a,b)=>sha(a.key).localeCompare(sha(b.key))))
    compare(c,snapshot(fresh,c),'fresh-worlds-shuffled-visits');
  report.probeContacts=contacts(env);
  report.worldBudgets=Object.fromEntries(report.coverage.worlds.map(world=>{
    const rows=report.cases.filter(c=>c.world===world);
    return [world,{samples:rows.length,phases:[...new Set(rows.map(c=>c.phase))],
      maxVisibleDrawObjects:Math.max(...rows.map(c=>c.metrics.estimatedVisibleDrawObjects)),
      maxVisibleTriangleInstances:Math.max(...rows.map(c=>c.metrics.visibleTriangleInstances)),
      maxSubmittedTriangleInstancesUpperBound:Math.max(...rows.map(c=>c.metrics.submittedTriangleInstancesUpperBound))}];
  }));
  // Keep compact reproducible fingerprints, not an entire second scene archive.
  for(const row of report.cases)delete row.objectHashes;
  if(args['fab-export'])report.fabInspectionExport=exportFab(env,path.resolve(args['fab-export']));
  for(const [key,p]of Object.entries(inputPaths))
    assert.equal(sha(fs.readFileSync(p)),inputHashes[key],'Input changed during run: '+key);
  report.status=report.failures.length?'FAIL':'PASS';
  report.exactComparisons=cases.length*2;
}catch(error){
  report.status='FAIL';report.failures.push({error:error.stack||String(error)});
}
report.elapsedSeconds=(Date.now()-started)/1000;
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,scope:report.scope,coverage:report.coverage,
  exactComparisons:report.exactComparisons,failures:report.failures,probeContacts:report.probeContacts,
  worldBudgets:report.worldBudgets,fabInspectionExport:report.fabInspectionExport,
  output:out,output_sha256:sha(fs.readFileSync(out)),elapsedSeconds:report.elapsedSeconds},null,2));
if(report.status!=='PASS')process.exitCode=1;
