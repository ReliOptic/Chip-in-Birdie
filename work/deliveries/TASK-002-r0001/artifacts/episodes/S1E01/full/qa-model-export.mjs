/** CPU geometry/camera inspection export. This does NOT validate WebGL or the player. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const {createCanvas} = createRequire(import.meta.url)('@napi-rs/canvas');
import {createWorlds} from './worlds.mjs';
import {createMechanisms} from './mechanisms.mjs';

const [assetsDir, outDir] = process.argv.slice(2);
if (!assetsDir || !outDir) throw new Error('Usage: node qa-model-export.mjs ASSETS OUT');
const moduleText = fs.readFileSync(path.join(assetsDir, 'vendor/three.module.js'));
const T = await import('data:text/javascript;base64,' + moduleText.toString('base64'));
globalThis.document = {createElement(tag) {
  if (tag !== 'canvas') throw new Error('Unsupported DOM request: ' + tag);
  return createCanvas(1, 1);
}};
fs.mkdirSync(outDir, {recursive: true});
const worlds = {...createWorlds(T), ...createMechanisms(T)};
const cases = [
  ['design', 'intro', .5], ['archive', 'partners', .5], ['archive', 'charter', .5], ['archive', 'visit', .5],
  ['boundary', 'close', .8], ['layers', 'coat', .8], ['layers', 'etch', .8],
  ['layers', 'align', .8], ['testing', 'probe', .65], ['capacity', 'queue', .65],
  ['return', 'package', .8], ['return', 'final', .5],
];
const textures = new Map();
function material(m, color) {
  let texture = null;
  if (m.map?.image?.toBuffer) {
    if (!textures.has(m.map.uuid)) {
      const name = 'texture-' + textures.size + '.png';
      fs.writeFileSync(path.join(outDir, name), m.map.image.toBuffer('image/png'));
      textures.set(m.map.uuid, name);
    }
    texture = textures.get(m.map.uuid);
  }
  return {color: (color || m.color).toArray(), roughness: m.roughness ?? .5,
    metalness: m.metalness ?? 0, opacity: m.opacity ?? 1, texture,
    emissive: m.emissive?.toArray() || [0,0,0], emissiveIntensity: m.emissiveIntensity || 0};
}
for (const [world, phase, u] of cases) {
  const w = worlds[world]; w.update(u, phase); w.root.updateMatrixWorld(true);
  const meshes = [];
  w.root.traverse(o => {
    if (!o.isMesh) return;
    for (let p=o; p; p=p.parent) if (!p.visible) return;
    const g=o.geometry, count=o.isInstancedMesh?o.count:1;
    for (let i=0;i<count;i++) {
      const matrix=o.matrixWorld.clone(), instance=new T.Matrix4();
      let color=null;
      if(o.isInstancedMesh){o.getMatrixAt(i,instance);matrix.multiply(instance);
        if(o.instanceColor){color=new T.Color();o.getColorAt(i,color);color.multiply(o.material.color)}}
      const p=g.attributes.position, vertices=[];
      for(let n=0;n<p.count;n++){const v=new T.Vector3().fromBufferAttribute(p,n).applyMatrix4(matrix);vertices.push([v.x,-v.z,v.y])}
      const idx=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,n)=>n);
      const faces=[];for(let n=0;n<idx.length;n+=3)faces.push(idx.slice(n,n+3));
      meshes.push({vertices,faces,uv:g.attributes.uv?Array.from(g.attributes.uv.array):null,material:material(o.material,color)});
    }
  });
  const q=u*u*(3-2*u), c=w.camera;
  const position=new T.Vector3(...c.from).lerp(new T.Vector3(...c.to),q).toArray();
  const toBlender=p=>[p[0],-p[2],p[1]];
  const data={scope:'Geometry/camera inspection in Blender Cycles; NOT WebGL/player verification',world,phase,u,
    camera:{position:toBlender(position),target:toBlender(c.target),fov:c.fov},meshes};
  fs.writeFileSync(path.join(outDir,world+'-'+phase+'.json'),JSON.stringify(data));
  console.log(JSON.stringify({world,phase,meshes:meshes.length,triangles:meshes.reduce((n,m)=>n+m.faces.length,0)}));
}
