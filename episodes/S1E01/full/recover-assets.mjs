import fs from 'node:fs';
import path from 'node:path';
const [,,source,out]=process.argv;
if(!source||!out) throw new Error('Usage: node recover-assets.mjs PR4-standalone.html output-directory');
const html=fs.readFileSync(source,'utf8');
fs.mkdirSync(path.join(out,'vendor'),{recursive:true});
const imports=JSON.parse(html.match(/<script type="importmap">([\s\S]+?)<\/script>/)[1]).imports;
function decode(uri){const m=uri.match(/^data:[^,]+;base64,(.+)$/s);if(!m)throw new Error('Not a base64 data URI');return Buffer.from(m[1],'base64');}
fs.writeFileSync(path.join(out,'vendor','three.module.js'),decode(imports.three));
for(const name of ['RoomEnvironment','GLTFLoader','mergeGeometries']){
  const regex=new RegExp('import \\{'+name+'\\} from \'(data:text/javascript;base64,[^\']+)\'');
  const m=html.match(regex);if(!m)throw new Error('Missing '+name);
  let code=decode(m[1]).toString('utf8');
  const filename=name==='mergeGeometries'?'BufferGeometryUtils.js':name+'.js';
  // Preserve dependencies embedded in the original source. Three resolves through the import map.
  fs.writeFileSync(path.join(out,'vendor',filename),code);
}
const glb=html.match(/loader\.load\('(data:model\/gltf-binary;base64,[^']+)'/);
if(!glb)throw new Error('Missing original scene');
fs.writeFileSync(path.join(out,'scene.glb'),decode(glb[1]));
console.log(JSON.stringify({recovered:fs.readdirSync(path.join(out,'vendor')),scene_bytes:fs.statSync(path.join(out,'scene.glb')).size}));
