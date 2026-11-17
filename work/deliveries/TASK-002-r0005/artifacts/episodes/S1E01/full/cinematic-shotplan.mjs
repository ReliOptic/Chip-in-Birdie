import {PLANS} from './archive-shotplan.mjs';

// A scene is a stateful EVENT, not a rotating object. Each event has a single
// absolute clock; camera coverage can change without restarting the action.
const spatial=(set,act,view,event,extra={})=>({kind:'spatial',assetIds:[],set,act,view,event,cut:'hard',...extra});
const archive=(row,index,extra={})=>({...PLANS[row][index],...extra});
export const FILM_PLANS={...PLANS,
  r01:[spatial('pc','blocked','slot','opening',{heading:'A slot waiting for a graphics card.',motive:'Start inside the machine with the physical absence the ending will resolve.'})],
  r02:[spatial('pc','blocked','room','opening',{weight:.46,heading:'1997 · The product was wanted.',motive:'Reveal the whole unpowered computer around the empty connector.'}),spatial('factory','shipping-shortfall','tray','shortfall',{weight:.54,heading:'Not enough to ship.',motive:'Cut from the waiting computer to missing output.'})],
  r04:[spatial('pc','blocked','tray','opening',{weight:.40,motive:'A customer-side tray is empty too.'}),spatial('pc','blocked','room','opening',{weight:.60,heading:'Design is not delivery.',motive:'Return to the unpowered computer after the filing explains the shortfall.'})],
  r12:[spatial('factory','overflow','aisle','overflow',{weight:.58,heading:'Work arrives from somebody else’s factory.'}),spatial('factory','overflow','handoff','overflow',{weight:.42})],
  r13:[spatial('factory','overflow','dock','overflow',{heading:'Then it goes back.',motive:'The same cart reverses direction when the customer has room again.'})],
  r14:[spatial('factory','overflow','idle','overflow',{weight:.56,heading:'The equipment stays.'}),spatial('factory','overflow','wide','overflow',{weight:.44,heading:'The orders do not.',motive:'An empty physical bay remains after the customer’s cart leaves.'})],
  r15:[spatial('desk','design','room','design',{weight:.34,heading:'A different kind of customer.'}),spatial('desk','design','drawing','design',{weight:.36}),spatial('desk','design','prototype','design',{weight:.30,heading:'A product budget. Not a factory budget.'})],
  r20:[spatial('desk','design','prototype','design',{weight:.46,heading:'Develop a product.'}),spatial('factory','capacity','bay','capital',{weight:.54,heading:'Someone else owns the production capacity.',motive:'A scale-changing match cut makes the two investments physically different.'})],
  r21:[spatial('desk','design','wide','design',{weight:.40,heading:'Could more designers become companies?'}),archive('r21',1,{weight:.60})],
  r24:[archive('r24',0,{weight:.30}),spatial('pc','assembly','room','assembly',{weight:.16,heading:'Later: a 1990s PC.',motive:'Explicit date cut separates the real 1981 IBM from the later illustrative assembly.'}),spatial('pc','assembly','board','assembly',{weight:.20}),spatial('pc','assembly','contact','assembly',{weight:.21,motive:'Stay through physical seating, then cut to the display.'}),spatial('pc','assembly','screen','assembly',{weight:.13,motive:'Electrical contact now has a visible consequence.'})],
  r26:[spatial('factory','shipping','tray','orders',{weight:.40,heading:'A design win becomes production.'}),spatial('factory','shipping','dispatch','orders',{weight:.60,heading:'Not just overflow.',motive:'A completed product leaves through the loading door.'})],
  r27:[archive('r27',0,{weight:.49}),spatial('factory','capacity','equipment','dependable',{weight:.51,heading:'A dependable process, while the customer grows.'})],
  r30:[archive('r30',0,{weight:.54}),spatial('lab','inspection','probe','test',{weight:.46,heading:'Paid for. Not all usable.'})],
  r31:[spatial('lab','inspection','reject','test',{weight:.40,heading:'Cash spent. Output still short.',motive:'The result tray is the consequence of the electrical test, not a made-up historical yield.'}),spatial('lab','defect','section','defect',{weight:.60,heading:'One possible failure mechanism.',motive:'A clearly labeled magnified example, not a diagnosis of this NVIDIA incident.'})],
  r32:[spatial('lab','repair','macro','repair',{weight:.67,heading:'A different specimen. Then another test.',motive:'Release the probes, exchange the specimen, then test; no magical self-healing wire.'}),spatial('lab','repair','gap','repair',{weight:.33,motive:'Only cut close after the replacement specimen has stopped.'})],
  r33:[archive('r33',0,{weight:.70}),spatial('lab','repeat','probe','repeat',{weight:.30,heading:'General principle · repeat the test.'})],
  r34:[spatial('lab','repeat','test','repeat',{weight:.48}),spatial('lab','repeat','repeat','repeat',{weight:.52,heading:'A process that works again.',motive:'Open the view after repeat tests show working output.'})],
  r35:[archive('r35',0,{weight:.61}),spatial('desk','forecast','edge','forecast',{weight:.39,heading:'A later visit, recalled by Huang.'})],
  r36:[spatial('desk','forecast','page','forecast',{weight:.62,heading:'How much capacity will be needed?'}),spatial('desk','forecast','book','forecast',{weight:.38,motive:'The notebook is a planning instrument; no historical numbers are invented.'})],
  r37:[spatial('factory','capacity','bay','capacity',{weight:.43,heading:'The forecast needs a place to happen.'}),spatial('factory','capacity','wide','capacity',{weight:.57,motive:'An empty marked bay receives equipment along a physical route.'})],
  r38:[spatial('factory','capacity','equipment','capacity',{weight:.61,heading:'Planning around somebody else’s future.'}),spatial('factory','capacity','handoff','capacity',{weight:.39})],
  r40:[archive('r40',0,{weight:.52}),spatial('factory','shipping','tray','delivery',{weight:.48,motive:'The once-underfilled tray now holds finished output.'})],
  r41:[spatial('factory','shipping','dispatch','delivery',{weight:.38,heading:'Wanted. Working. Shipped.'}),spatial('pc','working','contact','payoff',{weight:.29,motive:'Match the dispatched product with the previously empty connector.'}),spatial('pc','working','screen','payoff',{weight:.33})],
  r43:[spatial('pc','working','side','payoff',{weight:.50}),spatial('pc','working','screen','payoff',{weight:.50,motive:'No repeat insertion: show the lasting result of successful production.'})],
  r44:[spatial('pc','working','wide','payoff',{heading:'Making enough working chips.',ending:true,motive:'The opening machine now works. Hold the consequence, not another orbit.'})]
};

export function buildCinematicShots(script,timeline){
  const rows=timeline.sentences||timeline.utterances,duration=timeline.duration_seconds||timeline.duration;
  const rowMap=new Map(rows.map((r,i)=>[r.id,{...r,next:rows[i+1]?.start??duration}]));
  const at=(id,f=0)=>{const r=rowMap.get(id);return r.start+(r.next-r.start)*f;};
  const events={
    opening:[0,at('r05')],shortfall:[at('r02'),at('r05'),.48,.73],
    overflow:[at('r12'),at('r15')],design:[at('r15'),at('r16')],capital:[at('r20'),at('r21'),.03,.10],
    assembly:[at('r24',.30),at('r25')],orders:[at('r26'),at('r27'),.32,1],dependable:[at('r27',.49),at('r28'),.82,1],
    test:[at('r30',.54),at('r31',.40)],defect:[at('r31',.40),at('r32')],repair:[at('r32'),at('r33')],
    repeat:[at('r33',.70),at('r35')],forecast:[at('r35',.61),at('r37')],capacity:[at('r37'),at('r39')],
    delivery:[at('r40',.52),at('r41',.38),.38,1],payoff:[at('r41',.38),duration,1,1]
  };
  const all=[];
  rows.forEach((row,i)=>{
    const start=i===0?0:row.start,end=rows[i+1]?.start??duration,views=FILM_PLANS[row.id];
    if(!views?.length)throw new Error('Missing cinematic row '+row.id);
    const total=views.reduce((n,v)=>n+(v.weight||1),0);let time=start;
    views.forEach((v,j)=>{
      const stop=j===views.length-1?end:time+(end-start)*(v.weight||1)/total;
      const event=v.event?events[v.event]:null;if(v.kind==='spatial'&&!event)throw new Error('Missing event clock '+v.event);
      all.push({...v,id:`${row.id}-c${String(j+1).padStart(2,'0')}`,rowId:row.id,chapter:row.chapter,t0:time,t1:stop,assetIds:v.assetIds||[],eventClock:event?{t0:event[0],t1:event[1],p0:event[2]??0,p1:event[3]??1}:null,motive:v.motive||'Follow the next action or the next piece of evidence.'});time=stop;
    });
  });return all;
}

export function eventProgress(shot,time){const e=shot.eventClock;if(!e)return 0;const u=Math.max(0,Math.min(1,(time-e.t0)/(e.t1-e.t0)));return e.p0+(e.p1-e.p0)*u;}
