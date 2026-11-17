/**
 * Bounded producer-side contracts for the existing R7 film. No browser,
 * raster-frame capture, WebGL, audio listening, network or release approval.
 *
 * node qa-cinematic-r7.mjs --three /exact/vendor/three.module.js \
 *   --timeline /audio/full-r6/timeline.json [--out /scratch/report.json]
 *
 * Uses the supplied Three r170 BYTES and real NAPI Canvas label textures.
 * Snapshots contain active actor geometry, materials, lights and ALL of its
 * hidden children, not untouched inactive actors in a different set.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createStoryKit} from './story-kit.mjs';
import {createPCSet} from './story-pc.mjs';
import {createFactorySet} from './story-factory.mjs';
import {createLabSet} from './story-lab.mjs';
import {createDeskSet} from './story-desk.mjs';
import {buildCinematicShots,eventProgress} from './cinematic-shotplan.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),args={};
for(let i=2;i<process.argv.length;i+=2){
  assert(['--three','--timeline','--out'].includes(process.argv[i])&&process.argv[i+1],
    'Usage: --three EXACT_R170_MODULE --timeline TIMELINE_JSON [--out REPORT_JSON]');
  args[process.argv[i].slice(2)]=path.resolve(process.argv[i+1]);
}
assert(args.three&&args.timeline,'Both --three and --timeline are required; no vendor or timing substitute is downloaded.');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const digest=value=>sha(JSON.stringify(value));
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const approx=(a,b,eps=1e-9)=>assert(Math.abs(a-b)<=eps,`${a} != ${b} within ${eps}`);
const report={
  schema:'cib-r7-cinematic-contract-v1',status:'RUNNING',
  scope:'Production shot clocks, finite camera/actor states, physical connector envelope, sample conservation and actor-state seek determinism.',
  browserUsed:false,webglUsed:false,renderedPixelsValidated:false,audioValidated:false,releaseApproval:false,
  limits:[
    'Node/NAPI Canvas geometry-and-state tests are not browser playback or GPU evidence.',
    'PC test verifies gold-finger alignment, monotonic travel and the authored connector opening envelope; it is not an exhaustive mesh collision analysis.',
    'Lab counts and copper bridge are labelled illustrations, not historical NVIDIA yield or failure diagnosis.',
    'No visual quality, historical accuracy, asset rights, narration or full-film independent viewing approval is asserted.'
  ],
  runtime:{node:process.version,platform:process.platform,arch:process.arch},checks:{},failures:[],
};
const sourceFiles=[
  'qa-cinematic-r7.mjs','script.json','cinematic-shotplan.mjs','archive-shotplan.mjs',
  'cinematic-director.mjs','story-kit.mjs','story-pc.mjs','story-factory.mjs','story-lab.mjs','story-desk.mjs',
];
const inputs=Object.fromEntries(sourceFiles.map(name=>[name,path.join(here,name)]));
inputs.vendorThree=args.three;inputs.timeline=args.timeline;
report.inputSHA256=Object.fromEntries(Object.entries(inputs).map(([name,file])=>[name,sha(fs.readFileSync(file))]));
function check(name,fn){
  try {const details=fn()||{};report.checks[name]={pass:true,...details};}
  catch(error){report.checks[name]={pass:false,message:error.message};report.failures.push({check:name,message:error.message});}
}
function finite(value,where){
  if(typeof value==='number')assert(Number.isFinite(value),`Non-finite number at ${where}`);
  else if(Array.isArray(value)||ArrayBuffer.isView(value))Array.from(value).forEach((v,i)=>finite(v,`${where}[${i}]`));
  else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>finite(v,`${where}.${k}`));
}
function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(ArrayBuffer.isView(value))return Array.from(value);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
const scalarFields=['opacity','transparent','visible','roughness','metalness','emissiveIntensity','side','depthWrite','depthTest','wireframe'];
const geometryHashes=new WeakMap(),textureHashes=new WeakMap();
function bytes(a){return sha(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}
function geometry(g){
  if(geometryHashes.has(g))return geometryHashes.get(g);
  const attributes={};
  for(const [key,attribute] of Object.entries(g.attributes)){
    const a=attribute.isInterleavedBufferAttribute?attribute.data.array:attribute.array;
    finite(a,`geometry.${key}`);
    attributes[key]={itemSize:attribute.itemSize,normalized:attribute.normalized,array:bytes(a),length:a.length};
  }
  const hash=digest({type:g.type,attributes,index:g.index?bytes(g.index.array):null,groups:g.groups});
  geometryHashes.set(g,hash);return hash;
}
function texture(t){
  if(!t)return null;
  let image=textureHashes.get(t);
  if(!image){
    const canvas=t.image;assert(canvas?.getContext,'Expected an authored NAPI Canvas texture, not a network asset.');
    const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    image={width:canvas.width,height:canvas.height,rgbaSHA256:bytes(pixels)};textureHashes.set(t,image);
  }
  return {image,repeat:t.repeat.toArray(),offset:t.offset.toArray(),rotation:t.rotation,wrapS:t.wrapS,wrapT:t.wrapT,colorSpace:t.colorSpace};
}
function material(m){
  if(!m)return null;if(Array.isArray(m))return m.map(material);
  return {type:m.type,color:m.color?.toArray(),emissive:m.emissive?.toArray(),
    ...Object.fromEntries(scalarFields.map(k=>[k,m[k]])),map:texture(m.map)};
}
function actorSnapshot(set,frame){
  set.root.updateMatrixWorld(true);
  const objects=[],materials=new Map();
  function visit(o,index,parentVisible){
    finite(o.matrixWorld.elements,`${index}.matrixWorld`);
    if(o.material&&!materials.has(o.material))materials.set(o.material,material(o.material));
    const row={path:index,name:o.name,type:o.type,visible:o.visible,effectiveVisible:parentVisible&&o.visible,
      position:o.position.toArray(),quaternion:o.quaternion.toArray(),scale:o.scale.toArray(),matrix:o.matrix.elements.slice(),matrixWorld:o.matrixWorld.elements.slice(),
      geometry:o.geometry?geometry(o.geometry):null,material:materials.get(o.material)||null,
      instanceCount:o.isInstancedMesh?o.count:null,instances:o.instanceMatrix?bytes(o.instanceMatrix.array):null,
      instanceColours:o.instanceColor?bytes(o.instanceColor.array):null,
      light:o.isLight?{color:o.color.toArray(),intensity:o.intensity,target:o.target?.position.toArray()}:null};
    finite(row.position,`${index}.position`);finite(row.scale,`${index}.scale`);
    objects.push({path:index,name:o.name,hash:digest(row)});
    o.children.forEach((child,i)=>visit(child,`${index}/${i}`,parentVisible&&o.visible));
  }
  visit(set.root,'root',true);
  const pose={position:frame.position,target:frame.target,fov:frame.fov,look:frame.look,label:frame.label,detail:frame.detail};
  return {objectsHash:digest(objects),stateHash:digest(canonical(frame.state)),poseHash:digest(canonical(pose)),objects};
}
function compare(a,b,label){
  if(a.objectsHash!==b.objectsHash){
    const other=new Map(b.objects.map(o=>[o.path,o]));
    const changed=a.objects.filter(o=>o.hash!==other.get(o.path)?.hash).slice(0,6);
    assert.fail(`${label}: actor graph differs at ${changed.map(o=>o.path+' '+o.name).join(', ')}`);
  }
  assert.equal(b.stateHash,a.stateHash,`${label}: returned actor state differs`);
  assert.equal(b.poseHash,a.poseHash,`${label}: camera/metadata differs`);
}
function actorOnlyState(s){
  return Object.fromEntries(Object.entries(s).filter(([k])=>!['shot','cameraPosition','cameraTarget','time','t'].includes(k)));
}

try {
  const T=await import('data:text/javascript;base64,'+fs.readFileSync(args.three).toString('base64'));
  assert.equal(T.REVISION,'170','This test must use the currently pinned Three r170, not a substituted version.');
  report.runtime.threeRevision=T.REVISION;
  const require=createRequire(import.meta.url);
  let canvasModule;
  try {canvasModule=require('@napi-rs/canvas');}
  catch(error){
    if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
    canvasModule=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));
  }
  globalThis.document={createElement(tag){assert.equal(tag,'canvas');return canvasModule.createCanvas(1,1);}};
  report.runtime.canvas='@napi-rs/canvas · actual authored texture rasterization, no DOM/browser emulation';
  const script=readJSON(path.join(here,'script.json')),timeline=readJSON(args.timeline);
  const shots=buildCinematicShots(script,timeline),spatial=shots.filter(s=>s.kind==='spatial');
  const duration=timeline.duration_seconds||timeline.duration;
  report.timeline={duration,shotCount:shots.length,spatialShots:spatial.length,archiveShots:shots.length-spatial.length,rows:timeline.sentences.length};
  check('full_episode_coverage',()=>{
    assert.equal(shots.length,83);assert.equal(timeline.sentences.length,44);
    approx(duration,384.41133333333335);approx(shots[0].t0,0);approx(shots.at(-1).t1,duration);
    const ids=new Set();let total=0;
    shots.forEach((s,i)=>{
      assert(!ids.has(s.id),'Duplicate shot '+s.id);ids.add(s.id);
      assert(Number.isFinite(s.t0)&&Number.isFinite(s.t1)&&s.t1>s.t0,'Invalid shot '+s.id);
      if(i)approx(s.t0,shots[i-1].t1,1e-10);total+=s.t1-s.t0;
    });approx(total,duration,1e-8);
    return {shots:83,spatial:spatial.length,start:0,end:duration,gaps:0,overlaps:0};
  });
  const events=new Map();spatial.forEach(s=>{if(!events.has(s.event))events.set(s.event,[]);events.get(s.event).push(s);});
  check('shared_event_clocks_not_sentence_resets',()=>{
    let seams=0,rowSeams=0,alreadyAdvancedAtLaterShots=0;
    for(const [name,group] of events){
      const first=group[0].eventClock;assert(first.t1>first.t0,'Empty event '+name);
      group.forEach(s=>{
        assert.deepEqual(s.eventClock,first,'Clock changed within '+name);
        for(const time of [s.t0,(s.t0+s.t1)/2,s.t1]){
          const expected=first.p0+(first.p1-first.p0)*Math.max(0,Math.min(1,(time-first.t0)/(first.t1-first.t0)));
          approx(eventProgress(s,time),expected);
        }
        if(s.t0>first.t0+1e-6&&first.p1>first.p0&&eventProgress(s,s.t0)>first.p0)alreadyAdvancedAtLaterShots++;
      });
      for(let i=1;i<group.length;i++){
        const a=group[i-1],b=group[i];
        if(Math.abs(a.t1-b.t0)<1e-9){approx(eventProgress(a,a.t1),eventProgress(b,b.t0));seams++;if(a.rowId!==b.rowId)rowSeams++;}
      }
    }
    assert(rowSeams>=5,'Too few cross-sentence continuous event seams');
    assert(alreadyAdvancedAtLaterShots>=15,'Later camera shots appear to reset events');
    const payoff=events.get('payoff');assert(payoff?.length);payoff.forEach(s=>{approx(eventProgress(s,s.t0),1);approx(eventProgress(s,s.t1),1);});
    return {events:events.size,continuousCameraSeams:seams,continuousSentenceSeams:rowSeams,laterShotsWithAdvancedProgress:alreadyAdvancedAtLaterShots,payoffNeverReinserts:true};
  });
  const construct=()=>{const kit=createStoryKit(T);return {pc:createPCSet(T,kit),factory:createFactorySet(T,kit),lab:createLabSet(T,kit),desk:createDeskSet(T,kit)};};
  const sets=construct(),samples=[0,.25,.5,.75,1-1e-9],cases=[];
  function run(actors,c){
    const set=actors[c.shot.set];assert(set,'Unknown actor '+c.shot.set);
    set.root.visible=true;
    return set.frame({act:c.shot.act,p:eventProgress(c.shot,c.time),shot:c.shot.view,u:c.u,t:c.time});
  }
  check('finite_poses_and_actor_graphs_all_spatial_shots',()=>{
    for(const shot of spatial)for(const u of samples){
      const c={id:`${shot.id}@${u}`,shot,u,time:shot.t0+(shot.t1-shot.t0)*u},frame=run(sets,c);
      finite(frame.position,c.id+'.position');finite(frame.target,c.id+'.target');finite(frame.fov,c.id+'.fov');finite(frame.state,c.id+'.state');
      assert.equal(frame.position.length,3);assert.equal(frame.target.length,3);
      assert(frame.fov>0&&frame.fov<120);assert(Math.hypot(...frame.position.map((v,i)=>v-frame.target[i]))>1e-5);
      cases.push({...c,baseline:actorSnapshot(sets[shot.set],frame)});
    }
    return {spatialShots:spatial.length,cases:cases.length,samplesPerShot:samples.length,geometryAndWorldMatricesFinite:true};
  });
  function disturb(actors){
    actors.pc.frame({act:'working',p:1,shot:'screen',u:1,t:900});
    actors.factory.frame({act:'capacity',p:.89,shot:'handoff',u:.72,t:901});
    actors.lab.frame({act:'repair',p:.48,shot:'macro',u:.31,t:902});
    actors.desk.frame({act:'forecast',p:.99,shot:'page',u:.6,t:903});
  }
  check('same_timestamps_reverse_and_unrelated_seeks',()=>{
    let comparisons=0;
    for(const c of [...cases].reverse()){disturb(sets);const f=run(sets,c);compare(c.baseline,actorSnapshot(sets[c.shot.set],f),'reverse '+c.id);comparisons++;}
    const step=37;assert.equal(new Set(cases.map((_,i)=>(i*step)%cases.length)).size,cases.length,'Interleave step must visit every case');
    for(let i=0;i<cases.length;i++){const c=cases[(i*step)%cases.length];disturb(sets);const f=run(sets,c);compare(c.baseline,actorSnapshot(sets[c.shot.set],f),'interleaved '+c.id);comparisons++;}
    return {cases:cases.length,comparisons,includesHiddenChildren:true,comparesGeometryMaterialsLightsTransformsVisibilityStateAndCamera:true};
  });
  check('fresh_reconstruction_same_timestamps',()=>{
    const fresh=construct();let comparisons=0;
    for(const c of [...cases].reverse()){disturb(fresh);const f=run(fresh,c);compare(c.baseline,actorSnapshot(fresh[c.shot.set],f),'fresh '+c.id);comparisons++;}
    return {comparisons,generatedIdsExcluded:true,actualTexturePixelHashesIncluded:true};
  });
  check('actor_action_continues_at_camera_and_sentence_cuts',()=>{
    let checked=0;
    for(let i=1;i<shots.length;i++){
      const a=shots[i-1],b=shots[i];
      if(a.kind!=='spatial'||b.kind!=='spatial'||a.event!==b.event||a.set!==b.set||a.act!==b.act)continue;
      const time=b.t0,set=sets[a.set];
      const before=set.frame({act:a.act,p:eventProgress(a,time),shot:a.view,u:1,t:time});
      const oldState=digest(canonical(actorOnlyState(before.state))),oldGraph=actorSnapshot(set,before).objectsHash;
      const after=set.frame({act:b.act,p:eventProgress(b,time),shot:b.view,u:0,t:time});
      assert.equal(digest(canonical(actorOnlyState(after.state))),oldState,'Actor state jumped at '+b.id);
      assert.equal(actorSnapshot(set,after).objectsHash,oldGraph,'Actor geometry jumped at '+b.id);checked++;
    }
    assert(checked>=15);return {cutsChecked:checked,cameraCutsDoNotRestartPhysicalActions:true};
  });
  check('lab_count_conservation_and_six_to_six_repeat',()=>{
    let samples=0;
    for(const act of ['inspection','repeat'])for(let i=0;i<=1000;i++){
      const s=sets.lab.frame({act,p:i/1000,shot:'test',u:.5,t:20}).state;
      for(const k of ['tested','accepted','rejected'])assert(Number.isInteger(s[k])&&s[k]>=0,`${act} invalid ${k}`);
      assert.equal(s.accepted+s.rejected,s.tested);assert(s.tested<=6);samples++;
    }
    const low=sets.lab.frame({act:'inspection',p:1,shot:'reject'}).state;
    const repeat=sets.lab.frame({act:'repeat',p:1,shot:'repeat'}).state;
    assert.deepEqual([low.tested,low.accepted,low.rejected],[6,2,4]);
    assert.deepEqual([repeat.tested,repeat.accepted,repeat.rejected],[6,6,0]);
    assert.equal(repeat.sampleCountsNotHistorical,true);
    return {samples,initial:{tested:6,accepted:2,rejected:4},repeat:{tested:6,accepted:6,rejected:0},historicalYieldClaim:false};
  });
  check('macro_separate_specimens_and_clearance_during_swap',()=>{
    let samples=0;
    for(let i=0;i<=1000;i++){
      const s=sets.lab.frame({act:'repair',p:i/1000,shot:'macro',u:.5}).state;
      assert.equal(s.specimenAHasPermanentBridge,true);assert.equal(s.specimenBHasNoBridge,true);
      if(s.specimenSwap>0&&s.specimenSwap<1){assert.equal(s.probeContact,false);assert(s.probeClearance>.15);}
      assert.equal(s.actualNvidiaFailureCause,false);samples++;
    }
    const done=sets.lab.frame({act:'repair',p:1,shot:'gap'}).state;
    assert.equal(done.activeSpecimen,'B');assert.equal(done.response,'isolated');
    return {samples,swapNeverOccursWhileTouching:true,oldBridgeNotErased:true,distinctReplacementSpecimen:true};
  });
  check('pc_gold_fingers_alignment_insertion_and_power',()=>{
    const pc=sets.pc,card=pc.root.getObjectByName('graphics board moving on connector axis');assert(card,'Missing production card');
    const dims=o=>{o.geometry.computeBoundingBox();return o.geometry.boundingBox.getSize(new T.Vector3()).toArray();};
    const shape=(o,w,h,d)=>o.isMesh&&dims(o).every((v,i)=>Math.abs(v-[w,h,d][i])<1e-6);
    const fingers=card.children.filter(o=>shape(o,.003,.018,.0045));assert.equal(fingers.length,24);
    const rails=pc.root.children.filter(o=>shape(o,.004,.022,.193));assert.equal(rails.length,2);
    const body=pc.root.children.find(o=>shape(o,.018,.021,.205));assert(body,'Missing connector envelope');
    const worldBounds=o=>new T.Box3().setFromObject(o,true);
    function current(){pc.root.updateMatrixWorld(true);const fingerBounds=new T.Box3();fingers.forEach(o=>fingerBounds.union(worldBounds(o)));const rs=rails.map(worldBounds).sort((a,b)=>a.min.x-b.min.x);return {fingerBounds,rails:rs,body:worldBounds(body)};}
    const opening=pc.frame({act:'blocked',p:0,shot:'slot',u:0});assert.equal(card.visible,false);assert.equal(opening.state.displayPowered,false);
    let previousY=Infinity,minGap=Infinity,maxGap=-Infinity,poweredSamples=0;
    for(let i=0;i<=1000;i++){
      const p=i/1000,f=pc.frame({act:'assembly',p,shot:'contact',u:.5,t:100+p}),{fingerBounds:b,rails:r,body:base}=current();
      const top=Math.max(r[0].max.y,r[1].max.y);
      assert(b.min.x>=r[0].max.x-1e-6&&b.max.x<=r[1].min.x+1e-6,'Gold fingers miss rail opening in X');
      assert(b.min.z>=Math.max(r[0].min.z,r[1].min.z)-1e-6&&b.max.z<=Math.min(r[0].max.z,r[1].max.z)+1e-6,'Gold fingers miss rail opening in Z');
      assert(b.min.y<=previousY+1e-9,'Insertion reverses or overshoots');previousY=b.min.y;
      assert(card.position.y>=.863-1e-9&&card.position.y<=1.173+1e-9);approx(card.position.x,.31);approx(card.position.z,-.01);
      approx(card.quaternion.x,0);approx(card.quaternion.y,0);approx(card.quaternion.z,0);approx(card.quaternion.w,1);
      approx(f.state.remainingInsertionTravelMetres,card.position.y-.863,1e-6);
      approx(f.state.contactGapMetres,Math.max(0,b.min.y-top),1e-6);
      assert(f.state.boardInserted>=0&&f.state.boardInserted<=1);
      if(f.state.displayPowered){approx(f.state.boardInserted,1);assert(b.max.y<=top+1e-6);assert(b.min.y>=base.min.y-1e-6);poweredSamples++;}
      const gap=b.min.y-top;minGap=Math.min(minGap,gap);maxGap=Math.max(maxGap,gap);
    }
    const end=pc.frame({act:'working',p:1,shot:'screen',u:.5,t:384}).state;
    assert.equal(card.visible,true);assert.equal(end.boardInserted,1);assert.equal(end.contactGapMetres,0);assert.equal(end.remainingInsertionTravelMetres,0);assert.equal(end.displayPowered,true);
    const screen=[];pc.root.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&Math.abs(o.geometry.parameters.width-.317)<1e-6&&Math.abs(o.geometry.parameters.height-.225)<1e-6)screen.push(o);});
    assert.equal(screen.length,1);assert.equal(screen[0].visible,true);
    return {samples:1001,goldFingers:24,insertionTravelMetres:.31,openingClearanceRangeMetres:[minGap,maxGap],poweredSamples,emptyToSeatedToDisplay:true,scope:'Connector envelope only; no exhaustive collision certification.'};
  });
  check('hidden_desk_state_resets_after_unrelated_seeks',()=>{
    const desk=sets.desk,cases=[{act:'design',p:.28,shot:'drawing',u:.4,t:134},{act:'forecast',p:.56,shot:'page',u:.7,t:322}];
    for(const c of cases){
      const first=actorSnapshot(desk,desk.frame(c));
      desk.frame({act:'forecast',p:1,shot:'book',u:1,t:903});
      sets.pc.frame({act:'working',p:1,shot:'screen',u:1,t:384});
      sets.lab.frame({act:'defect',p:.8,shot:'section',u:.1,t:282});
      desk.frame({act:'design',p:.91,shot:'room',u:.2,t:180});
      compare(first,actorSnapshot(desk,desk.frame(c)),'hidden desk '+c.act);
    }
    const s=desk.frame({act:'design',p:.6,shot:'room',u:0,t:140}).state;
    assert.equal(s.marksVisible,0);
    return {cases:cases.length,hiddenAnnotationsPenAndPrototypeIncluded:true,designHasNoStaleForecastMarks:true};
  });
  report.caseFingerprints=cases.map(c=>({shot:c.shot.id,set:c.shot.set,time:c.time,u:c.u,objects:c.baseline.objectsHash,state:c.baseline.stateHash,camera:c.baseline.poseHash}));
  check('source_snapshot_unchanged_during_run',()=>{
    for(const [name,file] of Object.entries(inputs))assert.equal(sha(fs.readFileSync(file)),report.inputSHA256[name],'Source changed during QA: '+name);
    return {files:Object.keys(inputs).length};
  });
} catch(error){report.failures.push({check:'runtime_setup_or_unhandled',message:error.message});}
report.status=report.failures.length?'FAIL':'PASS';
report.summary={checks:Object.keys(report.checks).length,passed:Object.values(report.checks).filter(c=>c.pass).length,failed:report.failures.length};
const output=JSON.stringify(report,null,2)+'\n';
if(args.out){fs.mkdirSync(path.dirname(args.out),{recursive:true});fs.writeFileSync(args.out,output);}
process.stdout.write(output);process.exitCode=report.failures.length?1:0;
