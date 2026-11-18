/** New R8 reporting graphics. Flat explanatory diagrams are labelled as such;
 * no private portal, actual wafer result, purchase order or financial figure is fabricated.
 * All labels, reveals and material positions are pure functions of the edit clock.
 */
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const INK='#202c2d',MUTED='#697674',PAPER='#f0eee7',ORANGE='#bd512f',GREEN='#35765f',BLUE='#3e687f',LINE='#bec6c0',GOLD='#d8b655';
export function createFabEditorial({canvas,images,credits=[]}){
 const c=canvas.getContext('2d',{alpha:false});
 function text(s,x,y,size=30,color=INK,weight=400,align='left',family='Arial, sans-serif') {c.fillStyle=color;c.textAlign=align;c.font=`${weight} ${size}px ${family}`;c.fillText(s,x,y);}
 function line(x,y,xx,yy,color=INK,width=2,dash=[]){c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();c.setLineDash([]);}
 function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
 function circle(x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
 function arrow(x,y,xx,yy,color=INK,width=3){line(x,y,xx,yy,color,width);const a=Math.atan2(yy-y,xx-x);c.fillStyle=color;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-13*Math.cos(a-.45),yy-13*Math.sin(a-.45));c.lineTo(xx-13*Math.cos(a+.45),yy-13*Math.sin(a+.45));c.closePath();c.fill();}
 function wrap(s,x,y,max,size=29,color=INK,gap=1.35,family='Arial, sans-serif'){c.font=`400 ${size}px ${family}`;c.fillStyle=color;c.textAlign='left';let lineText='',yy=y;for(const w of s.split(' ')){const n=lineText?lineText+' '+w:w;if(c.measureText(n).width>max&&lineText){c.fillText(lineText,x,yy);yy+=size*gap;lineText=w;}else lineText=n;}c.fillText(lineText,x,yy);return yy;}
 function pill(s,x,y,color=INK){const width=Math.max(82,s.length*12+24);rect(x,y-26,width,36,color);text(s,x+12,y,19,PAPER,600);return width;}
 function footer(s){line(64,814,1536,814,LINE,1);text(s,64,850,20,MUTED);text('CHIP IN BIRDIE  /  S1E01',1536,850,18,MUTED,400,'right');}
 function head(s,kicker='EXPLAINER'){text(kicker,64,68,19,MUTED,600);text(s,64,142,51,INK,400,'left','Georgia, serif');}
 function chip(x,y,w=155,color=BLUE){
  c.save();c.translate(x,y);const q=w*.10;
  for(let i=0;i<8;i++){const t=-w*.38+i*w*.109;rect(-w*.58,t,20,q,color);rect(w*.45,t,20,q,color);rect(t,-w*.58,q,20,color);rect(t,w*.45,q,20,color);}
  rect(-w/2,-w/2,w,w,color);rect(-w*.35,-w*.35,w*.70,w*.70,PAPER);rect(-w*.27,-w*.27,w*.54,w*.54,color);
  c.strokeStyle='#ffffff55';c.lineWidth=1;for(let i=0;i<6;i++){c.beginPath();c.moveTo(-w*.23,-w*.23+i*w*.09);c.lineTo(w*.23,-w*.23+i*w*.09);c.stroke();}c.restore();
 }
 function wafer(x,y,r=108,{bad=false,reveal=1}={}){
  circle(x,y,r,'#afc1be');c.save();c.beginPath();c.arc(x,y,r-4,0,Math.PI*2);c.clip();
  for(let iy=-6;iy<=6;iy++)for(let ix=-6;ix<=6;ix++){const xx=x+ix*21,yy=y+iy*21;const b=bad&&((ix+iy*3+36)%7===0);rect(xx-9,yy-9,18,18,b&&reveal>.4?ORANGE:'#547d87');if(b&&reveal>.4){line(xx-5,yy-5,xx+5,yy+5,PAPER,2);line(xx+5,yy-5,xx-5,yy+5,PAPER,2);}}
  c.restore();rect(x-7,y+r-6,14,7,PAPER);
 }
 function machine(x,y,label,{available=true,width=210}={}){
  rect(x,y,width,155,'#d8ded8');rect(x+9,y+9,width-18,98,'#e9ece6');rect(x+20,y+23,55,36,'#687f7d');
  for(let k=0;k<6;k++)line(x+100,y+25+k*9,x+width-22,y+25+k*9,LINE,2);
  rect(x+28,y+134,60,16,'#81918d');rect(x+width-86,y+134,60,16,'#81918d');
  rect(x+25,y+155,12,19,INK);rect(x+width-37,y+155,12,19,INK);circle(x+width-20,y-12,7,available?GREEN:ORANGE);line(x+width-20,y-4,x+width-20,y+5,INK,4);text(label,x+width/2,y+213,27,INK,600,'center');
 }
 function path(points,color,width=3,dash=[]){c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.setLineDash([]);}
 function movingDot(points,p,color=ORANGE){const lengths=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));let d=clamp(p)*lengths.reduce((a,b)=>a+b,0);for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const v=d/lengths[i];circle(points[i][0]+(points[i+1][0]-points[i][0])*v,points[i][1]+(points[i+1][1]-points[i][1])*v,10,color);break;}d-=lengths[i];}}
 function row(s,y,color=INK){text(s,110,y,33,color);}
 const sourceByView={
  order:'NVIDIA S-1, 1998 · risk disclosure; contemporary question, historical example',roles:'ASML · semiconductor business roles',route:'ASML / INFICON FabTime · schematic process route, not a fab floor plan',routes:'INFICON FabTime · illustrative product-dependent routes',qualification:'INFICON FabTime · illustrative qualification restriction, not actual equipment status',matrix:'INFICON FabTime · illustrative eligibility matrix, no customer data',alternative:'INFICON FabTime · concept demonstration; no numerical benefit asserted',queue:'INFICON FabTime · illustrative queue, not a numerical production simulation',clocks:'Cycle time and throughput · concept diagram, not measured fab performance',levers:'INFICON FabTime · investment depends on the active production constraint',milestones:'TSMC quality policy · distinct readiness milestones, not a project schedule',measurement:'TSMC manufacturing control · illustrative observation, not a real yield map',design:'TSMC DTCO · schematic pattern, dimensions deliberately exaggerated',window:'TSMC DTCO · qualitative design/process envelope, not a process recipe',containment:'TSMC process control · illustrative disposition, no fabricated defect recovery',efoundry:'TSMC public eFoundry service description · original summary, not a customer-portal screenshot',collaboration:'TSMC public eFoundry service description · three categories of customer collaboration',founding:'TSMC Annual Report 1997 · retrospective company profile of the 1987 founding',report:'TSMC Annual Report 1997 · summary of its “Virtual Fab” proposition',customers:'TSMC Annual Report 1997 / Open Innovation Platform · schematic, not customer order data',commitments:'TSMC Annual Report 1997 · capacity options signed in 1996, order effect reported for 1997',filing:'NVIDIA S-1, filed 6 March 1998 · printed pp. 11–13; dated risk disclosure', 'wafer-risk':'NVIDIA S-1, 1998 · initial wafer-price obligation; historical terms, not today’s general rule','joint-work':'NVIDIA S-1, 1998 · design/process sensitivities and joint investigation',ownership:'Two business structures · explanatory comparison, not a claim of universal superiority',news:'Editorial synthesis of manufacturer qualification, process control and delivery evidence'};
 function editorial(s,u){
  const v=s.view,p=ease(u);head(s.heading||({levers:'Which constraint does the investment remove?',milestones:'Three milestones—not one.'}[v]||''),['founding','report','commitments','filing','wafer-risk'].includes(v)?'THE RECORD':'THE MECHANISM');
  if(v==='order'){
   text('NVIDIA',130,315,77,INK,600);text('DESIGN COMPANY',135,359,20,MUTED);chip(300,545,166,GREEN);
   line(650,242,650,727,LINE,2,[10,10]);text('COMPANY BOUNDARY',650,774,18,MUTED,400,'center');
   arrow(450,510,1040,510,ORANGE,4);rect(733+150*p,489,60,42,ORANGE);
   text('WORKING CHIPS',1130,365,31,INK,600,'center');wafer(1130,545,121,{bad:true,reveal:p});
   text('A product people want',300,737,29,MUTED,400,'center');text('Enough product to deliver',1130,737,29,MUTED,400,'center');
  }else if(v==='roles'){
   chip(380,405,173,GREEN);text('FABLESS',380,586,51,INK,600,'center');text('Designs the chip',380,638,32,MUTED,400,'center');
   if(u>.20){machine(1015,319,'FOUNDRY',{width:270});text('Manufactures it',1150,638,32,MUTED,400,'center');}
   if(u>.42){arrow(590,400,590+330*ease((u-.42)/.18),400,BLUE,3);text('design + requirements',760,363,22,BLUE,600,'center');}
   if(u>.65){arrow(920,476,920-330*ease((u-.65)/.18),476,GREEN,3);text('process rules + data',760,524,22,GREEN,600,'center');}
   line(100,704,1500,704,LINE,1);text(u>.65?'The responsibilities separate. The engineering stays connected.':'Two businesses—with a continuing technical interface.',800,762,31,INK,400,'center');
  }else if(v==='route'||v==='routes'){
   const names=['DEPOSIT','COAT','EXPOSE','ETCH','MEASURE'];
   names.forEach((n,i)=>{const x=148+i*292;rect(x,270,170,92,'#e0e2d9');text(n,x+85,325,22,INK,600,'center');text(String(i+1).padStart(2,'0'),x+85,250,18,MUTED,400,'center');});
   const a=[[230,380],[230,451],[522,451],[522,380],[522,451],[814,451],[814,380],[814,451],[1106,451],[1106,380],[1106,451],[1398,451],[1398,380],[1398,573],[230,573],[230,380]];
   path(a,LINE,4);path(a.slice(0,Math.max(2,Math.ceil(p*a.length))),BLUE,4);movingDot(a,p,ORANGE);
   if(v==='route'){
    text('LAYER 1',1416,514,23,BLUE,600,'right');text('LAYER 2',1416,617,23,BLUE,600,'right');arrow(230,640,230,689,ORANGE,3);text('Same families of equipment. A different surface each time.',330,696,34,INK);text('Selected visits only; cleaning, other operations and repeated steps omitted.',330,755,22,MUTED);
   }else{
    const b=[[230,405],[230,653],[814,653],[814,405],[814,653],[1398,653],[1398,405]];path(b,GREEN,4,[8,5]);movingDot(b,p,GREEN);text('PRODUCT A',160,735,24,BLUE,600);text('PRODUCT B',510,735,24,GREEN,600);text('Selected visits; intervening steps omitted.',1500,735,22,MUTED,400,'right');
   }
  }else if(v==='qualification'||v==='alternative'){
   wafer(242,462,96);text('OPERATION X',242,650,28,INK,600,'center');machine(760,280,'TOOL A',{available:v!=='alternative'});machine(1150,280,'TOOL B');
   const a=[[370,444],[650,444],[650,355],[733,355]],b=[[650,444],[650,636],[1255,636],[1255,536]];
   if(v==='alternative'||u>.20){path(a,v==='alternative'?ORANGE:GREEN,4);arrow(665,355,733,355,v==='alternative'?ORANGE:GREEN,4);}
   path(b,LINE,4,[8,8]);
   const qualified=v==='alternative'&&u>.43;
   if(qualified){path(b,GREEN,4);movingDot(b,ease((u-.43)/.57),GREEN);pill('QUALIFIED',1165,589,GREEN);}else if(v==='alternative'||u>.50){line(1216,574,1290,648,ORANGE,6);line(1290,574,1216,648,ORANGE,6);pill('NOT QUALIFIED',1132,732,ORANGE);}
   if(v==='alternative'){pill('MAINTENANCE',774,257,ORANGE);text(qualified?'Cross-qualification creates another route.':'The eligible route is temporarily unavailable.',142,751,29,INK);}else{
    if(u>.20)pill('ELIGIBLE',793,257,GREEN);pill('IDLE',1213,257,MUTED);
    text(u>.50?'Tool B being idle is not enough.':u>.20?'The operation has an eligible route.':'Two similar tools. One particular operation.',142,751,32,INK);
   }
  }else if(v==='matrix'){
   const x=160,y=300,cw=330,rh=118;['OPERATION','TOOL A','TOOL B','TOOL C'].forEach((n,i)=>text(n,x+i*cw+20,y,25,MUTED,600));
   const vals=[[true,false,true],[false,true,true],[true,true,false]],active=Math.min(2,Math.floor(u*3));
   for(let i=0;i<3;i++){line(160,y+35+i*rh,1480,y+35+i*rh,LINE,1);if(i>active)continue;
    if(i===active)rect(160,y+40+i*rh,1320,rh-9,'#dbe4d9');text(['Product A / etch','Product A / film','Product B / etch'][i],180,y+106+i*rh,29,INK);
    for(let j=0;j<3;j++){const xx=x+(j+1)*cw+116,yy=y+94+i*rh;circle(xx,yy,22,vals[i][j]?GREEN:'#c9ceca');text(vals[i][j]?'✓':'—',xx,yy+10,30,PAPER,600,'center');}}
   text(['Start with one operation.','Change the operation; eligibility changes.','Change the product; check eligibility again.'][active],180,769,30,INK);
  }else if(v==='queue'){
   text('ARRIVALS',110,280,21,MUTED,600);text('PROCESSING',920,280,21,MUTED,600);text('RECOVERY ROOM',1335,280,21,MUTED,600,'center');
   for(let lane=0;lane<2;lane++){
    const y=390+lane*206;line(118,y,1480,y,LINE,3);for(let i=0;i<8;i++){let xx=138+i*115;if(lane===1&&i>=4)xx=610+(i-4)*40+(1-p)*100;rect(xx,y-35,32,70,lane?ORANGE:BLUE);}
    rect(925,y-55,250,110,lane?'#d8b9a9':'#c5d8ca');rect(955,y-30,190*p,60,lane?ORANGE:GREEN);
    text(lane?'Little slack':'Some room to recover',110,y+98,28,INK);text(lane?'A disturbance becomes a queue.':'Variation can be absorbed.',1050,y+98,26,MUTED,400,'center');
   }
  }else if(v==='clocks'){
   circle(392,431,148,'#d8ddd5');c.strokeStyle=BLUE;c.lineWidth=9;c.beginPath();c.arc(392,431,125,-Math.PI/2,-Math.PI/2+p*4.4);c.stroke();line(392,431,392+90*Math.cos(-1.57+p*3),431+90*Math.sin(-1.57+p*3),INK,7);circle(392,431,10,INK);
   text('CYCLE TIME',392,654,34,INK,600,'center');text('One lot: start to finish',392,709,29,MUTED,400,'center');line(800,260,800,750,LINE,2);
   for(let i=0;i<6;i++){rect(1000+i*54,500-35*i*p,36,35*i*p+10,GREEN);}line(965,523,1380,523,INK,3);text('THROUGHPUT',1176,654,34,INK,600,'center');text('Completed output per period',1176,709,29,MUTED,400,'center');
  }else if(v==='levers'||v==='milestones'){
   const list=v==='levers'?[['EQUIPMENT','Add the capacity that is missing.'],['RELIABILITY','Keep qualified tools available.'],['SCHEDULING','Send the right lot to the right tool.']]:[['BUILDING','A place to install a factory.'],['INSTALLED TOOLS','Equipment in place and connected.'],['QUALIFIED PRODUCTION','A process ready for a particular product.']];
   list.forEach(([a,b],i)=>{const y=300+i*164;line(120,y+99,1480,y+99,LINE,1);text('0'+(i+1),120,y+42,48,i===2?GREEN:MUTED,400,'left','Georgia');text(a,240,y+15,27,INK,600);text(b,240,y+64,33,INK);if(u>(i+.2)/3)line(240,y+80,240+Math.min(1100,b.length*16),y+80,i===2?GREEN:GOLD,5);});
  }else if(v==='measurement'){
   wafer(390,453,190,{bad:false});text('INSPECT A LOCATION',390,719,27,INK,600,'center');text('SCHEMATIC OBSERVATION · NOT ACTUAL DATA',390,761,18,MUTED,400,'center');
   const phase=u<.34?0:u<.69?1:2;circle(432,411,31,PAPER);circle(432,411,24,ORANGE);circle(432,411,13,PAPER);
   line(695,239,695,757,LINE,2);text(['LOCATE','COMPARE','INVESTIGATE'][phase],790,319,24,MUTED,600);
   if(phase===0){wrap('A measurement identifies a difference.',790,390,610,43);path([[463,411],[620,411],[620,477],[730,477]],ORANGE,3);}
   else if(phase===1){rect(790,370,610,224,'#dbe2d9');for(let i=0;i<4;i++){rect(820+i*137,401,16,153,BLUE);rect(841+i*137,401,16,153,ORANGE);}text('SCHEMATIC EDGE COMPARISON',790,642,23,INK,600);}
   else{wrap('A difference is evidence—not yet its cause.',790,390,610,43);arrow(810,505,810,562,ORANGE,3);text('Check process + design conditions.',790,624,29,INK);}
   text('Speed alone does not answer the measurement.',790,731,25,ORANGE);
  }else if(v==='design'){
   const xx=[120,860];xx.forEach((x,j)=>{if(j===1&&u<.32)return;rect(x,265,600,363,'#dbe0d8');for(let i=0;i<5;i++){c.strokeStyle=j?ORANGE:BLUE;c.lineWidth=35;c.lineCap=j?'round':'butt';c.lineJoin=j?'round':'miter';c.beginPath();c.moveTo(x+65+i*104,567);c.lineTo(x+65+i*104,340);c.lineTo(x+113+i*104,340);c.stroke();}c.lineCap='butt';c.lineJoin='miter';});
   text('DESIGN INTENT',420,700,30,INK,600,'center');if(u>=.32)text('PRINTED SHAPE',1160,700,30,INK,600,'center');
   if(u>.66){for(const x of[185,925]){c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.arc(x,340,45,0,Math.PI*2);c.stroke();}line(232,340,875,340,INK,2,[7,7]);text('Compare the corner.',800,230,28,INK,600,'center');}
   text(u>.66?'A usable design must tolerate how the process changes its shape.':'What is drawn is not automatically what can be manufactured.',800,765,29,INK,400,'center');
  }else if(v==='window'){
   arrow(240,700,240,240,INK,3);arrow(240,700,1030,700,INK,3);text('manufacturing condition',590,761,27,MUTED,400,'center');text('design choice',130,260,25,MUTED);
   c.save();c.translate(650,468);c.rotate(-.22);c.fillStyle='#87ad9770';c.beginPath();c.ellipse(0,0,242,150,0,0,Math.PI*2);c.fill();c.strokeStyle=GREEN;c.lineWidth=3;c.stroke();c.restore();
   text('MANUFACTURABLE',655,460,25,GREEN,600,'center');text('ENVELOPE',655,496,25,GREEN,600,'center');const pts=[[350,301],[465,593],[820,310],[652,473]];path(pts,ORANGE,3,[7,7]);movingDot(pts,p,ORANGE);
   text('ITERATE',1160,345,24,MUTED,600);wrap('Find the combination that can perform—and repeat.',1110,405,370,40);text('Qualitative diagram',1110,640,21,MUTED);
  }else if(v==='containment'){
   wafer(305,432,140,{bad:true,reveal:1});rect(120,657,370,53,ORANGE);text('HOLD + INVESTIGATE',305,695,25,PAPER,600,'center');
   line(625,257,625,745,LINE,2);text('SUBSEQUENT MATERIAL',1050,344,27,INK,600,'center');
   text('CHANGE',785,437,29,BLUE,600);if(u>.38){arrow(958,427,1094,427,BLUE,3);text('VERIFY',1140,437,29,INK,600);}
   for(let i=0;i<3;i++)chip(805+i*240,552,91,'#aab7b1');text(u>.68?'A new result must be checked.':'Changed settings are not proof of good chips.',1050,646,25,MUTED,400,'center');
   wrap('The affected material does not magically become good.',739,705,700,32,INK);
  }else if(v==='efoundry'){
   text('TSMC',110,341,64,INK,600);text('eFoundry',110,430,88,BLUE,400,'left','Georgia');text('PUBLIC SERVICE DESCRIPTION',115,490,19,MUTED,600);line(115,530,610,530,BLUE,3);
   if(u<.30){wrap('The customer needs more than a shipping date.',815,345,650,49);text('What is happening to my product?',815,565,29,MUTED);}
   else{const list=['Design collaboration','Engineering collaboration','Logistics collaboration'];list.forEach((s,i)=>{if(u<.30+i*.18)return;text('0'+(i+1),815,334+i*133,28,GREEN);text(s,883,334+i*133,35,INK);line(815,372+i*133,1480,372+i*133,LINE,1);});}
   text(u>.65?'Three public categories of continuing collaboration.':'A source we can inspect—not an invented private portal.',115,753,28,INK);
  }else if(v==='collaboration'){
   const stage=u<.28?0:u<.63?1:2,names=['DESIGN','ENGINEERING','LOGISTICS'];
   names.forEach((n,i)=>{text(n,130+i*500,244,22,i===stage?INK:MUTED,600);if(i===stage)rect(130+i*500,262,350,6,[BLUE,GREEN,ORANGE][i]);});
   if(stage===0){text('Technical documentation',130,382,57,INK,400,'left','Georgia');wrap('Rules, models and support for a manufacturable design.',130,466,780,37);for(let i=0;i<3;i++){rect(1070+i*16,352+i*19,275,287,'#d4ddd4');}text('DESIGN',1130,443,27,BLUE,600);text('INFORMATION',1130,491,27,BLUE,600);line(1113,524,1335,524,BLUE,3);text('Before the manufacturing hand-off',130,726,31,MUTED);}
   else if(stage===1){text('Evidence from manufacturing',130,372,53,INK,400,'left','Georgia');const labels=[['PILOT LOTS','Early production'],['YIELD / WAFER TEST','Process evidence'],['RELIABILITY','Product evidence']];labels.forEach(([a,b],i)=>{const x=130+i*475;rect(x,433,420,181,'#e0e5dc');text(a,x+22,486,24,GREEN,600);wrap(b,x+22,548,365,29);});text('Manufacturing evidence for the next design or production decision.',130,726,28,MUTED);}
   else{text('Visibility across the production chain',130,372,49,INK,400,'left','Georgia');const n=['FAB','ASSEMBLY','TEST','SHIPPING'];n.forEach((v,i)=>{const x=130+i*365;rect(x,455,270,124,'#e1e3d8');text(v,x+135,529,27,INK,600,'center');if(i<3)arrow(x+279,517,x+348,517,ORANGE,3);});text('Scope of tracking—not a claim that this order is complete.',130,726,29,MUTED);}
  }else if(v==='handoff-data'){
   line(800,230,800,753,LINE,2,[10,10]);text('DESIGN COMPANY',120,285,31,BLUE,600);text('MANUFACTURER',1045,285,31,GREEN,600);
   const list=[['DESIGN RULES',GREEN,-1],['PILOT-LOT RESULTS',GREEN,-1],['PRODUCT DECISIONS',BLUE,1]];
   list.forEach(([name,color,dir],i)=>{const y=389+i*129;arrow(dir>0?200:1400,y,dir>0?1400:200,y,color,3);const pos=dir>0?250+1030*ease(u):1350-1030*ease(u);rect(pos-17,y-17,34,34,color);text(name,800,y-29,24,INK,600,'center');});text('Engineering continues across the boundary.',800,773,32,INK,400,'center');
  }else if(v==='founding'){
   text('1987',110,440,218,INK,400,'left','Georgia');text('TAIWAN SEMICONDUCTOR',118,508,24,MUTED,600);text('MANUFACTURING COMPANY',118,546,24,MUTED,600);
   line(770,250,770,740,LINE,2);if(u<.28){text('THE BUSINESS PROPOSITION',860,345,24,MUTED,600);wrap('Who would the factory serve?',860,426,600,51);}
   else{wrap('Make other companies’ chips.',860,343,600,55);if(u>.60){rect(848,495,640,179,'#dbe4d7');wrap('Do not sell a competing chip brand.',873,552,580,45,GREEN);}}
   text(u>.60?'Manufacturing for customers—not a competing chip brand.':'A specialist manufacturer for other chip companies.',117,751,30,INK);
  }else if(v==='report'){
   c.save();c.translate(170,221);c.rotate(-.025);c.shadowColor='#25383326';c.shadowBlur=25;c.shadowOffsetY=14;rect(0,0,626,532,'#fffcf3');c.shadowColor='transparent';text('TSMC / ANNUAL REPORT',50,66,22,MUTED,600);text('1997',50,156,82,INK,400,'left','Georgia');line(50,188,575,188,INK,2);text('Virtual Fab',50,267,65,INK,400,'left','Georgia');rect(50,284,333,10,GOLD);wrap('Manufacturing access without operating an in-house fab.',50,349,503,29);text('SOURCE SUMMARY · NOT A SCANNED PAGE',50,486,16,MUTED);c.restore();
   const stage=u<.34?0:u<.68?1:2;text('WHAT THE CUSTOMER NEED NOT OWN',925,275,22,MUTED,600);
   if(stage===0){wrap('A manufacturing organization of its own.',925,380,580,51);text('Access instead of ownership',925,658,27,BLUE,600);}
   else if(stage===1){text('THE CAPITAL',925,376,45,INK,600);machine(1045,431,'IN-HOUSE FACTORY',{width:270});text('The associated factory expense',925,728,27,MUTED);}
   else{text('THE ORGANIZATION',925,376,40,INK,600);['PROCESS ENGINEERING','QUALITY CONTROL','PRODUCTION OPERATIONS'].forEach((n,i)=>{text(n,925,463+i*80,25,GREEN,600);line(925,484+i*80,1480,484+i*80,LINE,1);});text('The burden of operating that factory',925,728,26,MUTED);}
  }else if(v==='customers'){
   const active=Math.min(2,Math.floor(u*3)),pts=[[190,315],[190,492],[190,669]];
   rect(860,310,555,370,'#dce2db');machine(950,358,'MANUFACTURING ORGANIZATION',{width:370});
   pts.forEach(([x,y],i)=>{if(i>active)return;const color=[GREEN,BLUE,ORANGE][i];chip(x,y,81,color);text(['Product A','Product B','Product C'][i],270,y+10,29,INK);path([[460,y],[620,y],[620,492],[840,492]],color,3);arrow(802,492,849,492,color,3);});
   text(active===2?'Shared capabilities. Customer designs remain separate.':active===1?'The manufacturing capability serves more than one product.':'One customer accesses a specialist manufacturing organization.',800,764,28,INK,400,'center');
  }else if(v==='commitments'){
   const stage=u<.34?0:u<.67?1:2;text('1996',150,342,116,INK,400,'left','Georgia');text('CAPACITY OPTIONS SIGNED',154,394,22,MUTED,600);
   if(stage>0){arrow(520,364,920,364,BLUE,4);text('BEFORE SHIPMENT',720,316,21,BLUE,600,'center');}
   if(stage===2){text('1997',1040,342,116,INK,400,'left','Georgia');text('ORDER STABILITY REPORTED',1044,394,20,MUTED,600);}
   rect(150,512,1300,175,'#e2e3d8');wrap(['The factory still needs customers to place orders.','Demand commitments connect customers to manufacturing capacity.','TSMC said those agreements contributed to stable orders in 1997.'][stage],190,572,1170,40);text('TSMC Annual Report 1997. No contract price, quantity or allocation formula shown.',150,757,24,MUTED);
  }else if(v==='filing'){
   text('NVIDIA',105,294,61,INK,600);text('S-1 / FILED 6 MARCH 1998',110,337,22,MUTED,600);line(110,370,1480,370,INK,2);
   text('DECEMBER 1997',110,445,24,ORANGE,600);text('Low manufacturing yields at ST',110,511,46,INK,400,'left','Georgia');
   text('AT THE TIME OF FILING',110,625,24,BLUE,600);text('Manufacturing capacity constrained',110,691,43,INK,400,'left','Georgia');
   c.globalAlpha=ease(u*3);rect(110,528,1020,8,GOLD);c.globalAlpha=1;
  }else if(v==='wafer-risk'){
   const stage=u<.32?0:u<.69?1:2;text('NVIDIA S-1 / 6 MARCH 1998',110,267,23,MUTED,600);
   rect(110,327,610,315,'#e1e4d9');text('THE PAYMENT OBLIGATION',148,384,23,INK,600);text('WAFERS',148,482,92,INK,400,'left','Georgia');text('For initial production',148,558,28,MUTED);
   if(stage===0){wrap('TSMC had only recently begun making these products.',858,386,600,42);}
   else{line(775,327,775,642,LINE,2);text('THE YIELD CONDITION',858,384,23,ORANGE,600);wrap('Payment was required regardless of yield.',858,448,600,45,INK,1.25,'Georgia');rect(858,579,570,8,GOLD);}
   if(stage===2){rect(110,678,1350,83,'#d7e3d7');text('Until yields stabilized.',145,732,36,GREEN,600);text('Specific historical terms—not a universal contract.',800,732,25,INK);}
   else text('A diagram of the disclosed obligation—not an invoice or a yield result.',110,739,25,MUTED);
  }else if(v==='joint-work'){
   text('PRODUCT DESIGN',125,321,30,BLUE,600);text('PROCESS TECHNOLOGY',1020,321,30,GREEN,600);chip(285,458,130,BLUE);machine(1110,391,'MANUFACTURER',{width:235});
   const a=[[440,455],[690,455],[690,584],[800,584]],b=[[1080,455],[910,455],[910,584],[800,584]];path(a,BLUE,4);path(b,GREEN,4);movingDot(a,p,BLUE);movingDot(b,p,GREEN);circle(800,584,52,INK);text('?',800,601,48,PAPER,400,'center');text('INVESTIGATE THE ACTUAL PRODUCT',800,723,33,INK,600,'center');
  }else if(v==='ownership'){
   rect(100,267,644,382,'#d9dfd6');text('INTEGRATED COMPANY',422,316,25,INK,600,'center');chip(256,451,111,BLUE);machine(474,379,'MANUFACTURE',{width:200});arrow(343,454,438,454,INK,3);text('Design + manufacturing under one owner',422,716,26,MUTED,400,'center');
   if(u>.30){rect(884,267,595,126,'#e0e5dd');text('DESIGN COMPANY',1182,341,29,INK,600,'center');rect(884,520,595,129,'#d2dfd6');text('SPECIALIST FOUNDRY',1182,596,29,INK,600,'center');}
   if(u>.62){arrow(1140,409,1140,501,BLUE,3);arrow(1226,501,1226,409,GREEN,3);text('Separate ownership, connected work',1182,716,27,MUTED,400,'center');}
   text(u>.62?'An alternative structure—not proof that one model always wins.':'Owning manufacturing remains a valid choice.',800,777,26,INK,400,'center');
  }else if(v==='news'){
   text('NEW FAB ANNOUNCED',110,272,24,MUTED,600);line(110,304,1480,304,INK,2);const questions=['Which products can it make?','At what quality?','From when—and delivered when?'];
   questions.forEach((q,i)=>{const y=400+i*142;const reveal=ease((u-i*.18)*4);c.globalAlpha=.23+.77*reveal;text('0'+(i+1),112,y,38,GREEN,400,'left','Georgia');text(q,235,y,49,INK,400,'left','Georgia');line(235,y+30,1450,y+30,LINE,1);c.globalAlpha=1;});
  }else{throw new Error('Missing authored reporting graphic '+v);}
  footer(v==='handoff-data'?'TSMC public eFoundry / DTCO · schematic information exchange, not a private portal':sourceByView[v]||'Evidence-grounded editorial explanation');
 }
 function photograph(s,u){
  const im=images[s.assetIds[0]],credit=credits.find(a=>a.id===s.assetIds[0]);if(!im)throw new Error('Missing licensed photo '+s.assetIds[0]);
  const z=1+.035*ease(u),scale=Math.max(1600/im.width,900/im.height)*z,w=im.width*scale,h=im.height*scale;c.drawImage(im,(1600-w)/2,(900-h)/2,w,h);
  const top=c.createLinearGradient(0,0,0,280);top.addColorStop(0,'rgba(13,21,20,.78)');top.addColorStop(1,'rgba(13,21,20,0)');c.fillStyle=top;c.fillRect(0,0,1600,280);
  text('PHOTOGRAPH / DATED ARCHIVE',64,63,19,'#fff9e9',600);wrap(s.heading,64,133,1440,46,'#fff9e9',1.2,'Georgia');
  const bottom=c.createLinearGradient(0,610,0,900);bottom.addColorStop(0,'rgba(13,21,20,0)');bottom.addColorStop(1,'rgba(13,21,20,.91)');c.fillStyle=bottom;c.fillRect(0,610,1600,290);
  text(credit?.date_label||'',64,746,32,'#fffaf0',600);text(s.assetIds[0]==='lcn_lab_2013'?'UNIVERSITY RESEARCH LAB — NOT A TSMC PRODUCTION FAB':'CONSTRUCTION — NOT AN OPERATING CLEANROOM',64,794,21,'#fffaf0');
  text((credit?.creator||'')+' · CC BY 2.0 · framing/scale modified',64,850,19,'#e7e7dc');
 }
 let state=null;
 return {draw(s,u,t){c.setTransform(canvas.width/1600,0,0,canvas.height/900,0,0);c.globalAlpha=1;c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;c.lineJoin='miter';c.lineCap='butt';c.setLineDash([]);c.lineDashOffset=0;c.filter='none';rect(0,0,1600,900,PAPER);if(s.kind==='photo')photograph(s,u);else editorial(s,u);state={id:s.id,shotId:s.id,rowId:s.rowId,kind:s.kind==='photo'?'Attributed historical photograph':'Reporting graphic',assetIds:s.assetIds||[],shot:s,time:t,local:u,detail:{label:s.kind==='photo'?'Dated source photograph':'Original explanatory graphic'},backend:'Canvas2D reporting'};return state;},get state(){return state;}};
}
