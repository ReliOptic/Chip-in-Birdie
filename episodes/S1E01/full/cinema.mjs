// R5: statements, figures and object-led shots have different visual weight.
// All editorial changes are pure functions of the measured narration clock.
const language = {
 'deal:opening':['TSMC · A DIFFERENT ENTRY PRICE','Launch a chip.\nNot a factory.','','hero'],
 'deal:roles':['THE DIVISION OF WORK','Design + sell / Manufacture','','quiet'],
 'deal:terms':['A REAL CUSTOMER CONTRACT','Guaranteed supply.\nCommitted purchases.','Cirrus Logic / TSMC · FY1997 filing','corner'],
 'founder:bundle':['TWO INVESTMENT RISKS','A product can win.\nA factory still has to work.','','hero'],
 'founder:asset':['BEFORE PRODUCT REVENUE','Equipment. Facilities. Specialists.','','quiet'],
 'founder:without':['THE ENTRY BARRIER','No fab to finance.','Chang’s retrospective account · 2007','corner'],
 'founder:team':['INITIAL FUNDING','Fund the product team.','','quiet'],
 'founder:remaining':['COSTS THAT REMAIN','The launch is still yours to fund.','','quiet'],
 'founder:price':['THE MAKE-OR-BUY QUESTION','Own the fab—if demand can justify it.','','corner'],
 'founding:choice':['TAIWAN · 1985','Choose manufacturing.','Chang’s retrospective judgment','corner'],
 'founding:capital':['1987 · INITIAL INVESTMENT','Someone still pays.','Approximate retrospective figure · Not a single-fab construction price','figure'],
 'founding:partners':['THE INVESTORS','Manufacturing capital, pooled here.','','quiet'],
 'founding:resources':['ITRI → TSMC','A manufacturing base.\nNot an empty shell.','Facilities · equipment · technology · people','corner'],
 'founding:operating':['THE MANUFACTURER’S RETURN','These assets need customers.','','quiet'],
 'bookings:alone':['ONE PRODUCT COMPANY','Too little work for a whole line.','','quiet'],
 'bookings:shared':['COMPATIBLE ORDERS','Buy production.\nShare the fixed assets.','','corner'],
 'bookings:spread':['THE MANUFACTURER’S ECONOMICS','More output carries the fixed cost.','','quiet'],
 'bookings:incompatible':['A PHYSICAL LIMIT','Not every chip fits this process.','','quiet'],
 'bookings:slump':['A SHARED DOWNTURN','Orders fall.\nThe assets remain.','','corner'],
 'bookings:overflow':['THE EARLY CUSTOMER PROBLEM','Overflow can go home.','Chang’s retrospective account · 2007','quiet'],
 'bookings:growth':['1991–92 · CHANG’S RECOLLECTION','Their growth needs your capacity.','Independent designers were an uncertain market at the start.','corner'],
 'trust:rival':['A SECOND COST','Will you manufacture my next rival?','','hero'],
 'trust:charter':['TSMC · 1994 REPORT','No own-brand IC end products.','One stated boundary on product competition','corner'],
 'trust:delivery':['A DIFFERENT INCENTIVE','The customer’s success brings orders.','','quiet'],
 'trust:competition':['WHAT THE PROMISE DOES NOT DO','Aligned interests are not identical interests.','','quiet'],
 'fab:handoff':['THE PURCHASE','Repeatable manufacturing.','','quiet'],
 'yield:reject':['ILLUSTRATIVE RUN A','A lower production quote.','','figure'],
 'yield:improve':['SEPARATE RUN B','A higher quote.\nMore usable output.','','figure'],
 'yield:cost':['TWO QUOTES · DIFFERENT OUTPUT','What each usable chip carries.','','figure'],
 'yield:limit':['COMMERCIAL CONSEQUENCE','20% more to make.\n20% less per usable chip.','','corner'],
 'contract:terms':['CIRRUS LOGIC · FY1997 FILING','Assured supply had conditions.','','hero'],
 'contract:advance':['FY1996 AGREEMENT · FUTURE OBLIGATION','An advance-payment commitment.','Not cash already paid','figure'],
 'contract:renegotiate':['AT THE FY1997 FILING','Already being renegotiated.','Possible replacement: long-term purchases. No new written agreement yet.','corner'],
 'contract:shortfall':['MINIMUM PURCHASE CONDITION','What if the customer buys too little?','','quiet'],
 'contract:resold':['WHAT THE CONDITION EXCLUDES','Resold is not the same as unsold.','','corner'],
 'contract:penalty':['THE UNSOLD SHORTFALL','No factory ownership.\nStill demand exposure.','','corner'],
 'contract:dependency':['CIRRUS ALSO HELD MANUFACTURING STAKES','Capital. Supply access. Control.','A contract case, not a pure textbook fabless company','quiet'],
 'market:choices':['THE PRODUCT COMPANY','Specialize in a product.','','quiet'],
 'market:winners':['THE FOUNDRY','Manufacture for several winners.','','quiet'],
 'market:balance':['COMPLEMENTARY BUSINESSES','Product risk / Utilization risk','','quiet'],
 'market:final':['CHIP IN BIRDIE · S1E01','Their growth.\nThe factory’s business.','','final']
};
const figures={
 'founding:capital':[['≈ $220m','INITIAL INVESTMENT']],
 'founding:partners':[['48%','TAIWAN GOVERNMENT'],['≈27%','PHILIPS'],['≈25%','OTHER TAIWANESE INVESTORS']],
 'founding:resources':[['98','PROFESSIONALS FROM ITRI']],
 'yield:reject':[['60 / 100','USABLE · SUPPLIER A']],
 'yield:improve':[['A 60 · B 90','TWO INDEPENDENT RUNS']],
 'yield:cost':[['1.67 / 1.33','A / B · COST PER USABLE CHIP'],['100 / 120','PROCESSING COST · A / B']],
 'contract:advance':[['≈ $118m','FUTURE ADVANCES'],['½ + ½','FY1998 / FY1999']],
 'contract:shortfall':[['10 = 7 + 3','ILLUSTRATIVE COMMITMENT / BOUGHT / SHORTFALL']],
 'contract:resold':[['3 = 2 + 1','ILLUSTRATIVE SHORTFALL / RESOLD / UNSOLD']],
 'contract:penalty':[['1 UNSOLD','ILLUSTRATIVE PENALTY-EXPOSED UNIT']]
};
const sources={
 deal:'Original documents: Cirrus Logic FY1997 filing · Chang oral history',
 founder:'Qualitative business model · Chang oral history, 2007',
 founding:'Chang, 2007 · ITRI, 2023 · TSMC 1994 report',
 bookings:'Illustrative capacity · Not customer or historical volume data',
 trust:'TSMC 1994 report, Company Background · Editorial interpretation',
 fab:'Authored modern fab · Not TSMC footage or a 1987 reconstruction',
 yield:'Invented teaching values · Processing cost only; test and packaging excluded',
 contract:'Cirrus Logic FY1997 filing · Other Wafer Supply Arrangements',
 market:'Business-model synthesis · Risks and obligations remain'
};
export function worldLook(world){
 return ({
  deal:{background:'#101613',floor:'#17211c',key:'#ffe5b8',rim:'#b5c6b8'},
  founder:{background:'#131612',floor:'#283026',key:'#ffdfad',rim:'#bbcdc2'},
  founding:{background:'#1b1712',floor:'#342e24',key:'#ffe2b4',rim:'#bccbd1'},
  bookings:{background:'#09181b',floor:'#15292d',key:'#d1ebe8',rim:'#cba375'},
  trust:{background:'#171c20',floor:'#26313b',key:'#e8eeef',rim:'#c2a27a'},
  fab:{background:'#0d151b',floor:'#18242b',key:'#ffe1b4',rim:'#9dbbd3'},
  yield:{background:'#0a151a',floor:'#182a33',key:'#dceff2',rim:'#dcbb8c'},
  contract:{background:'#201813',floor:'#33271e',key:'#ffe4b6',rim:'#b9c2c2'},
  market:{background:'#0c1820',floor:'#172a34',key:'#eff0dc',rim:'#9abbd6'}
 })[world]||{background:'#101613',floor:'#17211c',key:'#ffe5b8',rim:'#b5c6b8'};
}
export function shotGrammar(shot){
 const key=shot.world+':'+shot.phase;
 return {size:['asset','advance','cost'].includes(shot.phase)?'CU':['alone','shared','slump','choices','winners'].includes(shot.phase)?'W':shot.world==='contract'?'O/H':'M',cut:'hard',motive:language[key]?.[1]||'Follow the economic consequence'};
}
export function updateCinema($,row,shot,time){
 const key=shot.world+':'+shot.phase,[kicker,title,detail,mode]=language[key]||['','','','quiet'],elapsed=time-shot.t0;
 $('scene-kicker').textContent=kicker;$('scene-caption').textContent=title;$('scene-detail').textContent=detail;
 $('scene-title').dataset.mode=mode;
 // A quiet shot names the action briefly and then leaves room for the object.
 const fade=mode==='quiet'?Math.max(0,1-Math.max(0,elapsed-2.4)/.7):mode==='hero'?Math.max(.55,1-Math.max(0,elapsed-4)/2):1;
 $('scene-title').style.opacity=String(fade);
 $('record-label').textContent=sources[shot.world]||'';
 $('picture').dataset.world=shot.world;$('picture').dataset.phase=shot.phase;
 const figure=$('metric-block'),items=figures[key];figure.hidden=!items;
 if(figure.dataset.key!==key){figure.dataset.key=key;figure.replaceChildren();if(items)for(const [value,label]of items){const cell=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=value;small.textContent=label;cell.append(strong,small);figure.append(cell);}}
 figure.className='metrics metrics-'+shot.world;
}
