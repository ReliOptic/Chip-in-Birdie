/** Assemble only compiled media, reproduction inputs and bounded QA; Git is the source-code record. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here=path.dirname(fileURLToPath(import.meta.url)), args={};
for(let i=2;i<process.argv.length;i+=2)args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
for(const key of ['assets','audio','delivery','out'])if(!args[key])throw new Error('Missing --'+key);
const out=path.resolve(args.out);
if(fs.existsSync(out))throw new Error('Choose a new output directory; an earlier package is never overwritten');
fs.mkdirSync(out,{recursive:true});
const entries=[];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function add(source,target){const bytes=fs.readFileSync(source),dest=path.join(out,target);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);entries.push({path:target,bytes:bytes.length,sha256:sha(bytes)});}
function text(target,content){const dest=path.join(out,target);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);entries.push({path:target,bytes:Buffer.byteLength(content),sha256:sha(content)});}
add(path.join(args.delivery,'S1E01-full-documentary.html'),'S1E01-full-documentary.html');
for(const name of ['captions.en.vtt','captions.ko.vtt','script.json','claims.json','sources.json','THIRD_PARTY_NOTICES.txt'])add(path.join(args.delivery,name),name);
for(const name of ['narration.wav','narration.mp3','timeline.json','asr-proxy.json'])add(path.join(args.audio,name),'audio/'+name);
add(path.join(args.assets,'scene.glb'),'assets/scene.glb');
for(const name of ['three.module.js','RoomEnvironment.js','GLTFLoader.js','BufferGeometryUtils.js'])add(path.join(args.assets,'vendor',name),'assets/vendor/'+name);
for(const name of ['verification.md','review-fresh-viewer.md','qa-contract-results.json','results.json','audio-env.md','rights.md'])add(path.join(here,name),'review/'+name);
if(args.inspection){
  for(const name of ['design-intro','archive-partners','archive-charter','archive-visit','boundary-close','layers-coat','layers-etch','layers-align','testing-probe','capacity-queue','return-package','return-final','fab-handoff'])add(path.join(args.inspection,name+'.png'),'model-inspection/'+name+'.png');
  text('model-inspection/README.md','# CPU geometry inspection — NOT movie frames\n\nThese thirteen Blender Cycles renders use exported Three.js geometry/cameras but a separate lighting/shader pipeline. They inspect model composition only. They are not WebGL screenshots, browser playback evidence, final-film frames or a representation of the finished grade. Source reproduction tools are in the PR.\n');
}
const timeline=JSON.parse(fs.readFileSync(path.join(args.audio,'timeline.json'),'utf8'));
text('README.md',`# S1E01 full-r3 — 3D documentary review build\n\n**TSMC — The Factory That Chose Not to Compete**\n\nFull English narration: 9:00.177 (${timeline.duration} seconds), 61 utterances. Korean/English subtitles, 10 chapters, 8 world families, 41 named shots / 44 phase beats.\n\n## Open\n\nOpen S1E01-full-documentary.html in a WebGL2-capable desktop browser and press Play. It embeds its narration and runtime assets; no CDN is required. A local HTTP server is an alternative when browser file-origin rules prevent opening embedded modules. A phone file preview is not a tested WebGL browser.\n\n## Status\n\nFULL-LENGTH REVIEW BUILD, NOT RELEASE READY. Actual full-browser playback, mobile layout, actual OfflineAudioContext rendering, human listening and independent audiovisual review remain unverified. The 22 static/mock contract checks and 440 CPU state comparisons are not those tests. No MP4 or publication is included.\n\n## Contents\n\n- HTML: compiled playable artifact.\n- audio/: real WAV/MP3 narration, actual sample timeline and bounded ASR comparison.\n- assets/: original PR #4 GLB and exact Three.js r170 dependency set.\n- VTT + JSON: captions, viewer script and claim/source data embedded in the HTML.\n- review/: scoped QA, voice provenance and rights notes.\n- model-inspection/: separate CPU model renders, NOT WebGL movie frames.\n\n## Source and reproduction\n\nSource: https://github.com/ReliOptic/Chip-in-Birdie/pull/4\nDirectory: episodes/S1E01/full/\n\nFrom that repository, run:\n\n    node episodes/S1E01/full/build.mjs --assets /path/to/this-bundle/assets --audio /path/to/this-bundle/audio --out /path/to/rebuilt\n\nKeep THIRD_PARTY_NOTICES.txt with this bundle. Kokoro weights/voice database are not redistributed. Narration and models are synthetic/authored, not historical interview recordings or real TSMC facility imagery.\n`);
const manifest={schema:'cib-s1e01-compiled-media-v1',revision:'S1E01-full-r3',status:'REVIEW_BUILD_NOT_READY',sourcePR:'https://github.com/ReliOptic/Chip-in-Birdie/pull/4',duration:timeline.duration,releaseApproval:false,files:entries.sort((a,b)=>a.path.localeCompare(b.path))};
fs.writeFileSync(path.join(out,'media-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const zipPath=out+'.zip';if(fs.existsSync(zipPath))throw new Error('ZIP already exists; choose a new output directory');
const zipped=spawnSync('zip',['-q','-r',zipPath,'.'],{cwd:out,encoding:'utf8'});if(zipped.status!==0)throw new Error(zipped.stderr||'zip failed');
const zip=fs.readFileSync(zipPath);
console.log(JSON.stringify({directory:out,zip:zipPath,bytes:zip.length,sha256:sha(zip),files:entries.length+1,duration:timeline.duration,releaseApproval:false}));
