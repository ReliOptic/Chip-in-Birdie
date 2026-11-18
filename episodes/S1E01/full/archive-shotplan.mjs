// Editorial shots are independent of the locked narration text. Durations are
// compiled from the measured utterance sample boundaries, never estimated VO.
export const PLANS = {
  r01: [
    {kind:'portrait',assetIds:['jensen'],title:'NVIDIA’S\nSUPPLY\nPROBLEM.',subtitle:'Before the AI boom',kicker:'A company you know. A different problem.',photoLabel:'Jensen Huang · SC18, 2018',focus:[.68,.36],motive:'Begin with a recognizable person before moving to the unfamiliar history.'}
  ],
  r02: [
    {kind:'photo',assetIds:['riva128'],title:'1997',subtitle:'A hit. And a supply problem.',kicker:'Rewind',photoLabel:'RIVA 128 (1997) · object photographed in 2010',focus:[.5,.55],zoom0:1,zoom1:1,weight:.43,motive:'Cut from the contemporary founder to the actual product at issue.'},
    {kind:'macro',assetIds:['riva128'],title:'Not enough working chips.',photoLabel:'RIVA 128 package · photograph, 2010',focus:[.5,.49],zoom0:1.42,zoom1:1.42,weight:.57,motive:'The closer view changes the question from popularity to physical supply.'}
  ],
  r03: [
    {kind:'document',quote:'“low manufacturing yields”',title:'December 1997',subtitle:'Then a second problem: ST’s available capacity.',source:'NVIDIA Form S-1 · March 6, 1998 · Manufacturing risks, pp. 11–13',weight:.5},
    {kind:'document',quote:'“ST currently is capacity constrained”',title:'Demand exceeded what the partner could supply.',source:'NVIDIA Form S-1 · March 6, 1998 · Manufacturing risks, pp. 11–13',weight:.5}
  ],
  r04: [{kind:'object',assetIds:['riva128'],year:'DESIGN ≠ DELIVERY',title:'Wanted.\nNot yet shipped.',subtitle:'The bottleneck was in manufacturing.',photoLabel:'RIVA 128 (1997) · object photograph, 2010',size:78}],
  r05: [
    {kind:'macro',assetIds:['riva128'],focus:[.5,.40],zoom0:1.65,zoom1:1.65,box:[428,388,770,170],annotation:'ST + NVIDIA. Two names on the package.',photoLabel:'RIVA 128 package · 2010 photograph; markings are not proof of wafer-fab location',weight:.58,motive:'Reveal the real ST mark instead of showing another generic factory icon.'},
    {kind:'partnership',assetIds:[],title:'Not an exclusive relationship.',left:'NVIDIA',right:'ST',added:'TSMC',subtitle:'TSMC was becoming a second manufacturer.',source:'NVIDIA Form S-1 · March 1998',weight:.42}
  ],
  r06: [
    {kind:'map',assetIds:['taiwan'],year:'TAIWAN',title:'Why here?',subtitle:'A manufacturer was ready to take the work.',photoLabel:'NASA MODIS · 2022 geographic locator, not a 1980s factory image',weight:.43},
    {kind:'rewind',assetIds:[],from:'1997',to:'1985',title:'Twelve years earlier.',source:'The rewind joins two documented events; it is not a claim that NVIDIA existed in 1985.',weight:.57}
  ],
  r07: [{kind:'document',organization:'INTEL · CORPORATE HISTORY',date:'October 10, 1985',document:'EXITING DRAM',title:'A pioneer leaves the memory business.',subtitle:'DRAM — the memory market, not the whole semiconductor industry.',source:'Intel historical timeline · Farewell to DRAM',quote:null}],
  r08: [
    {kind:'record',assetIds:[],kicker:'The market Chang was entering',title:'Japan’s DRAM makers\nwere moving ahead.',organization:'DATAQUEST · APRIL 1987',subtitle:'A contemporary assessment of the 1986 DRAM market.',source:'Dataquest · DRAM market report, April 1987 · Computer History Museum archive',weight:.42},
    {kind:'photo',assetIds:['factory1989'],title:'Capacity is expensive.',subtitle:'And it can be left unused.',photoLabel:'Microelectronics workers · Erfurt, East Germany, May 1989 — not a TSMC or Intel plant',focus:[.51,.48],size:86,zoom0:1,zoom1:1,weight:.58,motive:'Period manufacturing photograph supplies material context, with its actual location made explicit.'}
  ],
  r09: [
    {kind:'portrait',assetIds:['chang'],title:'MORRIS\nCHANG',subtitle:'The man asked to build the business.',note:'A former Texas Instruments executive.',photoLabel:'Morris Chang · official photograph, November 2018',focus:[.30,.42],weight:.63},
    {kind:'map',assetIds:['taiwan'],year:'1985',title:'A national ambition.',subtitle:'Taiwan wanted a semiconductor company.',photoLabel:'NASA satellite image, 2022 · geography only',weight:.37}
  ],
  r10: [
    {kind:'record',assetIds:[],kicker:'Chang’s later account · 2007',title:'Design. Marketing.\nIntellectual property.',subtitle:'He did not consider these Taiwan’s strongest starting points.',organization:'MORRIS CHANG · ORAL HISTORY',source:'Computer History Museum · oral history, August 24, 2007 · pp. 12–14',weight:.54},
    {kind:'photo',assetIds:['chang'],title:'A possible advantage.',subtitle:'Manufacturing — not guaranteed superiority.',photoLabel:'Morris Chang · 2018 portrait illustrating his 2007 retrospective account',focus:[.67,.39],size:87,zoom0:1.08,zoom1:1.08,weight:.46}
  ],
  r11: [
    {kind:'partnership',assetIds:[],left:'Chip designer',right:'Manufacturer',title:'No competing house-brand chips.',subtitle:'The customer sells a product. The manufacturer supplies production.',source:'The own-brand boundary described in TSMC’s 1997 company profile · conceptual diagram',weight:.59},
    {kind:'question',assetIds:[],title:'But who would\nbuy the service?',subtitle:'The hardest part of the business plan was the customer.',dark:true,weight:.41}
  ],
  r12: [{kind:'orders',assetIds:[],mode:'owned',title:'The obvious customers had factories.',subtitle:'Why hire yours if we already own one?',source:'Conceptual diagram of Chang’s reported overflow-customer problem · CHM oral history, 2007'}],
  r13: [{kind:'orders',assetIds:[],mode:'return',title:'Overflow is not dependable demand.',subtitle:'Busy: send work out. Quiet: bring it back.',source:'Illustrative order movement — not a measured capacity forecast'}],
  r14: [{kind:'question',assetIds:[],title:'The factory stays.\nThe orders can leave.',subtitle:'That was the risk in the plan.',dark:true}],
  r15: [
    {kind:'photo',assetIds:['chang2022'],title:'The customers\nhe hoped would emerge.',subtitle:'Engineers who wanted to build their own companies.',size:75,focus:[.67,.40],zoom0:1.02,zoom1:1.02,photoLabel:'Morris Chang · 2022 portrait illustrating his 2007 recollection; not a photograph of those engineers',weight:.46},
    {kind:'record',assetIds:[],organization:'MORRIS CHANG · ORAL HISTORY',title:'They could fund a product.\nNot an entire fab.',subtitle:'Chang was betting that a manufacturing service could help these firms emerge.',source:'Paraphrase of Chang’s 2007 recollection · not a quotation from an individual startup',weight:.54}
  ],
  r16: [{kind:'backers',assetIds:[],title:'Someone still had to pay for the factory.',names:['Taiwan government','Philips','Local investors'],source:'Morris Chang and Jensen Huang · CHM conversation, October 17, 2007 · p. 3'}],
  r17: [{kind:'funding',assetIds:[],source:'Morris Chang · 2007 retrospective account · initial capital approximately US$220m'}],
  r18: [
    {kind:'photo',assetIds:['itri'],title:'ITRI',subtitle:'Facilities. Equipment. Technology.',photoLabel:'ITRI campus · 2008 photograph — not the original 1987 fab',focus:[.5,.5],zoom0:1,zoom1:1,weight:.53},
    {kind:'number',assetIds:[],number:'98',unit:'professionals',title:'The transfer included a team.',subtitle:'ITRI → the new TSMC',source:'ITRI 50th-anniversary history · 1987 technology transfer',weight:.47}
  ],
  r19: [{kind:'timeline',assetIds:[],title:'1987: the company begins.',events:[{year:'1985',label:'Business plan'},{year:'1987',label:'TSMC founded'},{year:'Early 1990s',label:'Independent customers grow'}],active:1,subtitle:'A manufacturing base was a beginning. A dependable business still had to be built.',source:'ITRI history · Chang’s 2007 retrospective account'}],
  r20: [{kind:'boundary',assetIds:['riva128zx','fab18'],title:'Two investments. No longer one company.',labels:['Develop a product','Own a factory'],notes:['Design, software and customer demand.','Equipment, process and operating capacity.'],subtitle:'The financial separation — not the disappearance of manufacturing risk.',photoLabel:'RIVA 128 ZX (1998), photo 2010 · TSMC Fab 18, photo 2025; comparison is conceptual'}],
  r21: [
    {kind:'question',assetIds:[],title:'Could more designers\nbecome companies?',subtitle:'That was the bet on the other side of the factory.',weight:.48},
    {kind:'partnership',assetIds:[],left:'Independent designer',right:'TSMC',title:'Trust becomes part of production.',subtitle:'The designer’s survival depends on somebody else’s manufacturing.',source:'Editorial synthesis of the 1987 model and Chang’s 2007 account',weight:.52}
  ],
  r22: [{kind:'timeline',assetIds:[],title:'The first four years were difficult.',events:[{year:'1987',label:'Launch'},{year:'1988–1990',label:'Survival, not an instant boom'},{year:'Early 1990s',label:'Customer growth'}],active:1,subtitle:'Chang’s retrospective description — no invented revenue curve.',source:'Chang–Huang conversation · Computer History Museum, 2007 · p. 4'}],
  r23: [
    {kind:'object',assetIds:['pc'],year:'THE PC OPPORTUNITY',title:'A place for\nother companies.',subtitle:'The computer became a market around the computer.',photoLabel:'IBM Personal Computer 5150 (introduced 1981) · object photograph, 2010',weight:.6},
    {kind:'photo',assetIds:['pcboard'],title:'Look inside.',photoLabel:'IBM PC 5150 motherboard · object photograph, 2012',focus:[.41,.50],zoom0:1,zoom1:1,top:true,size:86,weight:.4}
  ],
  r24: [
    {kind:'macro',assetIds:['pcboard'],focus:[.20,.72],zoom0:1.34,zoom1:1.34,box:[125,185,650,391],annotation:'Expansion slots: room for other products.',photoLabel:'IBM PC motherboard · photograph, 2012; highlighted physical expansion slots',weight:.58,motive:'The actual slot structure makes open architecture visible rather than abstract.'},
    {kind:'object',assetIds:['tntboard'],year:'ONE OF THOSE PRODUCTS',title:'A graphics card.',subtitle:'An independent business could supply a part of the machine.',photoLabel:'Creative Graphics Blaster RIVA TNT (1998) · object photograph, 2010',side:'left',size:67,weight:.42}
  ],
  r25: [
    {kind:'object',assetIds:['riva128'],year:'1997',title:'RIVA 128',subtitle:'NVIDIA’s opportunity inside the PC.',photoLabel:'RIVA 128 (1997) · 2010 object photograph',weight:.44},
    {kind:'record',assetIds:[],organization:'NVIDIA · 1997 COMPANY TIMELINE',title:'Dell. Gateway.\nPC and board makers.',subtitle:'Relationships with businesses that could put the chip into products.',source:'NVIDIA corporate history · 1997 timeline · not a chart of customer revenue',weight:.56}
  ],
  r26: [
    {kind:'partnership',assetIds:[],left:'NVIDIA',right:'TSMC',title:'A design win becomes a manufacturing order.',subtitle:'The PC business and the manufacturing business grow together.',source:'Editorial synthesis · NVIDIA 1997 timeline and 1998 S-1',weight:.5},
    {kind:'orders',assetIds:[],mode:'independent',title:'Not just overflow.',subtitle:'A designer without its own fab needs continuing outside production.',source:'Business-model distinction, not a guaranteed order commitment',weight:.5}
  ],
  r27: [
    {kind:'timeline',assetIds:[],title:'The customers grow into the model.',events:[{year:'1987',label:'A risky starting point'},{year:'Early 1990s',label:'Independent design firms grow'},{year:'1997–98',label:'NVIDIA arrives later'}],active:1,source:'Chang’s retrospective account, 2007 · NVIDIA filing, 1998',weight:.42},
    {kind:'allocation',assetIds:[],title:'More businesses. One manufacturing partner.',subtitle:'The factory must become dependable while customers build demand.',source:'Conceptual relationship — no institution photograph, customer names or measured shares',weight:.58}
  ],
  r28: [
    {kind:'document',assetIds:[],organization:'NVIDIA · PRESS ANNOUNCEMENT',date:'February 23, 1998',document:'AN ADDITIONAL MANUFACTURER',title:'TSMC would expand production.',subtitle:'Starting with RIVA 128 ZX.',source:'NVIDIA-issued release reproduced in Tom’s Hardware’s RIVA 128 ZX archive',weight:.6},
    {kind:'object',assetIds:['riva128zx'],year:'RIVA 128 ZX · 1998',title:'The announced\nstarting point.',subtitle:'Capacity beyond the existing manufacturing partnership.',note:'This photographed unit also carries an ST mark; it is not proof of TSMC fabrication.',photoLabel:'RIVA 128 ZX · object photograph, 2010 · ST-marked example',size:66,weight:.4}
  ],
  r29: [
    {kind:'compare',assetIds:['riva128','riva128zx'],title:'The earlier partner did not vanish.',labels:['RIVA 128 · 1997','RIVA 128 ZX · 1998'],notes:['The original product was made with ST.','The pictured ZX unit also bears ST’s mark.'],contain:true,photoLabel:'Both objects photographed in 2010 · neither image proves a TSMC manufacturing location',weight:.56},
    {kind:'partnership',assetIds:[],left:'NVIDIA',right:'ST',added:'TSMC',title:'More capacity. Not a clean replacement.',subtitle:'The relationship expanded beyond one manufacturer.',source:'NVIDIA February 1998 release and March 1998 filing',weight:.44}
  ],
  r30: [
    {kind:'document',assetIds:[],organization:'NVIDIA CORPORATION',date:'March 6, 1998',document:'WHO CARRIES THE RISK?',title:'Initially: payment for wafers, regardless of yield.',subtitle:'NVIDIA’s reported arrangement until production stabilized. Paraphrase, not a contract facsimile.',source:'NVIDIA Form S-1 · Manufacturing section, p. 25',weight:.57},
    {kind:'photo',assetIds:['wafer2017'],title:'A wafer is not\na shipment of good chips.',size:79,photoLabel:'Research testbed wafer · 2017 photograph — not NVIDIA/TSMC material or yield data',focus:[.56,.65],zoom0:1,zoom1:1,weight:.43}
  ],
  r31: [{kind:'yield',assetIds:['tntdie'],title:'A paid wafer can contain unsellable chips.',photoLabel:'NVIDIA NV4 die (1998 product), photographed in 2016 · test grid is invented, not measured yield'}],
  r32: [{kind:'coupling',assetIds:[],title:'The defect is not always just dirt.',subtitle:'Design and manufacturing process have to work together.',source:'General mechanism · ASML metrology explanation and TSMC DTCO discussion; not a diagnosis of NVIDIA’s 1997 incident'}],
  r33: [
    {kind:'document',assetIds:[],organization:'TSMC · PRESS RELEASE',date:'June 19, 1996',document:'JOINT PILOT WORK',title:'Test with customers. Then enter volume production.',subtitle:'The example here was a 0.35 μm SRAM process — not NVIDIA’s graphics chip.',source:'TSMC release · customer pilots and 0.35 μm SRAM volume production',weight:.56},
    {kind:'process',assetIds:[],title:'Before the volume order.',steps:['Customer design','Pilot production','Resolve problems','Volume production'],subtitle:'A general sequence illustrated by TSMC’s 1996 SRAM announcement.',source:'The sequence is explanatory; stage widths do not represent elapsed time.',weight:.44}
  ],
  r34: [{kind:'macro',assetIds:['tntdie'],title:'From a design to repeatable production.',focus:[.51,.68],zoom0:1.2,zoom1:1.5,photoLabel:'NVIDIA NV4 / RIVA TNT die · 1998 design, 2016 photograph · not a yield measurement'}],
  r35: [
    {kind:'photo',assetIds:['jensen2014'],title:'How many\nwafers?',subtitle:'The subject of a later visit, as Huang remembered it.',size:90,top:true,textX:955,maxWidth:570,subtitleY:490,subtitleSize:31,focus:[.40,.34],zoom0:1,zoom1:1,photoLabel:'Jensen Huang · 2014 portrait; visit recounted in a 2007 conversation — not photographed here',weight:.54},
    {kind:'photo',assetIds:['chang2022'],title:'Business forecasts.',subtitle:'Questions with consequences for a factory.',size:85,focus:[.66,.40],zoom0:1.03,zoom1:1.03,photoLabel:'Morris Chang · 2022 official photograph — not the date or image of the recalled meeting',weight:.46}
  ],
  r36: [{kind:'forecast',assetIds:[],title:'A black book.\nA very practical question.',subtitle:'How much manufacturing capacity will the customer need?',source:'Huang’s account in the 2007 CHM conversation · later visit, not the first 1997 meeting'}],
  r37: [{kind:'photo',assetIds:['fab18'],title:'Build capacity\nwhere demand is growing.',subtitle:'Reinvest. Reallocate. Commit.',size:81,focus:[.5,.5],zoom0:1,zoom1:1,photoLabel:'TSMC Fab 18 · photograph, 2025; later facility illustrates scale, not the 1990s factory'}],
  r38: [{kind:'question',assetIds:[],title:'Whose future\nfills the factory?',subtitle:'Capacity planning becomes a bet on customers.',dark:false}],
  r39: [{kind:'milestone',assetIds:[],number:'500',unit:'million processors',title:'Manufactured together.',from:'1998',to:'2006',source:'TSMC–NVIDIA joint milestone · October 24, 2006 · processors, not all GPUs'}],
  r40: [
    {kind:'document',assetIds:[],organization:'TSMC + NVIDIA · JOINT ANNOUNCEMENT',date:'October 24, 2006',document:'BEYOND ONE GRAPHICS CARD',title:'GeForce GPUs.\nnForce MCPs.',subtitle:'MCP: media and communications processor. The 500-million total covers more than GPUs.',source:'Joint corporate announcement · processors are not all GPUs',weight:.52},
    {kind:'timeline',assetIds:[],title:'An uncertain customer becomes a durable business.',events:[{year:'1987',label:'A company for future customers'},{year:'1998',label:'NVIDIA volume production'},{year:'2006',label:'500 million processors'}],active:2,source:'TSMC/ITRI histories · joint 2006 announcement',weight:.48}
  ],
  r41: [{kind:'object',assetIds:['tntboard'],year:'RETURN TO THE CARD',title:'Wanted.\nWorking.\nShipped.',subtitle:'A product people wanted. A design that worked. A factory able to deliver.',photoLabel:'Creative RIVA TNT (1998) · 2010 photograph',size:76}],
  r42: [{kind:'compare',assetIds:['jensen2014','chang2022'],title:'Neither could deliver the whole result alone.',labels:['A company building demand','A company building supply'],notes:['A product business.','A manufacturing business.'],photoLabel:'Huang portrait 2014 · Chang portrait 2022 · paired for editorial comparison, not a shared event',focuses:[[.39,.32],[.67,.34]]}],
  r43: [{kind:'photo',assetIds:['jensen'],title:'The gamble found its customers.',size:81,photoLabel:'Jensen Huang · SC18, 2018 · a contemporary portrait, not the 1997 meeting',focus:[.67,.35],zoom0:1.15,zoom1:1.15}],
  r44: [{kind:'end',assetIds:['fab12b'],title:'Making enough\nworking chips.',subtitle:'Still a shared problem.',note:'CHIP IN BIRDIE · SEASON 1 / EPISODE 01',photoLabel:'TSMC Fab 12B · Hsinchu · photograph, 2015'}]
};

export function buildArchiveShots(script,timeline){
  const rows=timeline.sentences||timeline.utterances;
  const duration=timeline.duration_seconds||timeline.duration;
  const all=[];
  for(let i=0;i<rows.length;i++){
    const row=rows[i],start=i===0?0:row.start,end=rows[i+1]?.start??duration;
    const views=PLANS[row.id];
    if(!views?.length)throw new Error('Missing authored picture plan: '+row.id);
    const total=views.reduce((n,v)=>n+(v.weight||1),0);let at=start;
    for(let j=0;j<views.length;j++){
      const v=views[j],t1=j===views.length-1?end:at+(end-start)*(v.weight||1)/total;
      all.push({...v,id:row.id+'-'+String(j+1).padStart(2,'0'),rowId:row.id,chapter:row.chapter,t0:at,t1,assetIds:v.assetIds||[],cut:v.cut||'hard',motive:v.motive||'Change in the narrated evidence or causal question'});at=t1;
    }
  }
  return all;
}
