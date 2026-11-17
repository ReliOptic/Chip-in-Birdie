/** Static source/asset integrity only. This does not open a browser. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const dist=path.resolve(process.argv[2]||'');
assert(process.argv[2],'Usage: node --experimental-vm-modules qa-site.mjs /absolute/Site/dist');
assert(vm.SourceTextModule,'Run with --experimental-vm-modules');
const root=path.dirname(fileURLToPath(import.meta.url));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
assert(!/__FILM_DATA__|__ENTRY_MODULE__|__IMPORT_MAP__/.test(html));
const data=JSON.parse(html.match(/<script id="film-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const importMap=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.script.revision,'S1E01-full-r4');
assert.equal(data.timeline.source_script_sha256,hash(path.join(root,'script.json')));
assert.deepEqual(data.script,JSON.parse(fs.readFileSync(path.join(root,'script.json'))));
assert.equal(data.assets.scene,'./scene.glb');assert.equal(data.assets.narration,'./narration.mp3');
assert.equal(hash(path.join(dist,'narration.mp3')),data.audio_sha256);
assert.equal(importMap.imports.three,'./vendor/three.module.js');
const checked=new Set();
function checkModule(file){if(checked.has(file))return;checked.add(file);const code=fs.readFileSync(file,'utf8');
  for(const spec of new vm.SourceTextModule(code).dependencySpecifiers){
    if(spec==='three'||spec.startsWith('data:'))continue;
    assert(spec.startsWith('.'),'Unexpected external/bare import: '+spec);
    const child=path.resolve(path.dirname(file),spec);assert(child.startsWith(dist+path.sep));assert(fs.existsSync(child),'Missing dependency '+child);checkModule(child);
  }
}
checkModule(path.join(dist,'film.mjs'));checkModule(path.join(dist,'vendor/three.module.js'));
for(const name of ['film.mjs','worlds.mjs','mechanisms.mjs','cinema.mjs','software-renderer.mjs'])assert.equal(hash(path.join(dist,name)),hash(path.join(root,name)),name+' must match current repository source');
const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate element id');
const glb=fs.readFileSync(path.join(dist,'scene.glb'));assert.equal(glb.toString('ascii',0,4),'glTF');
const gltf=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());assert((gltf.buffers||[]).every(x=>!x.uri));assert((gltf.images||[]).every(x=>!x.uri));
const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else{const bytes=fs.statSync(p).size;assert(bytes<25*1024*1024,'Static asset exceeds 25 MiB');files.push({path:path.relative(dist,p),bytes,sha256:hash(p)})}}}walk(dist);
console.log(JSON.stringify({scope:'Static Site file/dependency/source/asset integrity. No HTTP, browser, playback or listening.',status:'PASS',duration:data.timeline.duration,modules:checked.size,files},null,2));
