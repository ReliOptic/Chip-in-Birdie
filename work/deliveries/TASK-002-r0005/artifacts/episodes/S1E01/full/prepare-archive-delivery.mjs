// Lossy delivery compression only. Originals, attribution and dates are retained.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('sharp');
const [source,out]=process.argv.slice(2);if(!source||!out)throw new Error('source archive directory and NEW output directory required');
if(path.resolve(source)===path.resolve(out))throw new Error('Never overwrite the source archive');
const original=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');fs.mkdirSync(out,{recursive:true});
const assets=[];
for(const a of original.assets){
  const input=fs.readFileSync(path.join(source,a.file));if(a.sha256&&hash(input)!==a.sha256)throw new Error('Source mismatch '+a.id);
  const buffer=await sharp(input).rotate().resize({width:1920,height:1920,fit:'inside',withoutEnlargement:true}).webp({quality:91,effort:5}).toBuffer();
  const filename=a.id+'.webp';fs.writeFileSync(path.join(out,filename),buffer);
  assets.push({...a,file:filename,bytes:buffer.length,sha256:hash(buffer),delivery_source_sha256:hash(input),delivery_modification:'R7: WebP q91 encoding, maximum dimension 1920px, EXIF orientation normalized; no generative editing, retouching or changed historical content. Original source/licence/date and applicable ShareAlike terms retained.'});
}
const manifest={...original,project:'Chip in Birdie S1E01 R7',path_base:path.resolve(out),global_usage_notes:original.global_usage_notes.filter(n=>!n.includes('locally altered')).concat(['R7 delivery derivatives are WebP encoded, maximum dimension 1920px. Source files remain preserved separately. Attribution/licence and modification notice travel with each image.']),assets};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({assets:assets.length,bytes:assets.reduce((sum,a)=>sum+a.bytes,0),manifest:path.join(out,'manifest.json')}));
