import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createArchiveCinema} from './archive-cinema.mjs';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage,GlobalFonts}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js');
if(!GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf','Arial'))throw new Error('QA font registration failed');
if(!GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf','Arial'))throw new Error('QA bold font registration failed');
const root=path.dirname(fileURLToPath(import.meta.url));
const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,vv)=>{if(v.startsWith('--'))a.push([v.slice(2),vv[i+1]]);return a},[]));
const base=args.archive||'/workspace/scratch/204e2295d8fd/s1e01-full-media/assets-r6/archive';
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
const images={};for(const a of manifest.assets)images[a.id]=await loadImage(path.join(base,a.file));
let script,timeline;
if(args.hero){script={sentences:[{id:'r01',chapter:'opening'}]};timeline={duration:6,sentences:[{id:'r01',chapter:'opening',start:0,end:6}]};}
else{script=JSON.parse(fs.readFileSync(path.join(root,'script.json'),'utf8'));timeline=JSON.parse(fs.readFileSync(args.timeline,'utf8'));}
const times=(args.times||'1.4,4.5').split(',').map(Number),tileW=800,tileH=450,cols=Math.min(2,times.length),rows=Math.ceil(times.length/cols);
const out=createCanvas(cols*tileW,rows*(tileH+40)),o=out.getContext('2d');o.fillStyle='#e2ddd1';o.fillRect(0,0,out.width,out.height);
const canvas=createCanvas(1600,900),film=createArchiveCinema({canvas,images,script,timeline});
const results=[];
for(let i=0;i<times.length;i++){const t=times[i],state=film.draw(t),x=(i%cols)*tileW,y=Math.floor(i/cols)*(tileH+40);o.drawImage(canvas,x,y,tileW,tileH);o.fillStyle='#15212c';o.font='16px sans-serif';o.fillText(`${t.toFixed(2)}s · ${state.shotId} · ${state.kind}`,x+14,y+tileH+27);results.push(state);}
fs.mkdirSync(path.dirname(args.out),{recursive:true});fs.writeFileSync(args.out,out.toBuffer('image/png'));
console.log(JSON.stringify({scope:args.hero?'Art direction proof only — temporary 6-second timing, not final audio sync':'Node Canvas render of actual measured timeline — not browser performance',out:args.out,samples:results}));
