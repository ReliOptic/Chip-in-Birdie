// Bounded Node geometry/CPU picture inspection. Not browser, GPU or historical validation.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createFabHall} from './fab-hall-r8.mjs';
import {createFabHardware,transferState,FAB_DIMENSIONS} from './fab-hardware-r8.mjs';
import {diskRailContact,railHousingAttachment} from './qa-fab-contact-r8.mjs';
import {createSoftwareRenderer} from './software-renderer.mjs';
const args={};for(let i=2;i<process.argv.length;i+=2)args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
if(!args.three||!args.out)throw new Error('--three FILE --out DIR [--view nave-low --act transport --p .3 --picture yes]');
const require=createRequire(import.meta.url);let napi;
try{napi=require('@napi-rs/canvas');}catch{napi=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));}
const {createCanvas}=napi;
globalThis.document={createElement:tag=>{if(tag!=='canvas')throw new Error(tag);return createCanvas(1,1);}};
const T=await import('data:text/javascript;base64,'+fs.readFileSync(args.three).toString('base64'));
const set=createFabHall(T),k=createFabHardware(T),checks=[];
function check(name,actual){checks.push({name,passed:!!actual});if(!actual)throw new Error(name);}
const foup=k.foup({detail:true}).root;foup.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(foup),size=new T.Vector3();bounds.getSize(size);
check('FOUP envelope width .426 m',Math.abs(size.x-.426)<1e-5);
check('FOUP envelope height .338 m',Math.abs(size.y-.338)<1e-5);
check('FOUP envelope depth .355 m',Math.abs(size.z-.355)<1e-5);
const waferStack=foup.getObjectByName('25-wafer-slots');
const slotRails=foup.children.filter(o=>o.isMesh&&o.userData.kind==='wafer-slot-support');
check('FOUP has 25 real wafer meshes and 50 support shelves',waferStack.children.length===25&&slotRails.length===50);
const waferRailContacts=[],railHousingAttachments=[];
for(const yaw of[0,Math.PI]){
  foup.rotation.y=yaw;foup.position.set(.30,.9,-.27);foup.updateMatrixWorld(true);
  for(let slot=0;slot<25;slot++)for(const side of[-1,1]){
    const rail=slotRails.find(o=>o.userData.side===side&&o.userData.slot===slot);
    check('support shelf exists '+yaw+'/'+slot+'/'+side,!!rail);
    const contact=diskRailContact(T,waferStack.children[slot],rail);waferRailContacts.push({yaw,slot,side,...contact});
    check('actual disk and shelf have positive footprint intersection '+yaw+'/'+slot+'/'+side,contact.overlapArea>1e-8&&contact.diskCapVertices>=32&&contact.railCapVertices===4);
    check('actual disk underside touches shelf top '+yaw+'/'+slot+'/'+side,contact.contact);
    const housing=foup.children.find(o=>o.isMesh&&o.geometry.parameters?.width===.018&&o.geometry.parameters?.height===.268&&Math.sign(o.position.x)===side);
    const attachment=railHousingAttachment(T,rail,housing);railHousingAttachments.push({yaw,slot,...attachment});
    check('actual shelf end embeds in rounded housing triangles '+yaw+'/'+slot+'/'+side,attachment.attached);
  }
}
const lp=k.loadport({detail:true}).root;lp.updateMatrixWorld(true);const lpSize=new T.Box3().setFromObject(lp).getSize(new T.Vector3());
check('Loadport width .472 m',Math.abs(lpSize.x-.472)<1e-5);
check('Loadport height 1.386 m',Math.abs(lpSize.y-1.386)<1e-5);
let prev=transferState(0),maxDrift=0;
for(let i=0;i<=1000;i++){
  const p=i/1000,s=transferState(p);
  check('support-'+i,['gripper','gripper-and-kinematic-datum','loadport'].includes(s.podSupport));
  if(p>=.23&&p<=.84)maxDrift=Math.max(maxDrift,Math.abs(s.vehicleZ));
  if(s.landingComplete)check('datum-'+i,Math.abs(s.podBaseY-.9)<1e-9);
  if(!s.gripEngaged)check('release-after-land-'+i,s.landingComplete);
  const f=set.frame({act:'transfer',p,t:0}).state;
  if(s.landingComplete)check('plate-travels-with-pod-'+i,Math.abs(f.carrierPosition[0]-f.dockingPlatePosition[0])<1e-9&&Math.abs(f.carrierPosition[2]-f.dockingPlatePosition[2])<1e-9);
  check('FOUP-does-not-penetrate-FIMS-'+i,f.fimsGap>=-1e-9);
  check('finite-'+i,Object.values(s).every(v=>typeof v!=='number'||Number.isFinite(v)));
  check('step-continuity-'+i,Math.abs(s.podBaseY-prev.podBaseY)<.020&&Math.abs(s.vehicleZ-prev.vehicleZ)<.110);
  prev=s;
}
check('no lateral vehicle movement during lowering/raising',maxDrift<1e-9);
set.frame({act:'transfer',p:.53,t:0});set.root.updateMatrixWorld(true);
const flangeBounds=new T.Box3().setFromObject(set.actors.pod.getObjectByName('handling-flange'));
const fingerBounds=new T.Box3().setFromObject(set.actors.vehicle.jaws[0].getObjectByName('support-finger'));
check('gripper finger top meets flange underside at landing',Math.abs(fingerBounds.max.y-flangeBounds.min.y)<1e-6);
check('finger overlaps flange horizontally when gripping',fingerBounds.max.x>flangeBounds.min.x&&fingerBounds.min.x<flangeBounds.max.x&&fingerBounds.max.z>flangeBounds.min.z&&fingerBounds.min.z<flangeBounds.max.z);
const transitClearance=set.checkTransitClearances(480);
check('transit FOUP clearance over complete four-lane loop',transitClearance.collisions.length===0);
let triangles=0,drawObjects=0,instances=0;
set.root.traverse(o=>{if(o.isMesh){drawObjects++;const n=o.isInstancedMesh?o.count:1;instances+=n;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*n;}});
check('finite geometry size',Number.isFinite(triangles));
check('scene budget below 180000 triangles',triangles<180000);
const report={scope:'Node geometry tests and optional NAPI CPU triangle render; no WebGL/browser/human-viewing approval',envelope:size.toArray(),triangles,drawObjects,instances,checks:checks.length,passed:checks.every(c=>c.passed),waferRailContacts,railHousingAttachments,transitClearance,dimensions:FAB_DIMENSIONS,cameraNames:Object.keys(set.cameras)};
fs.mkdirSync(args.out,{recursive:true});
if(args.picture==='yes'){
  const frame=set.frame({act:args.act||'transport',view:args.view||'nave-low',u:.4,p:Number(args.p||.3),t:15});
  const scene=new T.Scene();scene.add(set.root);scene.background=new T.Color(frame.look.background);scene.fog=new T.Fog(frame.look.background,28,82);
  const key=new T.DirectionalLight(frame.look.key,2.0);key.position.fromArray(frame.look.lightPosition);key.target.position.set(0,1.5,0);key.castShadow=true;key.shadow.camera.left=-17;key.shadow.camera.right=17;key.shadow.camera.top=17;key.shadow.camera.bottom=-17;key.shadow.camera.near=.05;key.shadow.camera.far=70;scene.add(key,key.target);
  const fill=new T.DirectionalLight(frame.look.fill,1.3);fill.position.set(-8,4.9,-10);scene.add(fill,new T.HemisphereLight('#f3f4f0','#909594',1.35));
  const camera=new T.PerspectiveCamera(frame.fov,16/9,.01,150);camera.position.fromArray(frame.position);camera.lookAt(new T.Vector3(...frame.target));camera.updateProjectionMatrix();
  const canvas=createCanvas(1280,720),renderer=createSoftwareRenderer(T,{canvas,quality:'high'});renderer.setSize(1280,720);renderer.shadowMap.enabled=true;renderer.toneMappingExposure=1.02;
  const start=performance.now();renderer.render(scene,camera);report.renderMs=performance.now()-start;report.renderer=renderer.info;report.frame=frame;
  report.picture=path.join(args.out,'fab-r8-'+(args.view||'nave-low')+'.png');fs.writeFileSync(report.picture,canvas.toBuffer('image/png'));
}
const reportPath=path.join(args.out,'fab-r8-'+(args.view||'geometry')+'.json');
fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:report.passed,checks:report.checks,triangles,drawObjects,instances,
  waferContactPairs:waferRailContacts.length,maxContactGap:Math.max(...waferRailContacts.map(c=>Math.abs(c.verticalGap))),
  minContactArea:Math.min(...waferRailContacts.map(c=>c.overlapArea)),attachmentPairs:railHousingAttachments.length,
  minHousingEmbed:Math.min(...railHousingAttachments.map(c=>c.minEmbed)),transitCollisions:transitClearance.collisions.length,
  picture:report.picture||null,output:reportPath}));
