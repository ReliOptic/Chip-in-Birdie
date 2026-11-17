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
const sourceHashes=new Map();
function source(name){const file=path.join(root,name);sourceHashes.set(file,hash(file));return fs.readFileSync(file,'utf8');}
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const indexHash=hash(path.join(dist,'index.html'));
assert(!/__FILM_DATA__|__ENTRY_MODULE__|__IMPORT_MAP__/.test(html));
const data=JSON.parse(html.match(/<script id="film-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const importMap=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
const script=JSON.parse(source('script.json'));
assert.equal(data.script.revision,script.revision);
assert.equal(data.timeline.source_script_sha256,sourceHashes.get(path.join(root,'script.json')));
assert.deepEqual(data.script,script);
assert.deepEqual(data.claims,JSON.parse(source('claims.json')).claims);
assert.deepEqual(data.sources,JSON.parse(source('sources.json')));
assert.equal(data.notices,source('THIRD_PARTY_NOTICES.txt'));
assert.equal(fs.readFileSync(path.join(dist,'THIRD_PARTY_NOTICES.txt'),'utf8'),data.notices);
assert.equal(data.timeline.total_samples/data.timeline.sample_rate,data.timeline.duration);
assert.equal(data.timeline.sentences.length,script.sentences.length);
const chapters=script.chapters.map(chapter=>chapter.id);
assert.ok(chapters.length>0);assert.equal(new Set(chapters).size,chapters.length);
assert.deepEqual(data.timeline.sentences.filter((row,i)=>!i||data.timeline.sentences[i-1].chapter!==row.chapter).map(row=>row.chapter),chapters);
for(let i=0;i<script.sentences.length;i++){
  for(const key of ['id','en','ko','chapter','shot','phase','world'])assert.equal(data.timeline.sentences[i][key],script.sentences[i][key],`Timeline ${i} ${key}`);
  assert.deepEqual(data.timeline.sentences[i].claim,script.sentences[i].claim);
}
assert.equal(data.assets.scene,'./scene.glb');assert.equal(data.assets.narration,'./narration.mp3');
assert.equal(hash(path.join(dist,'narration.mp3')),data.audio_sha256);
assert.equal(data.audio_sha256,data.timeline.outputs.mp3.sha256);
assert.equal(importMap.imports.three,'./vendor/three.module.js');
const loader=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
new vm.SourceTextModule(loader);
const entry=loader.match(/import\(['"]([^'"]+)['"]\)/)[1];assert.equal(entry,'./film.mjs');
const template=html
  .replace(/(<script id="film-data" type="application\/json">)[\s\S]*?(<\/script>)/,'$1__FILM_DATA__$2')
  .replace(/(<script type="importmap">)[\s\S]*?(<\/script>)/,'$1__IMPORT_MAP__$2')
  .replace(entry,'__ENTRY_MODULE__');
assert.equal(template,source('player.html'),'Site template must match current repository source');
const checked=new Set();
function checkModule(file){if(checked.has(file))return;checked.add(file);const embedded=file.startsWith('data:');
  if(embedded)assert.match(file,/^data:text\/javascript;base64,/,'Embedded vendor dependency must be a JavaScript data URI');
  const code=embedded?Buffer.from(file.slice(file.indexOf(',')+1),'base64').toString('utf8'):fs.readFileSync(file,'utf8');
  const name=embedded?'embedded vendor module':path.relative(dist,file);
  if(!embedded&&!name.startsWith('vendor'+path.sep))assert.equal(code,source(name),name+' must match current repository source');
  for(const spec of new vm.SourceTextModule(code).dependencySpecifiers){
    if(spec.startsWith('data:')){checkModule(spec);continue;}
    const mapped=spec.startsWith('.')?spec:importMap.imports[spec];
    assert(mapped&&mapped.startsWith('.'),'Unexpected external/unmapped import: '+spec);
    assert(!embedded||!spec.startsWith('.'),'A data URI module cannot resolve relative imports');
    const child=path.resolve(spec.startsWith('.')?path.dirname(file):dist,mapped);
    assert(child.startsWith(dist+path.sep),'Dependency escapes Site: '+child);assert(fs.existsSync(child),'Missing dependency '+child);checkModule(child);
  }
}
checkModule(path.resolve(dist,entry));assert(checked.has(path.join(dist,'vendor/three.module.js')),'Three must be reachable through the actual module graph');
const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate element id');
const glb=fs.readFileSync(path.join(dist,'scene.glb'));assert.equal(glb.toString('ascii',0,4),'glTF');
assert.equal(glb.readUInt32LE(4),2);assert.equal(glb.readUInt32LE(8),glb.length);
const gltf=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());assert((gltf.buffers||[]).every(x=>!x.uri));assert((gltf.images||[]).every(x=>!x.uri));
const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else{const bytes=fs.statSync(p).size;assert(bytes<25*1024*1024,'Static asset exceeds 25 MiB');files.push({path:path.relative(dist,p),bytes,sha256:hash(p)})}}}walk(dist);
assert.equal(hash(path.join(dist,'index.html')),indexHash,'Site index changed during QA');
for(const [file,sha256]of sourceHashes)assert.equal(hash(file),sha256,'Source changed during QA: '+file);
console.log(JSON.stringify({scope:'Static Site file/dependency/source/asset integrity. No HTTP, browser, playback or listening.',status:'PASS',revision:script.revision,duration:data.timeline.duration,utterances:script.sentences.length,chapters:chapters.length,modules:checked.size,embeddedModules:Array.from(checked).filter(file=>file.startsWith('data:')).length,sourceSHA256:Object.fromEntries(Array.from(sourceHashes,([file,sha256])=>[path.relative(root,file),sha256])),qaScriptSHA256:hash(fileURLToPath(import.meta.url)),files},null,2));
