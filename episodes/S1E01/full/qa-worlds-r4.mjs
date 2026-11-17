/** Producer-only CPU construction QA. NOT browser, WebGL, sound or release QA.
 * node qa-worlds-r4.mjs ASSETS [EXPORT_DIR]
 * Optional exports are source geometry + production camera, for static Cycles
 * inspection only. Never represent them as pixels from the actual film player.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {createWorlds} from './worlds.mjs';
const [assets,exportDir]=process.argv.slice(2);
assert(assets,'Usage: node qa-worlds-r4.mjs ASSETS [EXPORT_DIR]');
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
globalThis.document={createElement(tag){assert.equal(tag,'canvas');return createCanvas(1,1)}};
const T=await import('data:text/javascript;base64,'+fs.readFileSync(path.join(assets,'vendor/three.module.js')).toString('base64'));
const worlds=createWorlds(T),samples=[0,.1,.3,.5,.7,.9,1];
const phases={design:['drawing','alternatives','separate','independent','fit','violation','repair'],
  archive:['1985','capital','partners','contracts','charter','cirrus','visit'],
  boundary:['open','close','return','risk'],return:['die','package','together','final']};
function snapshot(w,phase,u){
  w.update(u,phase);w.root.updateMatrixWorld(true);
  const state=[];let visibleTriangles=0;
  w.root.traverse(o=>{
    for(const n of [...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()])assert(Number.isFinite(n));
    state.push({name:o.name,type:o.type,v:o.visible,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray()});
    if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(!p.visible)return;
    visibleTriangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);
  });
  const c=w.cameraAt(u,phase);
  for(const n of [...c.position,...c.target,c.fov])assert(Number.isFinite(n));
  assert(c.fov>=25&&c.fov<=60,'Lens range');assert(visibleTriangles<200000,'Per-world triangle budget');
  const hash=crypto.createHash('sha256').update(JSON.stringify({state,model:w.state(),camera:c})).digest('hex');
  return {hash,visibleTriangles,camera:c};
}
const cases=[];let compared=0;
for(const[name,list]of Object.entries(phases))for(const phase of list)for(const u of samples){
  const w=worlds[name],a=snapshot(w,phase,u);for(const p of list.slice().reverse())snapshot(w,p,1-u);
  const b=snapshot(w,phase,u);assert.equal(a.hash,b.hash,`${name}/${phase}/${u} history independence`);compared++;
  cases.push({world:name,phase,u,...a});
}
worlds.design.update(0,'repair');const g0=worlds.design.state().spacingGap;
worlds.design.update(1,'repair');const g1=worlds.design.state().spacingGap;assert(g1>g0*5);
worlds.boundary.update(1,'risk');assert(worlds.boundary.state().competitionBranchClosed);assert(worlds.boundary.state().capacityBlocked);
worlds.return.update(1,'final');assert(!worlds.return.state().opaqueLid);assert(worlds.return.state().recurringLayoutVisible);
const a=worlds.return.cameraAt(1,'together'),b=worlds.return.cameraAt(0,'final');
assert.deepEqual(a.position,b.position);assert.deepEqual(a.target,b.target);assert.equal(a.fov,b.fov);
const report={scope:'CPU geometry, camera and history-independent state only',producerCheck:true,
  browser:false,webgl:false,playback:false,listening:false,releaseApproval:false,
  source_sha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('./worlds.mjs',import.meta.url))).digest('hex'),
  testedCases:compared,maximumVisibleTriangles:Math.max(...cases.map(c=>c.visibleTriangles)),spacingGap:[g0,g1],
  finalLayoutExposed:true,finalCameraContinuous:true,cases};
console.log(JSON.stringify({...report,cases:undefined},null,2));
if(exportDir){
  fs.mkdirSync(exportDir,{recursive:true});fs.writeFileSync(path.join(exportDir,'qa-worlds-r4.json'),JSON.stringify(report,null,2));
  const textures=new Map(),toBlender=p=>[p[0],-p[2],p[1]];
  function material(m,color){
    let texture=null;if(m.map?.image?.toBuffer){
      if(!textures.has(m.map.uuid)){const file='texture-'+textures.size+'.png';fs.writeFileSync(path.join(exportDir,file),m.map.image.toBuffer('image/png'));textures.set(m.map.uuid,file)}
      texture=textures.get(m.map.uuid);
    }
    return {color:(color||m.color).toArray(),roughness:m.roughness??.5,metalness:m.metalness??0,
      opacity:m.opacity??1,texture,emissive:m.emissive?.toArray()||[0,0,0],emissiveIntensity:m.emissiveIntensity||0};
  }
  for(const[name,phase,u,tag]of [['design','drawing',.04,'opening-macro'],['design','drawing',.96,'opening-question'],
    ['archive','partners',.80,'capital-partners'],['return','final',.80,'final-return']]){
    const w=worlds[name];w.update(u,phase);w.root.updateMatrixWorld(true);const meshes=[];
    w.root.traverse(o=>{
      if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(!p.visible)return;
      const g=o.geometry,count=o.isInstancedMesh?o.count:1;
      for(let i=0;i<count;i++){
        const matrix=o.matrixWorld.clone(),inst=new T.Matrix4();let color=null;
        if(o.isInstancedMesh){o.getMatrixAt(i,inst);matrix.multiply(inst);if(o.instanceColor){color=new T.Color();o.getColorAt(i,color);color.multiply(o.material.color)}}
        const vertices=[];for(let n=0;n<g.attributes.position.count;n++)vertices.push(toBlender(new T.Vector3().fromBufferAttribute(g.attributes.position,n).applyMatrix4(matrix).toArray()));
        const idx=g.index?Array.from(g.index.array):Array.from({length:vertices.length},(_,n)=>n),faces=[];
        for(let n=0;n<idx.length;n+=3)faces.push(idx.slice(n,n+3));
        meshes.push({vertices,faces,uv:g.attributes.uv?Array.from(g.attributes.uv.array):null,material:material(o.material,color)});
      }
    });
    const c=w.cameraAt(u,phase);fs.writeFileSync(path.join(exportDir,tag+'.json'),JSON.stringify({
      scope:'CPU geometry / production camera static inspection only; not WebGL or actual player',world:name,phase,u,
      camera:{position:toBlender(c.position),target:toBlender(c.target),fov:c.fov},meshes}));
  }
}
