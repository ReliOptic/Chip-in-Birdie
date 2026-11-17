/**
 * Reproducible R5 producer-side CPU state QA; never a browser/pixel approval.
 * node qa-worlds-r5.mjs --assets /path/to/assets [--out /path/to/report.json]
 * Executes every current script row at u=0,.25,.5,.75,1, then revisits in reverse,
 * interleaved order, and a fresh reconstruction. Model canvas textures use the
 * real @napi-rs/canvas implementation; no DOM or WebGL renderer is emulated.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createTransactions} from './business-transactions.mjs';
import {createEconomics} from './business-economics.mjs';
import {createInstitutions} from './business-institutions.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),args={};
for(let i=2;i<process.argv.length;i+=2){
  assert(['--assets','--out'].includes(process.argv[i])&&process.argv[i+1], 'Expected --assets PATH [--out PATH]');
  args[process.argv[i].slice(2)]=process.argv[i+1];
}
assert(args.assets,'Usage: node qa-worlds-r5.mjs --assets ASSETS [--out REPORT.json]');
const assets=path.resolve(args.assets),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const files={script:path.join(here,'script.json'),transactions:path.join(here,'business-transactions.mjs'),
  economics:path.join(here,'business-economics.mjs'),institutions:path.join(here,'business-institutions.mjs'),
  film:path.join(here,'film.mjs'),three:path.join(assets,'vendor/three.module.js'),
  gltfLoader:path.join(assets,'vendor/GLTFLoader.js'),geometryUtils:path.join(assets,'vendor/BufferGeometryUtils.js'),
  scene:path.join(assets,'scene.glb'),qa:fileURLToPath(import.meta.url)};
const read=p=>fs.readFileSync(p,'utf8'),source=Object.fromEntries(Object.entries(files).filter(([k])=>k!=='scene').map(([k,p])=>[k,read(p)]));
const script=JSON.parse(source.script),rows=script.sentences,samples=[0,.25,.5,.75,1];
const report={schema:'cib-r5-cpu-world-qa-v1',status:'RUNNING',revision:script.revision,
  scope:'Producer-side CPU geometry, transform, visibility, material, authored semantic state and production-camera determinism. NOT rendered pixels, browser execution or playback.',
  notValidated:['WebGL/GPU or browser execution','Rendered pixels and shader fidelity','Audio, timing or caption synchronization','Historical accuracy, rights, viewing quality or release approval'],
  browserUsed:false,webglUsed:false,renderedPixelValidation:false,releaseApproval:false,
  inputSHA256:Object.fromEntries(Object.entries(files).map(([k,p])=>[k,sha(fs.readFileSync(p))])),
  runtime:{node:process.version,platform:process.platform,arch:process.arch},samples,scriptRows:rows.length,
  failures:[],warnings:[],cases:[],checks:{}};
const started=Date.now(),oldWarn=console.warn;console.warn=(...v)=>report.warnings.push(v.map(String).join(' ').slice(0,1000));
const record=(id,fn)=>{try{const detail=fn();report.checks[id]={pass:true,...detail};}catch(e){report.checks[id]={pass:false,message:e.message};report.failures.push({kind:'semantic',check:id,message:e.message});}};
const uri=x=>'data:text/javascript;base64,'+Buffer.from(x).toString('base64');
const threeUri=uri(source.three),T=await import(threeUri);
report.runtime.threeRevision=T.REVISION;
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
globalThis.document={createElement(tag){assert.equal(tag,'canvas');return createCanvas(1,1)}};
report.runtime.canvas='@napi-rs/canvas, baked model label textures only';

// Bind recovered GLTF imports to this exact Three instance, using only local
// supplied assets. The retained fab is read by the production loadFab function.
const vendorCache=new Map();
function vendor(code,base){
  const key=sha(code);if(vendorCache.has(key))return vendorCache.get(key);
  const result=uri(String(code).replace(/(from\s*)(['"])([^'"]+)\2/g,(all,lead,q,spec)=>{
    if(spec==='three')return lead+q+threeUri+q;
    if(spec.startsWith('data:text/javascript;base64,'))return lead+q+vendor(Buffer.from(spec.slice(spec.indexOf(',')+1),'base64').toString(),base)+q;
    if(spec.startsWith('./')||spec.startsWith('../')){const p=path.resolve(base,spec);assert(p.startsWith(assets+path.sep),'Vendor import escapes assets');return lead+q+vendor(read(p),path.dirname(p))+q;}
    // The upstream loader documentation also contains prose such as
    // "from 'https://example/model.bin'". Leave nonmodule text untouched.
    return all;
  }));vendorCache.set(key,result);return result;
}
const {GLTFLoader}=await import(vendor(source.gltfLoader,path.dirname(files.gltfLoader)));
const {mergeGeometries}=await import(vendor(source.geometryUtils,path.dirname(files.geometryUtils)));
const glb=fs.readFileSync(files.scene);assert.equal(glb.toString('ascii',0,4),'glTF');
const gltfJSON=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
assert((gltfJSON.buffers||[]).every(b=>!b.uri),'External GLTF buffers are not fetched');
assert(!(gltfJSON.images||[]).length,'No GLTF image-loader emulation is provided');
class LocalGLTFLoader extends GLTFLoader{async loadAsync(request){assert.equal(request,'qa:local-scene');return this.parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'')}}
function extract(start,end){const a=source.film.indexOf(start),b=source.film.indexOf(end,a+start.length);assert(a>=0&&b>a,'Production function boundary changed: '+start);return source.film.slice(a,b)}
const loadFabSource=extract('async function loadFab(){','function resize(){');
const cameraSource=extract('function cameraFor(w,shot,u){','function setCaption(');
report.productionFunctions={loadFabSHA256:sha(loadFabSource),cameraForSHA256:sha(cameraSource),fabTransport:'Actual GLTFLoader.parseAsync, local binary; no network'};
const makeHost=new Function('T','GLTFLoader','mergeGeometries','DATA','worlds','scene','camera',
  `const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};let fabMixer,fabCamera,fabRoot;
  ${loadFabSource}\n${cameraSource}
  return {loadFab,cameraFor,fabState:()=>({time:fabMixer.time,actions:fabMixer._actions.map(a=>({clip:a.getClip().name,time:a.time,enabled:a.enabled,paused:a.paused,weight:a.getEffectiveWeight(),timeScale:a.getEffectiveTimeScale()}))})};`);
async function construct(){
  const worlds={...createTransactions(T),...createEconomics(T),...createInstitutions(T)},scene=new T.Scene(),camera=new T.PerspectiveCamera(37,16/9,.03,90);
  for(const [name,w]of Object.entries(worlds)){w.root.name='world-'+name;w.root.visible=false;scene.add(w.root);w.root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false}})}
  const host=makeHost(T,LocalGLTFLoader,mergeGeometries,{assets:{scene:'qa:local-scene'}},worlds,scene,camera);await host.loadFab();
  return {worlds,scene,camera,host};
}
const typed=a=>{const invalid=[];let nonFiniteCount=0;for(let i=0;i<a.length;i++)if(!Number.isFinite(a[i])){nonFiniteCount++;if(invalid.length<8)invalid.push(i)}return {type:a.constructor.name,length:a.length,sha256:sha(Buffer.from(a.buffer,a.byteOffset,a.byteLength)),...(nonFiniteCount?{nonFiniteCount,firstNonFiniteIndices:invalid}:{})}};
const numbers=a=>typed(new Float64Array(a));
function plain(v){
  if(v===undefined)return 'undefined';if(v===null||typeof v==='string'||typeof v==='boolean')return v;
  if(typeof v==='number')return Object.is(v,-0)?'-0':Number.isFinite(v)?v:String(v);
  if(typeof v==='function')return {function:v.name};if(ArrayBuffer.isView(v))return typed(v);
  if(Array.isArray(v))return v.map(plain);if(v.toArray&&(v.isColor||v.isVector2||v.isVector3||v.isVector4||v.isQuaternion||v.isMatrix3||v.isMatrix4))return numbers(v.toArray());
  return Object.fromEntries(Object.keys(v).sort().filter(k=>!['uuid','id','version','_listeners'].includes(k)).map(k=>[k,plain(v[k])]));
}
const texturePixels=new WeakMap();
function texture(t){
  const image=t.image;let pixels=texturePixels.get(image);
  if(!pixels&&image){
    if(image.getContext){const a=image.getContext('2d').getImageData(0,0,image.width,image.height).data;pixels={width:image.width,height:image.height,rgba:sha(Buffer.from(a.buffer,a.byteOffset,a.byteLength))};}
    else if(image.data)pixels={width:image.width,height:image.height,data:typed(image.data)};
    else throw new Error('Unhandled texture source');
    texturePixels.set(image,pixels);
  }
  return {pixels,...Object.fromEntries(['name','mapping','channel','wrapS','wrapT','magFilter','minFilter','anisotropy','format','type','offset','repeat','center','rotation','matrix','matrixAutoUpdate','generateMipmaps','premultiplyAlpha','flipY','unpackAlignment','colorSpace'].map(k=>[k,plain(t[k])]))};
}
const digest=x=>sha(JSON.stringify(x)),numericFailures=new Set();
function inspectNumbers(value,where,c){
  if(!value||typeof value!=='object')return;
  if(value.nonFiniteCount){const key=c.world+'/'+where;if(!numericFailures.has(key)){numericFailures.add(key);report.failures.push({kind:'nonfinite-geometry-or-transform',...c,path:where,count:value.nonFiniteCount,firstIndices:value.firstNonFiniteIndices})}return;}
  for(const [key,child]of Object.entries(value))inspectNumbers(child,where+'/'+key,c);
}
function snapshot(env,c){
  const w=env.worlds[c.world];assert(w,'Missing world '+c.world);
  for(const [name,item]of Object.entries(env.worlds))item.root.visible=name===c.world;
  w.update(c.u,c.phase);env.scene.updateMatrixWorld(true);env.host.cameraFor(w,{id:c.id,world:c.world,phase:c.phase},c.u);
  const objects=[],materialCache=new Map(),geometryCache=new Map();
  const attr=a=>({itemSize:a.itemSize,normalized:a.normalized,array:typed(a.isInterleavedBufferAttribute?a.data.array:a.array),...(a.isInterleavedBufferAttribute?{offset:a.offset,stride:a.data.stride}:{})});
  function material(m){if(Array.isArray(m))return m.map(material);if(materialCache.has(m))return materialCache.get(m);const d=Object.fromEntries(Object.keys(m).sort().filter(k=>!['id','uuid','version','_listeners'].includes(k)).map(k=>[k,m[k]?.isTexture?texture(m[k]):plain(m[k])]));materialCache.set(m,d);return d}
  function geometry(g){if(geometryCache.has(g))return geometryCache.get(g);const d={type:g.type,index:g.index?attr(g.index):null,attributes:Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,attr(a)])),drawRange:plain(g.drawRange),groups:plain(g.groups)};geometryCache.set(g,d);return d}
  let meshObjects=0,visibleDrawObjects=0,visibleInstances=0,visibleTriangles=0;
  function visit(o,p,parentVisible){
    const effectiveVisible=parentVisible&&o.visible;
    const d={path:p,name:o.name,type:o.type,visible:o.visible,effectiveVisible,position:numbers(o.position.toArray()),quaternion:numbers(o.quaternion.toArray()),scale:numbers(o.scale.toArray()),matrix:numbers(o.matrix.elements),matrixWorld:numbers(o.matrixWorld.elements),layers:o.layers.mask,renderOrder:o.renderOrder,castShadow:o.castShadow,receiveShadow:o.receiveShadow,userData:plain(o.userData)};
    if(o.material)d.material=material(o.material);if(o.geometry)d.geometry=geometry(o.geometry);
    if(o.isInstancedMesh){d.count=o.count;d.instanceMatrix=attr(o.instanceMatrix);d.instanceColor=o.instanceColor?attr(o.instanceColor):null;}
    if(o.morphTargetInfluences)d.morph=numbers(o.morphTargetInfluences);
    if(o.isMesh){meshObjects++;const mats=Array.isArray(o.material)?o.material:[o.material];
      if(effectiveVisible&&mats.some(m=>m.visible&&m.opacity>0)){
        const count=o.isInstancedMesh?o.count:1,g=o.geometry,available=g.index?.count??g.attributes.position.count,tri=Math.max(0,Math.min(available-g.drawRange.start,g.drawRange.count))/3;
        let active=0;for(let i=0;i<count;i++){const m=o.matrixWorld.clone();if(o.isInstancedMesh){const im=new T.Matrix4();o.getMatrixAt(i,im);m.multiply(im)}if(Math.abs(m.determinant())>1e-15)active++}
        if(active)visibleDrawObjects++;visibleInstances+=active;visibleTriangles+=tri*active;
      }
    }
    inspectNumbers(d,p,c);objects.push(d);o.children.forEach((child,i)=>visit(child,p+'/'+i,effectiveVisible));
  }
  visit(w.root,'root',true);
  const state=plain(w.state?w.state():env.host.fabState()),camera={position:numbers(env.camera.position.toArray()),quaternion:numbers(env.camera.quaternion.toArray()),world:numbers(env.camera.matrixWorld.elements),projection:numbers(env.camera.projectionMatrix.elements),fov:env.camera.fov,aspect:env.camera.aspect,near:env.camera.near,far:env.camera.far};
  inspectNumbers(camera,'camera',c);
  const hashes={objects:digest(objects),visibleObjects:digest(objects.filter(o=>o.effectiveVisible)),state:digest(state),camera:digest(camera)};
  return {digest:digest(hashes),hashes,objects:objects.map(o=>({path:o.path,name:o.name,visible:o.effectiveVisible,hash:digest(o)})),state,metrics:{meshObjects,visibleDrawObjects,visibleInstances,visibleTriangles}};
}
function compare(base,next,order,c){
  if(base.digest===next.digest)return;
  const changed=Object.keys(base.hashes).filter(k=>base.hashes[k]!==next.hashes[k]);
  const other=new Map(next.objects.map(o=>[o.path,o]));
  report.failures.push({kind:'determinism',order,...c,changed,visibleStateMismatch:changed.some(k=>k!=='objects'),
    changedObjects:base.objects.filter(o=>o.hash!==other.get(o.path)?.hash).slice(0,12).map(o=>({path:o.path,name:o.name,effectivelyVisible:o.visible||other.get(o.path)?.visible}))});
}

try{
  record('current-script-coverage',()=>{assert.equal(rows.length,40,'R5 currently expects 40 script rows');assert.equal(new Set(rows.map(r=>r.id)).size,40);return {rows:40,samplesPerRow:5,cases:200}});
  record('no-old-scene-imports',()=>{
    const imported={};for(const key of ['transactions','economics','institutions','film']){
      imported[key]=[...source[key].matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])([^'"]+)\1/g)].map(m=>m[2]);
      assert(imported[key].every(x=>!/(?:^|\/)(?:worlds|mechanisms)\.mjs(?:$|\?)/.test(x)),key+' imports an old scene module');
    }return {imported};
  });
  record('no-authored-frame-clock',()=>{for(const key of ['transactions','economics','institutions'])assert(!/\b(?:Math\.random|Date\.now|performance\.now|setTimeout|setInterval)\s*\(/.test(source[key]),key+' contains a nondeterministic clock/random source');return {modules:3}});
  const env=await construct(),baseline=[];
  for(const row of rows)for(const u of samples){const c={id:row.id,world:row.world,phase:row.phase,u},s=snapshot(env,c);baseline.push({c,s});report.cases.push({...c,digest:s.digest,hashes:s.hashes,metrics:s.metrics,state:s.state});}
  for(const {c,s}of [...baseline].reverse())compare(s,snapshot(env,c),'reverse',c);
  // 73 is coprime to 200: every script/time case is revisited exactly once.
  for(let i=0;i<baseline.length;i++){const {c,s}=baseline[(i*73)%baseline.length];compare(s,snapshot(env,c),'interleaved',c)}
  const fresh=await construct();for(const {c,s}of baseline)compare(s,snapshot(fresh,c),'fresh-construction',c);
  const orderFailures=report.failures.filter(f=>f.kind==='determinism');
  report.checks.determinism={pass:orderFailures.length===0,baseline:baseline.length,reverse:baseline.length,interleaved:baseline.length,freshConstruction:baseline.length,includesHiddenTransforms:true,includesProductionCamera:true,
    visibleStateAndCameraPass:orderFailures.every(f=>!f.visibleStateMismatch),hiddenOnlyMismatchCount:orderFailures.filter(f=>!f.visibleStateMismatch).length};
  report.checks.finiteGeometryAndTransforms={pass:numericFailures.size===0,distinctInvalidBuffers:numericFailures.size};
  const y=env.worlds.yield,ys=(phase,u=1)=>{y.update(u,phase);y.root.updateMatrixWorld(true);return y.state()};
  record('yield-independent-conserved-outcomes',()=>{
    assert.deepEqual(ys('reject').runA,{candidates:100,tested:100,accepted:60,rejected:40,targetAccepted:60});
    for(const u of samples)assert.deepEqual(ys('improve',u).runA,{candidates:100,tested:100,accepted:60,rejected:40,targetAccepted:60});
    assert.deepEqual(ys('improve').runB,{candidates:100,tested:100,accepted:90,rejected:10,targetAccepted:90});
    assert.equal(y.state().repairedRejects,0);const locations=[];
    for(let id=1;id<=2;id++){const d=y.root.getObjectByName('Run '+id+' exactly 100 candidate dies'),pads=y.root.getObjectByName('Run '+id+' die contact islands');assert.equal(d.count,100);assert.equal(pads.count,400);let accepted=0,rejected=0;
      for(let i=0;i<100;i++){const m=new T.Matrix4();d.getMatrixAt(i,m);const p=new T.Vector3().setFromMatrixPosition(m);if(p.z<1.3)accepted++;else if(p.z>=1.55-1e-6&&p.z<=2.3)rejected++;}
      assert.deepEqual([accepted,rejected],id===1?[60,40]:[90,10]);locations.push({id,accepted,rejected});
    }return {candidates:200,padsPerDie:4,locations,repairedRejects:0};
  });
  record('yield-100-120-quote-and-unit-cost',()=>{
    const s=ys('cost');assert.deepEqual(s.waferProcessingCostIndex,{runA:100,runB:120});assert.equal(s.costPerUsableDie.runA,100/60);assert.equal(s.costPerUsableDie.runB,120/90);assert.equal(s.unitCostRatioBToA,.8);assert.equal(s.supplierBQuotePremiumPercent,20);assert.equal(s.supplierBUnitCostReductionPercent,20);
    const plates=[];for(const name of ['A','B']){const g=y.root.getObjectByName('Hypothetical processing quote — '+name);let count=0;g.traverse(o=>{if(!o.isMesh)return;for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){const m=o.matrix.clone();if(o.isInstancedMesh)o.getMatrixAt(i,m);const v=new T.Vector3().setFromMatrixScale(m);if(Math.abs(v.x-.76)<1e-6&&Math.abs(v.y-.025)<1e-6&&Math.abs(v.z-.48)<1e-6)count++}});plates.push(count)}assert.deepEqual(plates,[10,12]);
    const scales=[];y.root.traverse(o=>{if(o.name==='Cost per usable die — illustrative allocation')scales.push(o.scale.y)});assert.deepEqual(scales,[1.25,1]);
    return {quotes:[100,120],costsPerUsableDie:[100/60,120/90],physicalQuotePlates:plates,receiptScales:scales,bUnitCostReductionPercent:20};
  });
  record('yield-no-unclassified-die-movement',()=>{
    let checked=0;for(const phase of ['reject','improve'])for(const u of [.1,.25,.5,.75]){const s=ys(phase,u),id=phase==='reject'?1:2,run=id===1?s.runA:s.runB,d=y.root.getObjectByName('Run '+id+' exactly 100 candidate dies');for(let i=run.tested;i<100;i++){const m=new T.Matrix4();d.getMatrixAt(i,m);const p=new T.Vector3().setFromMatrixPosition(m);assert(Math.abs(p.x-(i%10-4.5)*.22)<1e-6&&Math.abs(p.z-(Math.floor(i/10)-4.5)*.22)<1e-6);checked++}}return {checked};
  });
  record('contract-bought-and-resold-state-carries-forward',()=>{
    const w=env.worlds.contract;w.update(1,'shortfall');w.root.updateMatrixWorld(true);
    const candidates=[];w.root.traverse(o=>{if(o.isGroup&&o.children.filter(c=>c.isGroup&&c.children.length===2&&c.children[0].isMesh&&c.children[1].isGroup).length===10)candidates.push(o)});
    assert.equal(candidates.length,1,'Cannot uniquely identify the physical 10-slot reservation');const reservation=candidates[0],tiles=reservation.children.filter(c=>c.isGroup);assert.equal(tiles.length,10);
    const tileState=ids=>ids.map(i=>({matrix:numbers(tiles[i].matrixWorld.elements),color:tiles[i].children[0].material.color.getHex(),visible:tiles[i].visible}));
    const boughtIDs=[0,1,2,3,4,5,6],soldIDs=[7,8],bought=tileState(boughtIDs);
    const boughtTargets=boughtIDs.map(i=>[-3.8+(i%4)*.74,.29,1.15+Math.floor(i/4)*.80]);
    boughtIDs.forEach(i=>assert(tiles[i].position.distanceTo(new T.Vector3(...boughtTargets[i]))<1e-12));
    w.update(0,'shortfall');const original=tiles.map(t=>t.position.clone());
    original.forEach((p,i)=>assert(p.distanceTo(new T.Vector3((i%5-2)*.83,.29,(Math.floor(i/5)-.5)))<1e-12));
    w.update(.5,'shortfall');boughtIDs.forEach(i=>{assert(tiles[i].position.distanceTo(original[i])>1e-3,'Bought booking does not move');assert(tiles[i].position.distanceTo(new T.Vector3(...boughtTargets[i]))>1e-3,'Bought booking jumps directly to final state')});
    [7,8,9].forEach(i=>assert(tiles[i].position.distanceTo(original[i])<1e-12,'Shortfall moves an unbought booking'));
    for(const phase of ['resold','penalty'])for(const u of samples){w.update(u,phase);w.root.updateMatrixWorld(true);assert.deepEqual(tileState(boughtIDs),bought,phase+' loses the seven already-bought bookings');assert(reservation.visible&&tiles.every(t=>t.visible));}
    w.update(0,'resold');soldIDs.forEach(i=>assert(tiles[i].position.distanceTo(original[i])<1e-12));
    w.update(.5,'resold');soldIDs.forEach(i=>assert(tiles[i].position.distanceTo(original[i])>1e-3,'Resold booking does not move'));
    w.update(1,'resold');w.root.updateMatrixWorld(true);const sold=tileState(soldIDs);
    soldIDs.forEach(i=>assert(tiles[i].position.distanceTo(new T.Vector3(-.4+(i-7)*.8,.29,1.65))<1e-12));
    for(const u of samples){w.update(u,'penalty');w.root.updateMatrixWorld(true);assert.deepEqual(tileState(soldIDs),sold,'Penalty loses two already-resold bookings');assert.equal(tiles[9].children[0].material.color.getHex(),0x9e4f3f);}
    const s=w.state();assert.equal(s.minimum,10);assert.equal(s.bought,7);assert.equal(s.resold,2);assert.equal(s.penaltyExposed,1);assert.equal(s.paidAlready,false);
    // Readable final layouts must not conceal booking quantities with coplanar
    // overlap. Use actual slab + paper geometry bounds, not centre spacing or
    // declared tile dimensions; XZ overlap is checked regardless of Y offset.
    const completedLayoutSeparation=[];
    for(const phase of ['shortfall','resold','penalty']){
      w.update(1,phase);w.root.updateMatrixWorld(true);
      const boxes=tiles.map(tile=>new T.Box3().setFromObject(tile,true));let pairChecks=0,minSeparatingGap=Infinity;
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
        const a=boxes[i],b=boxes[j];
        const gapX=Math.max(a.min.x-b.max.x,b.min.x-a.max.x);
        const gapZ=Math.max(a.min.z-b.max.z,b.min.z-a.max.z);
        const gap=Math.max(gapX,gapZ);
        assert(gap>1e-6,phase+' completed tiles '+i+' and '+j+' overlap in XZ');
        minSeparatingGap=Math.min(minSeparatingGap,gap);pairChecks++;
      }
      completedLayoutSeparation.push({phase,pairChecks,minSeparatingGap});
    }
    return {physicalBookings:10,boughtCarriedForward:7,resoldCarriedForward:2,unsoldPenaltyExposure:1,actualShortfallAndResaleMotion:true,completedLayoutSeparation,advanceIsNotRepresentedAsAlreadyPaid:true,countsIllustrative:true};
  });
  report.worldMetrics=Object.fromEntries([...new Set(rows.map(r=>r.world))].map(name=>{const cases=report.cases.filter(c=>c.world===name);return [name,{cases:cases.length,maxVisibleTriangles:Math.max(...cases.map(c=>c.metrics.visibleTriangles)),maxVisibleDrawObjects:Math.max(...cases.map(c=>c.metrics.visibleDrawObjects))}]}));
}catch(e){report.failures.push({kind:'fatal',message:e.message,stack:String(e.stack).split('\n').filter(s=>!s.includes('data:text/')).slice(0,5)})}
console.warn=oldWarn;report.status=report.failures.length?'FAIL':'PASS';report.elapsedSeconds=(Date.now()-started)/1000;
const json=JSON.stringify(report,null,2);if(args.out){const out=path.resolve(args.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,json+'\n');}
process.stdout.write(json+'\n');process.exitCode=report.failures.length?1:0;
