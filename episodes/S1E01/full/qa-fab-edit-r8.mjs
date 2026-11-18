/**
 * R8 integration contract checks, deliberately without saved/rasterized 3D frames.
 * Uses the actual narration timeline, authored edit and scene factories. A PASS
 * is not WebGL, browser, perceptual quality, audio listening or release approval.
 * Run: node episodes/S1E01/full/qa-fab-edit-r8.mjs [--timeline FILE] [--three FILE]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {diskRailContact,railHousingAttachment} from './qa-fab-contact-r8.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const args={};for(let i=2;i<process.argv.length;i+=2)args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const timelinePath=args.timeline||'/workspace/scratch/204e2295d8fd/s1e01-r8-media/audio/timeline.json';
const threePath=args.three||'/workspace/sites/chip-in-birdie-s1e01-r8/.sites-checkout/dist/vendor/three.module.js';
const outputPath=args.out||path.join(here,'qa-fab-edit-r8.json');
const sourceNames=['fab-director-r8.mjs','fab-hall-r8.mjs','fab-hardware-r8.mjs','fab-process-r8.mjs','fab-facility-r8.mjs','fab-editorial-r8.mjs','fab-shotplan-r8.mjs'];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fileHash=f=>sha(fs.readFileSync(f));
const readJson=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const checks=[],warnings=[],issues=[];
const check=(name,passed,detail={})=>{checks.push({name,passed:!!passed,...detail});return !!passed;};
const fail=(name,error)=>{issues.push({name,message:error?.message||String(error)});check(name,false);};
const finiteVector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
const finiteTree=(v)=>typeof v==='number'?Number.isFinite(v):Array.isArray(v)?v.every(finiteTree):v&&typeof v==='object'?Object.values(v).every(finiteTree):true;
const same=(a,b,tolerance=1e-7)=>a.length===b.length&&a.every((n,i)=>Math.abs(n-b[i])<=tolerance);
const stable=v=>JSON.stringify(v);
const sourceHashes=Object.fromEntries(sourceNames.map(n=>[n,fileHash(path.join(here,n))]));
const script=readJson(path.join(here,'script.json')),timeline=readJson(timelinePath),manifest=readJson(path.join(here,'archive-manifest-r8.json'));
const oldManifest=readJson(path.join(here,'archive-manifest.json'));
const duration=timeline.duration_seconds||timeline.duration;
const imports=[];
for(const name of sourceNames){
  const text=fs.readFileSync(path.join(here,name),'utf8');
  const dependencies=[...text.matchAll(/^\s*import\s+(?:[^\n]*?\s+from\s+)?['"]([^'"]+)['"]/gm)].map(m=>m[1]);
  for(const dep of dependencies){
    const approved=dep==='three'||dep==='./software-renderer.mjs'||/^\.\/fab-[a-z-]+-r8\.mjs$/.test(dep);
    imports.push({module:name,dependency:dep,approved});
    check('new-content-import:'+name+':'+dep,approved);
  }
  check('no-old-dynamic-import:'+name,![...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]/g)].some(m=>!/^\.\/fab-[a-z-]+-r8\.mjs$/.test(m[1])));
}

const require=createRequire(import.meta.url);let napi;
try{napi=require('@napi-rs/canvas');}catch{napi=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));}
const {createCanvas,loadImage}=napi;
globalThis.document={createElement:tag=>{if(tag!=='canvas')throw new Error('Unexpected DOM element '+tag);return createCanvas(1,1);}};
const T=await import('data:text/javascript;base64,'+fs.readFileSync(threePath).toString('base64'));
const [{buildFabShots,eventProgress},{createFabHall},{createFabProcess},{createFabFacility},{createFabEditorial}]=await Promise.all([
  'fab-shotplan-r8.mjs','fab-hall-r8.mjs','fab-process-r8.mjs','fab-facility-r8.mjs','fab-editorial-r8.mjs'
].map(n=>import(pathToFileURL(path.join(here,n)).href)));
const shots=buildFabShots(script,timeline);

// Actual sample-clock narration and edit coverage, including the initial and
// final silence tails. A sentence's own trailing pause need not contain speech.
check('positive-finite-duration',Number.isFinite(duration)&&duration>0);
check('row-count-equal',script.sentences.length===timeline.sentences.length);
check('row-ids-equal',stable(script.sentences.map(s=>s.id))===stable(timeline.sentences.map(s=>s.id)));
check('new-script-revision',script.revision==='S1E01-full-r8');
check('unique-shot-ids',new Set(shots.map(s=>s.id)).size===shots.length);
check('unique-composition-ids',new Set(shots.map(s=>s.composition)).size===shots.length);
check('no-prior-shot-reuse-flags',shots.every(s=>s.priorShotReuse===false));
check('starts-at-zero',shots[0].t0===0);
check('ends-at-audio-duration',Math.abs(shots.at(-1).t1-duration)<1e-7);
const rows=[];
for(let i=0;i<timeline.sentences.length;i++){
  const r=timeline.sentences[i],scriptRow=script.sentences[i],selected=shots.filter(s=>s.rowId===r.id),expectedStart=i===0?0:r.start,expectedEnd=timeline.sentences[i+1]?.start??duration;
  check('row-text-en:'+r.id,r.en===scriptRow.en);
  check('row-text-ko:'+r.id,r.ko===scriptRow.ko);
  check('sample-start:'+r.id,Math.abs(r.start-r.start_sample/timeline.sample_rate)<1e-9);
  check('sample-end:'+r.id,Math.abs(r.end-r.end_sample/timeline.sample_rate)<1e-9);
  check('sentence-duration:'+r.id,Math.abs(r.duration-(r.end-r.start))<1e-8&&r.end>r.start);
  check('sentence-covered:'+r.id,selected.length>0&&Math.abs(selected[0].t0-expectedStart)<1e-7&&Math.abs(selected.at(-1).t1-expectedEnd)<1e-7&&r.end<=expectedEnd+1e-7);
  rows.push({id:r.id,speech:[r.start,r.end],edit:[expectedStart,expectedEnd],shotIds:selected.map(s=>s.id)});
}
for(let i=0;i<shots.length;i++){
  const s=shots[i];check('shot-positive:'+s.id,s.t1>s.t0&&Number.isFinite(s.t0)&&Number.isFinite(s.t1));
  if(i)check('shot-adjacent:'+s.id,Math.abs(shots[i-1].t1-s.t0)<1e-7);
  check('progress-start:'+s.id,Math.abs(eventProgress(s,s.eventT0)-s.p0)<1e-9);
  check('progress-end:'+s.id,Math.abs(eventProgress(s,s.eventT1)-s.p1)<1e-9);
}

const assets={},assetChecks=[],assetUse=new Map(),oldIds=new Set(oldManifest.assets.map(a=>a.id)),oldBytes=new Set(oldManifest.assets.map(a=>a.sha256).filter(Boolean));
for(const shot of shots)for(const id of shot.assetIds){assetUse.set(id,(assetUse.get(id)||0)+1);}
for(const [id,count] of assetUse){check('archive-used-once:'+id,count===1);check('archive-is-manifest-asset:'+id,manifest.assets.some(a=>a.id===id));check('archive-id-not-r7:'+id,!oldIds.has(id));}
for(const asset of manifest.assets){
  const file=path.join(args.assets||manifest.path_base,asset.file),exists=fs.existsSync(file),actualHash=exists?fileHash(file):null;
  check('archive-file:'+asset.id,exists);check('archive-sha256:'+asset.id,actualHash===asset.sha256);check('archive-bytes-not-r7:'+asset.id,!oldBytes.has(actualHash));
  check('archive-attribution-fields:'+asset.id,['creator','license','source_url','license_url','date_label','caution'].every(k=>typeof asset[k]==='string'&&asset[k].length>0));
  try{assets[asset.id]=await loadImage(file);check('archive-decoded-dimensions:'+asset.id,assets[asset.id].width===asset.width&&assets[asset.id].height===asset.height);}
  catch(error){fail('archive-decode:'+asset.id,error);}
  assetChecks.push({id:asset.id,file,sha256:actualHash,uses:assetUse.get(asset.id)||0,decoded:!!assets[asset.id]});
}

const sets={hall:createFabHall(T),process:createFabProcess(T),facility:createFabFacility(T)};
const expectedCameras={hall:16,process:16,facility:13};
const clipStats=[],cameraChecks=[],shotChecks=[];
const tmpMatrix=new T.Matrix4(),worldMatrix=new T.Matrix4(),viewProjection=new T.Matrix4(),frustum=new T.Frustum(),clipPoint=new T.Vector4(),worldPoint=new T.Vector3(),sphere=new T.Sphere();
const camera=new T.PerspectiveCamera(45,16/9,.003,300);

function visibleDigest(root){
  root.updateMatrixWorld(true);const hash=crypto.createHash('sha256');let count=0,finite=true;const ids=[];
  root.traverseVisible(o=>{
    if(!o.isMesh)return;count++;ids.push(o.id);finite&&=Number.isFinite(o.id)&&o.matrixWorld.elements.every(Number.isFinite);
    hash.update(String(o.id));hash.update(Buffer.from(new Float64Array(o.matrixWorld.elements).buffer));
    const materials=Array.isArray(o.material)?o.material:[o.material];
    for(const material of materials){hash.update(material.uuid+':'+material.opacity+':'+material.visible);if(material.color)hash.update(material.color.getHexString());}
    if(o.isInstancedMesh){hash.update(Buffer.from(o.instanceMatrix.array.buffer));finite&&=Array.from(o.instanceMatrix.array).every(Number.isFinite);}
  });
  return {hash:hash.digest('hex'),visibleMeshObjects:count,uniqueMeshIds:new Set(ids).size===ids.length,finite};
}
function projectMeshes(set,frame,override){
  const pos=override?.position||frame.position,target=override?.target||frame.target;
  camera.position.fromArray(pos);camera.lookAt(new T.Vector3(...target));camera.fov=override?.fov||frame.fov;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(viewProjection);set.root.updateMatrixWorld(true);
  let objects=0,instances=0,clipIntersections=0,finite=true,atEyePlane=0;const samples=[];
  set.root.traverseVisible(o=>{
    if(!o.isMesh)return;objects++;if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
    const n=o.isInstancedMesh?o.count:1;
    for(let i=0;i<n;i++){
      instances++;if(o.isInstancedMesh){o.getMatrixAt(i,tmpMatrix);worldMatrix.multiplyMatrices(o.matrixWorld,tmpMatrix);}else worldMatrix.copy(o.matrixWorld);
      finite&&=worldMatrix.elements.every(Number.isFinite);
      sphere.copy(o.geometry.boundingSphere).applyMatrix4(worldMatrix);
      finite&&=Number.isFinite(sphere.radius)&&[sphere.center.x,sphere.center.y,sphere.center.z].every(Number.isFinite);
      if(!frustum.intersectsSphere(sphere))continue;clipIntersections++;worldPoint.copy(sphere.center);
      clipPoint.set(worldPoint.x,worldPoint.y,worldPoint.z,1).applyMatrix4(viewProjection);finite&&=[clipPoint.x,clipPoint.y,clipPoint.z,clipPoint.w].every(Number.isFinite);
      if(Math.abs(clipPoint.w)<1e-9){atEyePlane++;continue;}
      const ndc=[clipPoint.x/clipPoint.w,clipPoint.y/clipPoint.w,clipPoint.z/clipPoint.w];finite&&=ndc.every(Number.isFinite);
      if(samples.length<3)samples.push({meshId:o.id,instance:o.isInstancedMesh?i:null,world:sphere.center.toArray(),ndc});
    }
  });
  return {objects,instances,clipIntersections,finite,atEyePlane,samples};
}
function stateSnapshot(set,args){const frame=set.frame(args);return {frame,signature:sha(stable(frame.state)),geometry:visibleDigest(set.root)};}
function checkFrame(label,set,args,override){
  const f=set.frame(args),position=override?.position||f.position,target=override?.target||f.target,fov=override?.fov||f.fov;
  check('camera-finite:'+label,finiteVector(position)&&finiteVector(target)&&Number.isFinite(fov)&&fov>0&&fov<179);
  check('camera-not-zero-vector:'+label,Math.hypot(...position.map((n,i)=>n-target[i]))>1e-6);
  check('frame-state-finite:'+label,finiteTree(f.state)&&finiteTree(f.detail)&&finiteTree(f.look));
  const result=projectMeshes(set,f,override);check('clip-mesh-finite:'+label,result.finite);check('clip-content-exists:'+label,result.clipIntersections>0);
  return {frame:f,result};
}

// All geometry buffers are checked once; animated object matrices are checked
// at every selected-shot sample. AABB/frustum visibility is not occlusion QA.
const geometryChecks=[];
for(const [id,set] of Object.entries(sets)){
  check('camera-count:'+id,Object.keys(set.cameras).length===expectedCameras[id]);
  const seen=new Set();let coordinates=0,finite=true;
  set.root.traverse(o=>{if(!o.isMesh||seen.has(o.geometry.uuid))return;seen.add(o.geometry.uuid);for(const a of Object.values(o.geometry.attributes)){coordinates+=a.array.length;for(const n of a.array)if(!Number.isFinite(n))finite=false;}if(o.geometry.index)for(const n of o.geometry.index.array)if(!Number.isFinite(n))finite=false;});
  check('geometry-buffers-finite:'+id,finite);geometryChecks.push({set:id,uniqueGeometries:seen.size,attributeNumbers:coordinates,finite});
  for(const [view,pose] of Object.entries(set.cameras)){
    const act=id==='process'?pose.act:id==='facility'?(['service-canyon','pump-rack','utility-riser'].includes(view)?'subfab':['bay-entry','wafer-stage','objective-close'].includes(view)?'metrology':['structural-build','commissioned-dusk','logistics-close'].includes(view)?'exterior':'airflow'):['hoist-side','dock-macro','loadport'].includes(view)?'transfer':['buffer-level','quiet-operator','service','long-lens'].includes(view)?'docked':'transport';
    const tested=[];
    for(const u of[0,.5,1]){const {result}=checkFrame(id+'/'+view+'/'+u,set,{act,view,p:.53,u,t:123.45});tested.push({u,clipIntersections:result.clipIntersections});}
    cameraChecks.push({set:id,view,act,tested});
  }
}

const editorialCanvas=createCanvas(1600,900),editorial=createFabEditorial({canvas:editorialCanvas,images:assets,credits:manifest.assets});
const baselineCanvas=createCanvas(1600,900),baselineEditorial=createFabEditorial({canvas:baselineCanvas,images:assets,credits:manifest.assets});
const paintPerturbation=shots.find(s=>s.view==='design');
const canvasDigest=()=>sha(editorialCanvas.getContext('2d').getImageData(0,0,1600,900).data);
for(const shot of shots){
  try{
    if(shot.kind==='spatial'){
      check('shot-known-set:'+shot.id,!!sets[shot.set]);check('shot-authored-camera:'+shot.id,!!sets[shot.set]?.cameras[shot.view]);
      const results=[];
      for(const u of[0,.5,1]){const t=shot.t0+(shot.t1-shot.t0)*u,p=eventProgress(shot,t);const {result}=checkFrame(shot.id+'/'+u,sets[shot.set],{act:shot.act,p,view:shot.view,shot:shot.view,u,t},shot.camera);results.push({u,p,clipIntersections:result.clipIntersections});if(u===.5)clipStats.push({shotId:shot.id,...result});}
      // Seek past the scene, then back. Only visible geometry is compared: an
      // inactive mechanism may preserve harmless data until its next frame.
      const t=(shot.t0+shot.t1)/2,args={act:shot.act,p:eventProgress(shot,t),view:shot.view,shot:shot.view,u:.5,t};
      const before=stateSnapshot(sets[shot.set],args);
      sets[shot.set].frame({...args,p:1,u:1,t:duration});sets[shot.set].frame({...args,p:0,u:0,t:0});
      const otherAct=shots.find(s=>s.kind==='spatial'&&s.set===shot.set&&s.act!==shot.act);
      if(otherAct)sets[shot.set].frame({act:otherAct.act,view:otherAct.view,p:.37,u:.61,t:otherAct.t0+(otherAct.t1-otherAct.t0)*.61});
      const after=stateSnapshot(sets[shot.set],args);
      check('reverse-seek-state:'+shot.id,before.signature===after.signature);
      check('reverse-seek-visible-mesh:'+shot.id,before.geometry.hash===after.geometry.hash);
      check('mesh-ids-and-matrices:'+shot.id,after.geometry.uniqueMeshIds&&after.geometry.finite);
      shotChecks.push({id:shot.id,kind:shot.kind,set:shot.set,view:shot.view,samples:results,reverseSeekState:before.signature===after.signature,reverseSeekMesh:before.geometry.hash===after.geometry.hash});
    }else{
      for(const u of[0,.5,1]){const t=shot.t0+(shot.t1-shot.t0)*u,s=editorial.draw(shot,u,t);check('reporting-draw-state:'+shot.id+'/'+u,s.shotId===shot.id&&finiteTree(s));}
      editorial.draw(shot,.5,(shot.t0+shot.t1)/2);const forward=canvasDigest();editorial.draw(shot,1,shot.t1);editorial.draw(shot,0,shot.t0);editorial.draw(shot,.5,(shot.t0+shot.t1)/2);const reverse=canvasDigest();
      check('reverse-seek-reporting-pixels:'+shot.id,forward===reverse);
      baselineCanvas.width=1600;baselineEditorial.draw(shot,.5,(shot.t0+shot.t1)/2);
      const cleanPaint=sha(baselineCanvas.getContext('2d').getImageData(0,0,1600,900).data);
      if(paintPerturbation)editorial.draw(paintPerturbation,.7,(paintPerturbation.t0+paintPerturbation.t1)/2);
      editorial.draw(shot,.5,(shot.t0+shot.t1)/2);const crossScenePaint=canvasDigest();
      check('cross-scene-seek-reporting-pixels:'+shot.id,cleanPaint===crossScenePaint);
      shotChecks.push({id:shot.id,kind:shot.kind,view:shot.view,reverseSeekPixels:forward===reverse,crossSceneSeekPixels:cleanPaint===crossScenePaint,pixelDigest:reverse});
    }
  }catch(error){fail('shot-execution:'+shot.id,error);}
}

// Shared event clocks survive editorial cuts. The handoff compares actual
// physical actor state, not just matching progress values.
const continuity=[];
const sharedEvents=['handoff','load','process','measure','package'];
for(const event of sharedEvents){
  const selected=shots.filter(s=>s.event===event);
  for(let i=1;i<selected.length;i++){
    const a=selected[i-1],b=selected[i],boundary=a.t1,pa=eventProgress(a,boundary),pb=eventProgress(b,b.t0);
    check('shared-clock-continuity:'+a.id+'→'+b.id,Math.abs(pa-pb)<1e-9);
    const entry={event,before:a.id,after:b.id,time:boundary,pBefore:pa,pAfter:pb};
    if(event==='handoff'){
      const fa=sets.hall.frame({act:a.act,p:pa,view:a.view,u:1,t:boundary}).state;
      const fb=sets.hall.frame({act:b.act,p:pb,view:b.view,u:0,t:boundary}).state;
      entry.actorMatch=['carrierPosition','vehiclePosition','dockingPlatePosition'].every(k=>same(fa[k],fb[k]))&&Math.abs(fa.gripBaseY-fb.gripBaseY)<1e-9&&stable(fa.transfer)===stable(fb.transfer);
      check('handoff-actor-continuity:'+a.id+'→'+b.id,entry.actorMatch);
    }
    continuity.push(entry);
  }
}
const beforeHandoff=shots.filter(s=>s.rowId==='f06').at(-1),handoff=shots.find(s=>s.event==='handoff');
const transportEnd=sets.hall.frame({act:beforeHandoff.act,p:eventProgress(beforeHandoff,beforeHandoff.t1),view:beforeHandoff.view,u:1,t:beforeHandoff.t1}).state;
const handoffStart=sets.hall.frame({act:handoff.act,p:eventProgress(handoff,handoff.t0),view:handoff.view,u:0,t:handoff.t0}).state;
check('transport-enters-handoff-without-jump',same(transportEnd.carrierPosition,handoffStart.carrierPosition)&&same(transportEnd.vehiclePosition,handoffStart.vehiclePosition));
const firstLoad=shots.find(s=>s.event==='load');check('EFEM-does-not-replay-docking',eventProgress(firstLoad,firstLoad.t0)>=.16);

// Integration boundary: the hardware exterior revision must not leave a solid
// plate across the process scene's intentionally modelled FIMS aperture.
sets.process.frame({act:'efem',view:'interlock',p:.16,u:.5,t:0});sets.process.root.updateMatrixWorld(true);
const lp=sets.process.root.getObjectByName('loadport-EFEM / 01');
const foupDoor=sets.process.root.getObjectByName('detachable-FOUP-door');
const fimsDoor=lp?.children.find(o=>o.isMesh&&Math.abs((o.geometry.parameters?.width||0)-.351)<1e-7&&Math.abs((o.geometry.parameters?.height||0)-.258)<1e-7);
check('EFEM-FIMS-door-found',!!fimsDoor&&!!foupDoor);
let mechanismChecks={};
if(fimsDoor&&foupDoor){
  const foupBounds=new T.Box3().setFromObject(foupDoor),fimsBounds=new T.Box3().setFromObject(fimsDoor);
  const dockedDoorGap=foupBounds.min.z-fimsBounds.max.z;
  check('EFEM-FIMS-mated-before-withdraw',Math.abs(dockedDoorGap)<1e-6);
  sets.process.frame({act:'efem',view:'blade',p:.44,u:.5,t:0});sets.process.root.updateMatrixWorld(true);
  const openDoorBounds=new T.Box3().setFromObject(fimsDoor),blockers=[];
  lp.traverseVisible(o=>{if(!o.isMesh)return;const b=new T.Box3().setFromObject(o);if(b.min.x<.149&&b.max.x>-.149&&b.min.y<1.0614&&b.max.y>1.0606&&b.min.z<-.16&&b.max.z>-.30)blockers.push(o.id);});
  check('EFEM-wafer-path-not-blocked-by-loadport',blockers.length===0);
  check('EFEM-door-clears-wafer-height',openDoorBounds.max.y<1.0606);
  mechanismChecks={dockedDoorGap,waferPathBlockers:blockers,openDoorTopY:openDoorBounds.max.y,waferBottomY:1.0606};
}

// Test actual selected-wafer mesh caps against both actual FOUP rail top caps.
// This rejects both the former 1.1 mm vertical gap and shelves outside the disk.
const processPod=sets.process.root.getObjectByName('FOUP-LOT 017'),selectedWafer=sets.process.root.getObjectByName('wafer-300mm-transfer');
const selectedRails=processPod.children.filter(o=>o.isMesh&&o.userData.kind==='wafer-slot-support'&&o.userData.slot===12);
check('selected-wafer-has-two-slot-rails',selectedRails.length===2);
const slotContactChecks=[];
for(const p of[0,.08,.16,.29,.41,.44,.62,.6699,.67]){
  const state=sets.process.frame({act:'efem',view:'blade',p,u:.5,t:0}).state;sets.process.root.updateMatrixWorld(true);
  const visibleRails=processPod.children.filter(o=>o.isMesh&&o.visible&&o.userData.kind==='wafer-slot-support');
  check('cutaway-shows-only-selected-slot:'+p,visibleRails.length===2&&visibleRails.every(o=>selectedRails.includes(o)));
  for(const rail of selectedRails){
    const contact=diskRailContact(T,selectedWafer,rail);slotContactChecks.push({p,support:state.support,railId:rail.id,...contact});
    check('selected-wafer-actual-slot-contact:'+p+':'+rail.id,contact.contact);
    const housing=processPod.children.find(o=>o.isMesh&&o.geometry.parameters?.width===.018&&o.geometry.parameters?.height===.268&&Math.sign(o.position.x)===rail.userData.side);
    const attachment=railHousingAttachment(T,rail,housing);
    check('selected-slot-rail-attached-to-housing:'+p+':'+rail.id,attachment.attached);
  }
}
for(const p of[.72,.80,.96,1]){
  sets.process.frame({act:'efem',view:'robot',p,u:.5,t:0});sets.process.root.updateMatrixWorld(true);
  for(const rail of selectedRails){const contact=diskRailContact(T,selectedWafer,rail);slotContactChecks.push({p,railId:rail.id,...contact});check('lifted-wafer-clears-slot-rail:'+p+':'+rail.id,contact.verticalGap>.0019);}
}
mechanismChecks.slotContacts=slotContactChecks;

const afterHashes=Object.fromEntries(sourceNames.map(n=>[n,fileHash(path.join(here,n))]));
check('unchanged-source-snapshot-during-tests',stable(sourceHashes)===stable(afterHashes));
warnings.push('No PNG or 3D raster frame was generated. Canvas2D reporting frames were painted in memory only for deterministic-pixel tests.');
warnings.push('Finite projections and frustum overlap do not prove a shot is unobstructed, well framed, physically collision-free or visually good.');
warnings.push('This is not a browser/WebGL/player/audio-listening test. Root owns final rendered-shot and deployed-player verification.');
const failed=checks.filter(c=>!c.passed);
const report={schema_version:1,project:'Chip in Birdie S1E01 R8',test:'source/timeline/edit/geometry integration contract',
  status:failed.length===0?'PASS_CONTRACT_ONLY':'FAIL',scope:'Node + actual Three.js geometry + NAPI Canvas2D reporting; zero saved images',
  inputs:{timeline:timelinePath,timelineSha256:fileHash(timelinePath),scriptSha256:fileHash(path.join(here,'script.json')),threeRevision:T.REVISION,threeSha256:fileHash(threePath),sourceHashes,sourceHashesAfter:afterHashes},
  summary:{duration,rows:rows.length,shots:shots.length,spatialShots:shots.filter(s=>s.kind==='spatial').length,reportingShots:shots.filter(s=>s.kind==='editorial').length,photographicShots:shots.filter(s=>s.kind==='photo').length,cameras:cameraChecks.length,cameraCounts:Object.fromEntries(Object.entries(sets).map(([n,s])=>[n,Object.keys(s.cameras).length])),checks:checks.length,passed:checks.length-failed.length,failed:failed.length,pngGenerated:0},
  rows,imports,assets:assetChecks,geometryChecks,cameraChecks,shotChecks,continuity,mechanismChecks,clipStats,failures:failed,issues,warnings};
fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,...report.summary,failures:failed,issues,output:outputPath}));
if(failed.length)process.exitCode=1;
