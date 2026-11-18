/** R8 original edit. Every composition is new; no R1–R7 set or shot is imported.
 * The repeated physical carrier is continuity, not replayed footage. Editorial
 * event clocks span cuts; the actor never restarts because the camera changes.
 */
const spatial=(set,act,view,more={})=>({kind:'spatial',set,act,view,...more});
const graphic=(view,more={})=>({kind:'editorial',set:'editorial',act:view,view,...more});
const photo=(id,heading,more={})=>({kind:'photo',set:'editorial',act:'photo',view:id,assetIds:[id],heading,...more});
export const FAB_EDIT={
 f01:[spatial('hall','queue','cross-aisle',{heading:'IDLE DOES NOT MEAN AVAILABLE',callout:'qualification'}),spatial('hall','queue','buffer-level',{callout:'waiting'})],
 f02:[graphic('order',{heading:'A design is not a delivery.'})],
 f03:[graphic('roles',{heading:'One sentence. Two businesses.'})],
 f04:[spatial('hall','opening','nave-low',{heading:'Inside a modern fab',p0:.05,p1:.15}),spatial('hall','opening','bridge-high',{p0:.15,p1:.24})],
 f05:[photo('lcn_lab_2013','Even the room is part of production.'),spatial('facility','airflow','section-wide',{heading:'Air above. Services below.'}),spatial('facility','subfab','service-canyon')],
 f06:[spatial('hall','transport','ceiling',{p0:0,p1:.20,callout:'sealed'}),spatial('hall','transport','rail-follow',{p0:.20,p1:.3541666667})],
 f07:[spatial('hall','transfer','hoist-side',{event:'handoff',heading:'01 / DELIVER',camera:{position:[-.1,3.5,-3.2],target:[-2.60,2.85,0],fov:48}}),spatial('hall','transfer','hoist-side',{event:'handoff',callout:'hoist'})],
 f08:[spatial('hall','transfer','dock-macro',{event:'handoff',callout:'dock'}),spatial('process','efem','interlock',{event:'load',heading:'02 / ENTER THE TOOL'})],
 f09:[spatial('process','efem','blade',{event:'load'}),spatial('process','efem','wafer',{event:'load'}),spatial('process','efem','robot',{event:'load'})],
 f10:[spatial('process','process','chamber',{p0:.20,p1:.72,heading:'03 / CHANGE THE SURFACE'}),spatial('process','process','layers',{event:'process'})],
 f11:[spatial('process','process','pattern',{event:'process',callout:'pattern'}),spatial('process','process','etch',{event:'process',callout:'etch'})],
 f12:[graphic('route',{heading:'Not one trip through a factory.'})],
 f13:[graphic('routes',{heading:'The route belongs to the product.'})],
 f14:[spatial('hall','transport','traverse',{p0:.55,p1:.75,heading:'Moving faster is not processing faster.'}),spatial('process','process','gate',{p0:.44,p1:.62,heading:'Transport cannot shorten the recipe.'})],
 f15:[graphic('qualification',{heading:'Two tools. One eligible path.'})],
 f16:[graphic('matrix',{heading:'Qualified for which operation?'})],
 f17:[graphic('alternative',{heading:'A second qualified path changes the queue.'})],
 f18:[graphic('queue',{heading:'Where the waiting comes from.'})],
 f19:[graphic('clocks',{heading:'Two measures. Not the same thing.'})],
 f20:[spatial('facility','subfab','utility-riser',{heading:'Invest in the constraint.'}),graphic('levers')],
 f21:[photo('intel_d1x_cranes_2011','A building is only one milestone.'),graphic('milestones')],
 f22:[spatial('facility','metrology','bay-entry',{event:'measure',heading:'04 / FIND OUT WHAT ACTUALLY WORKS'}),spatial('facility','metrology','wafer-stage',{event:'measure'})],
 f23:[spatial('facility','metrology','objective-close',{event:'measure'}),graphic('measurement',{heading:'A measurement becomes a decision.'})],
 f24:[graphic('design',{heading:'A drawing must survive a process.'})],
 f25:[graphic('window',{heading:'Performance is only part of the target.'})],
 f26:[graphic('containment',{heading:'Finding a defect does not undo it.'})],
 f27:[graphic('efoundry',{heading:'What crosses the company boundary?'})],
 f28:[graphic('collaboration',{heading:'Not just a shipment notification.'})],
 f29:[graphic('handoff-data',{heading:'The company boundary is not the end of the work.'})],
 f30:[spatial('hall','docked','quiet-operator',{heading:'Access to an organization. Not just a machine.'})],
 f31:[graphic('founding',{heading:'1987 / A manufacturer without a chip brand.'})],
 f32:[graphic('report',{heading:'1997 / “Virtual Fab”'})],
 f33:[graphic('customers',{heading:'One manufacturing system. Many products.'})],
 f34:[graphic('commitments',{heading:'The factory still needed orders.'})],
 f35:[spatial('facility','exterior','structural-build',{heading:'Investment happens before delivery.'})],
 f36:[graphic('filing',{heading:'NVIDIA / A disclosed manufacturing risk.'})],
 f37:[graphic('wafer-risk',{heading:'The risk did not leave with the factory.'})],
 f38:[graphic('joint-work',{heading:'Neither company could solve it alone.'})],
 f39:[spatial('process','package','tray',{event:'package',heading:'05 / BECOME A PRODUCT'}),spatial('process','package','substrate',{event:'package'}),spatial('process','package','lid',{event:'package'})],
 f40:[spatial('process','package','outgoing',{p0:.98,p1:1}),spatial('facility','exterior','logistics-close',{heading:'Material + information, at every hand-off.'})],
 f41:[spatial('hall','docked','long-lens',{heading:'An order is not yet production.'})],
 f42:[spatial('facility','airflow','return-rise'),spatial('hall','docked','service',{heading:'Capacity. Stability. Coordination.'})],
 f43:[graphic('ownership',{heading:'A second route into the chip business.'})],
 f44:[graphic('news',{heading:'The three questions behind a fab headline.'})],
 f45:[spatial('facility','exterior','commissioned-dusk',{heading:'A factory others can build a business on.',ending:true})]
};
export function buildFabShots(script,timeline){
 const rows=timeline.sentences,duration=timeline.duration_seconds||timeline.duration;
 const at=id=>rows.find(r=>r.id===id);const end=id=>{const i=rows.findIndex(r=>r.id===id);return rows[i+1]?.start??duration;};
 const interfaceCut=(at('f08').start+end('f08'))/2;
 const processDetailStart=(at('f10').start+end('f10'))/2;
 const events={handoff:[at('f07').start,interfaceCut],load:[interfaceCut,end('f09')],process:[processDetailStart,end('f11')],measure:[at('f22').start,end('f23')],package:[at('f39').start,end('f39')]};
 const result=[];
 for(let i=0;i<rows.length;i++){
  const r=rows[i],plan=FAB_EDIT[r.id];if(!plan)throw new Error('Missing R8 authored shot coverage: '+r.id);
  const start=i===0?0:r.start,stop=rows[i+1]?.start??duration;
  plan.forEach((s,j)=>{const t0=start+(stop-start)*j/plan.length,t1=start+(stop-start)*(j+1)/plan.length,bounds=s.event?events[s.event]:[t0,t1],p0=s.p0??(s.event==='load'?.16:0),p1=s.p1??1;result.push({...s,p0,p1,id:`r8-${r.id}-${j+1}`,rowId:r.id,t0,t1,event:s.event||r.id,eventT0:bounds[0],eventT1:bounds[1],eventClock:{t0:bounds[0],t1:bounds[1],p0,p1},assetIds:s.assetIds||[],ordinal:result.length+1,priorShotReuse:false,composition:`r8/${r.id}/${s.set}/${s.act}/${s.view}/${j+1}`});});
 }
 if(result[0].t0!==0||Math.abs(result.at(-1).t1-duration)>1e-7)throw new Error('Edit does not span actual narration');
 for(let i=1;i<result.length;i++)if(Math.abs(result[i-1].t1-result[i].t0)>1e-7)throw new Error('Edit gap or overlap');
 return result;
}
export function eventProgress(shot,time){
 const p=Math.max(0,Math.min(1,(time-shot.eventT0)/(shot.eventT1-shot.eventT0)));
 return (shot.p0??0)+p*((shot.p1??1)-(shot.p0??0));
}
