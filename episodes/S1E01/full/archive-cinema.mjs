import {buildArchiveShots} from './archive-shotplan.mjs';

// A photograph/document-led film stage, not a simulated camera orbit. All
// transforms derive from t; no mutable simulation, clocks or random frames.
const W=1600,H=900;
const C={paper:'#f4f0e6',white:'#fffdf7',ink:'#15212c',blue:'#254bd8',red:'#d7422f',muted:'#66665d',line:'#c7c5bb',green:'#528552'};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=n=>{n=clamp(n);return n*n*n*(10+n*(-15+6*n));};
const pop=n=>1-Math.pow(1-clamp(n),3);

export function createArchiveCinema({canvas,images,script,timeline}){
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Canvas documentary rendering is unavailable');
  const shots=buildArchiveShots(script,timeline);
  for(const s of shots)for(const id of s.assetIds)if(!images[id])throw new Error('Missing archive image: '+id);
  let state=null;
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  function text(s,x,y,size=36,color=C.ink,weight=500,align='left',family='Arial, sans-serif'){
    ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${family}`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(String(s),x,y);
  }
  function fit(s,x,y,maxWidth,size=80,color=C.ink,weight=700,align='left'){
    ctx.font=`${weight} ${size}px Arial, sans-serif`;const m=ctx.measureText(String(s)).width;const px=Math.min(size,size*maxWidth/Math.max(m,1));text(s,x,y,px,color,weight,align);return px;
  }
  function lines(s,x,y,maxWidth,size=60,color=C.ink,weight=700,lineHeight=1.08){
    const paragraphs=String(s).split('\n');let yy=y;
    ctx.font=`${weight} ${size}px Arial, sans-serif`;
    for(const p of paragraphs){let line='';for(const word of p.split(' ')){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth&&line){text(line,x,yy,size,color,weight);yy+=size*lineHeight;line=word;}else line=next;}if(line){text(line,x,yy,size,color,weight);yy+=size*lineHeight;}}
    return yy;
  }
  function rule(x,y,w,color=C.ink,width=2){rect(x,y,w,width,color);}
  function line(x,y,xx,yy,color=C.ink,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}
  function image(id,x,y,w,h,{mode='cover',focus=[.5,.5],zoom=1,rotation=0,alpha=1}={}){
    const im=images[id];if(!im)throw new Error('Unloaded image '+id);
    const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
    ctx.save();ctx.globalAlpha*=alpha;ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    if(mode==='contain'){
      const scale=Math.min(w/iw,h/ih)*zoom,dw=iw*scale,dh=ih*scale;
      ctx.translate(x+w/2,y+h/2);ctx.rotate(rotation);ctx.drawImage(im,-dw/2,-dh/2,dw,dh);
    }else{
      const scale=Math.max(w/iw,h/ih)*zoom,sw=w/scale,sh=h/scale;
      const sx=clamp(focus[0]*iw-sw/2,0,Math.max(0,iw-sw));
      const sy=clamp(focus[1]*ih-sh/2,0,Math.max(0,ih-sh));
      ctx.drawImage(im,sx,sy,sw,sh,x,y,w,h);
    }ctx.restore();
  }
  function credit(s,dark=false){
    if(!s.photoLabel&&!s.source)return;
    const label=s.photoLabel||s.source;
    ctx.save();ctx.font='400 18px Arial, sans-serif';const width=Math.min(1488,ctx.measureText(label).width+24);
    rect(48,795,width,31,dark?'rgba(8,13,20,.78)':'rgba(255,253,247,.92)');
    fit(label,60,817,width-24,18,dark?C.white:C.ink,400);ctx.restore();
  }
  function masthead(s,dark=false){
    const color=dark?C.white:C.ink;
    text('CHIP IN BIRDIE',48,45,17,color,700);text('S1 / 01',1552,45,17,color,500,'right');
    if(s.kicker)text(s.kicker,48,91,20,dark?'#d4d5d4':C.muted,400);
  }
  function underline(x,y,w,t,color=C.red){rect(x,y,w*pop(t),8,color);}
  function arrow(x,y,xx,yy,t=1,color=C.red){
    const p=pop(t),ex=lerp(x,xx,p),ey=lerp(y,yy,p);line(x,y,ex,ey,color,5);
    if(p>.94){const a=Math.atan2(yy-y,xx-x);line(xx,yy,xx-Math.cos(a-.55)*20,yy-Math.sin(a-.55)*20,color,5);line(xx,yy,xx-Math.cos(a+.55)*20,yy-Math.sin(a+.55)*20,color,5);}
  }
  function paper(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    // Fixed offset gives documents a physical hierarchy without perpetual drift.
    rect(230,128,1168,615,'#d8d5cb');rect(211,108,1168,615,C.white);
    text(s.organization||'NVIDIA CORPORATION',260,165,19,C.ink,700);
    text(s.date||'March 6, 1998',1328,165,18,C.muted,400,'right');rule(260,187,1068,C.ink,2);
    text(s.document||'FORM S-1',260,251,44,C.ink,700);
    text(s.quote?'Typeset excerpt · source linked in Evidence':'Source summary · original linked in Evidence',260,285,17,C.muted,400);
    if(s.quote){
      const yy=lines(s.quote,260,386,1035,53,C.ink,500,1.2);
      underline(260,yy-38,Math.min(950,s.quote.length*21),u*4);
    }
    if(s.title)lines(s.title,260,s.quote?547:394,1000,s.quote?42:59,C.blue,700,1.13);
    if(s.subtitle)lines(s.subtitle,260,s.quote?646:601,1010,26,C.muted,400,1.22);
    credit(s);
  }
  function portrait(s,u){
    const id=s.assetIds[0];rect(0,0,W,H,C.ink);
    image(id,500,0,1100,H,{focus:s.focus||[.65,.36],zoom:1.28+u*.035});
    const grad=ctx.createLinearGradient(450,0,980,0);grad.addColorStop(0,C.ink);grad.addColorStop(1,'rgba(21,33,44,0)');rect(0,0,500,H,C.ink);rect(450,0,530,H,grad);
    masthead(s,true);const yy=lines(s.title||'',70,275,660,98,C.white,700,1.02);
    if(s.subtitle)lines(s.subtitle,74,yy+50,595,42,'#e1ded2',400,1.13);
    if(s.note)lines(s.note,74,655,550,25,'#bfc6cd',400,1.2);
    credit(s,true);
  }
  function photo(s,u){
    const id=s.assetIds[0];image(id,0,0,W,H,{focus:s.focus||[.5,.5],zoom:lerp(s.zoom0||1,s.zoom1||1.065,ease(u))});
    if(s.shade!==false){const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(7,14,21,.6)');gr.addColorStop(.40,'rgba(7,14,21,.03)');gr.addColorStop(1,'rgba(7,14,21,.72)');rect(0,0,W,H,gr);}
    masthead(s,true);
    const tx=s.textX||65;
    if(s.title){const yy=s.titleY||(s.top?230:540);lines(s.title,tx,yy,s.maxWidth||1140,s.size||104,C.white,700,1.03);}
    if(s.subtitle)lines(s.subtitle,tx+5,s.subtitleY||(s.top?390:705),s.maxWidth||1300,s.subtitleSize||35,C.white,400,1.1);
    if(s.tag){rect(1100,140,420,75,C.red);fit(s.tag,1120,190,380,37,C.white,700);}
    credit(s,true);
  }
  function object(s,u){
    rect(0,0,W,H,s.bg||C.white);masthead(s);
    const right=s.side!=='left',x=right?690:45;
    image(s.assetIds[0],x,120,865,635,{mode:'contain',zoom:.94+.045*ease(u)});
    const tx=right?60:980,tw=right?600:560;
    if(s.year)text(s.year,tx,239,31,C.red,700);
    const yy=lines(s.title||'',tx,340,tw,s.size||73,C.ink,700,1.04);
    if(s.subtitle)lines(s.subtitle,tx,yy+42,tw,31,C.muted,400,1.18);
    if(s.note)lines(s.note,tx,670,tw,22,C.muted,400,1.2);
    credit(s);
  }
  function macro(s,u){
    image(s.assetIds[0],0,0,W,H,{focus:s.focus||[.5,.5],zoom:lerp(s.zoom0||1.2,s.zoom1||1.75,ease(u))});
    rect(0,0,W,125,'rgba(10,17,20,.7)');masthead(s,true);
    if(s.box){
      const [x,y,w,h]=s.box;ctx.strokeStyle=C.white;ctx.lineWidth=4;ctx.strokeRect(x,y,w,h);
      const a=s.annotation||'A clue in the package';rect(80,655,Math.min(1200,a.length*26+45),66,C.paper);fit(a,102,701,1160,39,C.ink,700);
      arrow(300,645,x+w/2,y+h,clamp(u*4));
    }else if(s.title){rect(55,580,1460,156,'rgba(10,17,20,.88)');lines(s.title,85,642,1380,58,C.white,700,1.08);}
    credit(s,true);
  }
  function compare(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    text(s.title||'',60,181,56,C.ink,700);
    const labels=s.labels||['DESIGN','MANUFACTURING'];
    const widths=s.widths||[710,710],xs=[60,830];
    s.assetIds.slice(0,2).forEach((id,i)=>{
      rect(xs[i]+10,229,widths[i],385,'#d5d1c5');image(id,xs[i],217,widths[i],385,{mode:s.contain?'contain':'cover',focus:s.focuses?.[i]||[.5,.5],zoom:1.02});
      rect(xs[i],607,widths[i],65,i===0?C.ink:C.blue);fit(labels[i],xs[i]+23,654,widths[i]-46,33,C.white,700);
      if(s.notes?.[i])lines(s.notes[i],xs[i],710,widths[i],25,C.muted,400,1.15);
    });
    if(s.link)arrow(741,416,817,416,u*3,C.red);
    credit(s);
  }
  function question(s,u){
    rect(0,0,W,H,s.dark?C.ink:C.blue);masthead(s,true);
    if(s.assetIds.length){ctx.save();ctx.globalAlpha=.20;image(s.assetIds[0],700,0,900,H,{focus:s.focus||[.5,.5],zoom:1.05});ctx.restore();}
    const yy=lines(s.title||'',70,290,1380,s.size||110,C.white,700,1.04);
    if(s.subtitle)lines(s.subtitle,75,yy+70,1300,34,'#e6e8ed',400,1.2);
    rect(73,yy+20,150,9,C.red);credit(s,true);
  }
  function timelineScene(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    fit(s.title||'Rewind.',68,194,1464,78,C.ink,700);
    const events=s.events||[{year:'1985',label:'A different question'},{year:'1987',label:'TSMC opens'},{year:'1997',label:'NVIDIA needs chips'}];
    line(150,425,1450,425,C.line,4);
    for(let i=0;i<events.length;i++){
      const x=150+i*1300/(events.length-1),active=i===(s.active??1);ctx.beginPath();ctx.arc(x,425,active?14:8,0,Math.PI*2);ctx.fillStyle=active?C.red:C.ink;ctx.fill();
      text(events[i].year,x,370,active?70:42,active?C.red:C.ink,700,i===0?'left':i===events.length-1?'right':'center');
      const lx=clamp(x-150,68,1240);lines(events[i].label,lx,494,300,30,C.ink,500,1.1);
    }
    if(s.subtitle)lines(s.subtitle,70,693,1380,31,C.muted,400,1.2);credit(s);
  }
  function mapScene(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    image('taiwan',620,100,920,650,{mode:'contain',zoom:1+.05*ease(u)});
    rect(62,143,550,530,C.paper);text(s.year||'1985',68,245,109,C.red,700);
    const yy=lines(s.title||'Taiwan',70,350,530,75,C.ink,700,1.04);
    if(s.subtitle)lines(s.subtitle,72,yy+48,485,32,C.ink,400,1.18);
    // No fabricated coordinates: the image is a geographic locator, not a
    // survey-grade map or historical reconstruction of a specific factory.
    credit(s);
  }
  function funding(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    text('A factory still needs investors.',66,183,62,C.ink,700);
    text('≈ $220 million',66,325,115,C.blue,700);
    text('Initial capital, recalled by Morris Chang in 2007',72,381,28,C.muted,400);
    const parts=[{p:.48,name:'Taiwan government',v:'48%',color:C.ink},{p:.27,name:'Philips',v:'≈27%',color:C.blue},{p:.25,name:'Other Taiwanese investors',v:'Balance',color:'#a9b0b5'}];
    let x=70;for(const a of parts){const w=a.p*1460;rect(x,454,w-5,112,a.color);text(a.v,x+20,524,46,C.white,700);lines(a.name,x+5,619,w-30,29,C.ink,500,1.16);x+=w;}
    text('Approximate retrospective account · not a new audited capitalization table',72,741,23,C.muted,400);credit(s);
  }
  function boundary(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    text(s.title||'One business becomes two.',60,190,65,C.ink,700);
    const split=clamp(u*2),gap=30+90*ease(split),width=(1460-gap)/2;
    const x1=70,x2=70+width+gap;
    image(s.assetIds[0]||'tntboard',x1,239,width,342,{mode:'contain'});
    image(s.assetIds[1]||'factory1989',x2,239,width,342,{mode:'cover'});
    text(s.labels?.[0]||'Win a product.',x1,635,48,C.blue,700);
    text(s.labels?.[1]||'Run a factory.',x2,635,48,C.red,700);
    lines(s.notes?.[0]||'Design · software · customers',x1,687,width,28,C.ink,400);
    lines(s.notes?.[1]||'Equipment · people · process',x2,687,width,28,C.ink,400);
    if(s.subtitle)text(s.subtitle,70,756,25,C.muted,400);
    credit(s);
  }
  function allocation(s,u){
    rect(0,0,W,H,C.paper);masthead(s);text(s.title||'A factory for many customers.',60,180,65,C.ink,700);
    const bands=[{name:'A',color:C.blue},{name:'B',color:C.red},{name:'C',color:C.green}];
    text('Different chip businesses',70,270,26,C.muted,400);text('One manufacturing business',945,270,26,C.muted,400);
    for(let i=0;i<3;i++){
      const y=315+i*125;rect(70,y,255,77,bands[i].color);text('Customer '+bands[i].name,96,y+51,31,C.white,700);
      const end=clamp((u-.13*i)*3);arrow(350,y+37,850,440+45*i,end,bands[i].color);
    }
    rect(905,310,625,322,C.ink);
    text('MANUFACTURING',937,399,42,C.white,700);
    for(let i=0;i<12;i++)rect(940+(i%6)*90,449+Math.floor(i/6)*64,75,48,'#66737e');
    lines(s.subtitle||'One customer does not have to fill an entire fab.',908,692,620,34,C.ink,500,1.13);
    text('Conceptual aggregation · no measured customer shares or capacity',70,753,24,C.muted,400);credit(s);
  }
  function yieldScene(s,u){
    rect(0,0,W,H,C.ink);masthead(s,true);
    image('tntdie',0,135,740,610,{focus:[.51,.72],zoom:1.8});
    rect(740,135,860,610,C.ink);
    text('The wafer is not the product.',790,219,43,C.white,700);
    const step=s.mode||'test',count=20;
    for(let i=0;i<count;i++){
      const x=805+(i%5)*131,y=280+Math.floor(i/5)*90;
      const bad=[2,6,11,14,17].includes(i),tested=i<Math.floor(clamp(u*1.7)*count);
      rect(x,y,107,65,tested?(bad?C.red:'#d8e6d4'):'#737e86');
      if(tested&&bad){line(x+35,y+17,x+71,y+49,C.white,4);line(x+71,y+17,x+35,y+49,C.white,4);}
    }
    lines(s.title||'Only working chips can be sold.',792,712,720,35,C.white,500);
    text('Illustration · invented test pattern, not TSMC yield data',790,765,22,'#c2c9ce',400);credit(s,true);
  }
  function deadline(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    text(s.title||'The PC market will not wait.',65,190,71,C.ink,700);
    const cx=430,cy=451,r=183;
    ctx.strokeStyle=C.ink;ctx.lineWidth=14;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6;line(cx+Math.sin(a)*158,cy-Math.cos(a)*158,cx+Math.sin(a)*173,cy-Math.cos(a)*173,C.ink,5);}
    const a=(-.6+ease(u)*1.8)*Math.PI;line(cx,cy,cx+Math.sin(a)*142,cy-Math.cos(a)*142,C.red,9);line(cx,cy,cx+98,cy+32,C.ink,11);
    lines(s.subtitle||'A design win means little without deliveries.',790,357,700,65,C.blue,700,1.09);
    if(s.note)lines(s.note,790,620,670,30,C.muted,400);credit(s);
  }
  function endScene(s,u){
    image('fab12b',0,0,W,H,{focus:[.5,.5],zoom:1.04});rect(0,0,W,H,'rgba(7,14,23,.62)');masthead(s,true);
    const yy=lines(s.title||'More than a factory.',70,285,1380,100,C.white,700,1.04);
    if(s.subtitle)lines(s.subtitle,74,yy+58,1320,41,'#eeeade',400,1.15);
    if(s.note)lines(s.note,74,721,1380,24,'#c6cdd5',400,1.2);credit(s,true);
  }
  function record(s,u){
    rect(0,0,W,H,C.white);masthead(s);
    rect(65,155,12,557,C.red);
    text(s.organization||'THE RECORD',112,210,24,C.muted,700);
    const yy=lines(s.title,110,350,1365,85,C.ink,700,1.08);
    if(s.subtitle)lines(s.subtitle,114,Math.min(yy+65,640),1270,36,C.muted,400,1.2);
    credit(s);
  }
  function rewind(s,u){
    rect(0,0,W,H,C.ink);masthead(s,true);
    const p=ease(clamp(u*1.35));
    text(s.from,72-100*p,370,165,'#a1a7aa',700);
    text('→',653,382,100,C.red,500);
    text(s.to,1530,565,225,C.white,700,'right');
    line(78,433,1517,433,'#626a70',2);
    for(let i=0;i<13;i++){const x=79+i*120;rect(x,427,2,i%3?15:27,'#b4b9bd');}
    text(s.title,78,685,56,C.white,500);credit(s,true);
  }
  function partnership(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    lines(s.title,65,195,1440,62,C.ink,700,1.05);
    const added=!!s.added,cy=added?410:435;
    rect(70,cy-65,580,130,C.ink);fit(s.left||'NVIDIA',100,cy+21,520,57,C.white,700);
    rect(965,cy-65,565,130,C.blue);fit(s.right||'TSMC',995,cy+21,505,57,C.white,700);
    arrow(690,cy,930,cy,clamp(u*3));
    if(added){
      rect(965,580,565,115,C.red);text(s.added,995,653,57,C.white,700);
      line(809,cy,809,637,C.red,4);arrow(809,637,930,637,clamp((u-.2)*3));
      text('ADDITIONAL CAPACITY',70,622,25,C.muted,700);
    }
    if(s.subtitle)lines(s.subtitle,70,added?750:650,1430,32,C.ink,400,1.16);
    credit(s);
  }
  function orders(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    lines(s.title,65,190,1450,65,C.ink,700,1.04);
    const independent=s.mode==='independent';
    text(independent?'CHIP DESIGNER':'ESTABLISHED CHIP COMPANY',70,300,25,C.muted,700);
    text(independent?'OUTSIDE MANUFACTURER':'CHANG’S PROPOSED FACTORY',915,300,25,C.muted,700);
    // The named objects are order slips and production slots. Their return
    // illustrates a business risk; positions are not actual utilization data.
    rect(70,330,565,270,C.white);rect(915,330,615,270,C.white);
    if(independent){
      text('DESIGN',106,401,42,C.ink,700);rule(106,426,470,C.line,2);
      for(let i=0;i<6;i++)rule(106,453+i*20,410-(i%3)*50,C.line,3);
    }else{
      text('OWN FAB',102,390,40,C.ink,700);
      for(let i=0;i<12;i++)rect(104+(i%6)*78,430+Math.floor(i/6)*66,66,51,C.ink);
    }
    for(let i=0;i<12;i++){
      const occupied=s.mode==='return'?u<.45:independent||s.mode==='owned';
      rect(950+(i%6)*90,390+Math.floor(i/6)*83,76,64,occupied?C.blue:'#e2e1d9');
    }
    const returning=s.mode==='return',progress=ease(clamp(u*1.4));
    const px=returning?lerp(835,660,progress):lerp(660,835,progress);
    for(let i=0;i<3;i++){
      const yy=355+i*87;rect(px,yy,62,70,C.red);rule(px+10,yy+16,41,C.white,3);rule(px+10,yy+29,35,C.white,3);rule(px+10,yy+42,40,C.white,3);
    }
    if(returning)arrow(855,642,665,642,clamp(u*2));else arrow(665,642,855,642,clamp(u*2));
    lines(s.subtitle,70,735,1440,36,C.ink,500,1.15);credit(s);
  }
  function backers(s,u){
    rect(0,0,W,H,C.ink);masthead(s,true);
    lines(s.title,70,205,1370,66,C.white,700,1.05);
    const names=s.names||[];
    names.forEach((name,i)=>{
      const y=365+i*116,alpha=clamp((u-i*.13)*4);ctx.save();ctx.globalAlpha=alpha;
      text(String(i+1).padStart(2,'0'),74,y,30,'#9fa7ad',500);
      text(name,180,y,65,C.white,700);rule(180,y+28,1335,'#58616a',1);ctx.restore();
    });credit(s,true);
  }
  function numberScene(s,u){
    rect(0,0,W,H,C.blue);masthead(s,true);
    text(s.number,65,512,340,C.white,700);text(s.unit,590,500,88,C.white,700);
    text(s.title,78,638,57,C.white,700);
    if(s.subtitle)text(s.subtitle,81,714,35,'#e2e8ff',400);credit(s,true);
  }
  function coupling(s,u){
    rect(0,0,W,H,C.ink);masthead(s,true);
    text(s.title,66,191,64,C.white,700);
    rect(70,257,630,353,'#e9e7dc');rect(900,257,630,353,'#d4dfe8');
    text('INTENDED PATTERN',102,300,25,C.ink,700);text('ILLUSTRATED RESULT',935,300,25,C.ink,700);
    // Two lithographic lines: one intended separation, one widened result.
    // Explicitly a schematic, not a process cross-section or measured failure.
    const target=[369,471];for(const y of target)rect(109,y,550,36,C.blue);
    const expansion=u<.62?36*ease(clamp(u/.38)):lerp(36,5,ease((u-.62)/.3));
    const bridged=expansion>=33,corrected=u>.9;
    for(const y of target)rect(939,y-expansion,550,36+2*expansion,corrected?C.green:C.red);
    text(bridged?'BRIDGE · unintended connection':corrected?'SEPARATION RESTORED':'Process variation changes the result',935,566,26,C.ink,700);
    arrow(735,438,864,438,clamp(u*2),C.white);
    lines(s.subtitle,72,688,1440,40,C.white,500,1.13);
    text('Explanatory example — NOT the diagnosed cause of NVIDIA’s 1997 problem',76,759,27,'#d4dce1',600);
    credit(s,true);
  }
  function process(s,u){
    rect(0,0,W,H,C.paper);masthead(s);text(s.title,66,200,83,C.ink,700);
    const labels=s.steps||[],active=Math.min(labels.length-1,Math.floor(u*labels.length));
    labels.forEach((label,i)=>{
      const x=70+i*374;rect(x,335,335,182,i<=active?C.ink:'#deded3');
      text(String(i+1).padStart(2,'0'),x+20,378,23,i<=active?'#bfc6cb':C.muted,500);
      lines(label,x+20,435,292,34,i<=active?C.white:C.ink,700,1.1);
      if(i<labels.length-1)arrow(x+344,425,x+365,425,i<active?1:0);
    });
    lines(s.subtitle,73,645,1380,35,C.muted,400,1.16);credit(s);
  }
  function forecast(s,u){
    rect(0,0,W,H,C.paper);masthead(s);
    text('A LATER VISIT · RECALLED IN 2007',70,180,27,C.muted,700);
    lines(s.title,69,275,1380,72,C.ink,700,1.05);
    // No fabricated notebook, signature, handwriting or order figure.
    // The two consequences are an explicitly editorial interpretation.
    const sides=[{x:70,label:'TOO LOW',result:'Not enough wafers.',color:C.blue},{x:835,label:'TOO HIGH',result:'Capacity left unused.',color:C.red}];
    for(let i=0;i<2;i++){
      const a=sides[i];rect(a.x,451,695,193,C.white);rect(a.x,451,695*pop(clamp((u-i*.18)*2)),8,a.color);
      text(a.label,a.x+25,505,27,a.color,700);text(a.result,a.x+25,576,47,C.ink,700);
    }
    text('Editorial interpretation of why a wafer forecast matters',73,717,29,C.muted,400);credit(s);
  }
  function milestone(s,u){
    rect(0,0,W,H,C.ink);masthead(s,true);
    // The 500 marks are a scale key, not an estimate or growth time series.
    for(let i=0;i<500;i++){
      const x=68+(i%50)*29.3,y=154+Math.floor(i/50)*28;
      rect(x,y,17,15,i<Math.floor(ease(clamp(u*1.9))*500)?'#57636e':'#27323c');
    }
    text(s.number,63,610,230,C.white,700);text(s.unit,545,586,78,C.white,700);
    text(s.title,76,690,44,C.white,500);
    text(`${s.from}–${s.to}`,1525,687,39,'#aab5bd',500,'right');
    text('Each mark represents one million processors · cumulative total, not annual growth',76,751,23,'#bac4cb',400);
    credit(s,true);
  }
  const drawers={portrait,photo,object,macro,compare,question,document:paper,timeline:timelineScene,map:mapScene,funding,boundary,allocation,yield:yieldScene,deadline,end:endScene,record,rewind,partnership,orders,backers,number:numberScene,coupling,process,forecast,milestone};
  function draw(t){
    const duration=timeline.duration_seconds||timeline.duration;t=clamp(t,0,duration);
    const s=shots.find(s=>t>=s.t0&&t<s.t1)||shots.at(-1),u=clamp((t-s.t0)/Math.max(.001,s.t1-s.t0));
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.setLineDash([]);ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0;ctx.textAlign='left';ctx.imageSmoothingEnabled=true;
    ctx.scale(canvas.width/W,canvas.height/H);rect(0,0,W,H,C.paper);
    const painter=drawers[s.kind];if(!painter)throw new Error('Unknown authored composition: '+s.kind);
    painter(s,u);
    state={shotId:s.id,id:s.id,rowId:s.rowId,kind:s.kind,composition:s.kind,assetIds:[...s.assetIds],time:t,local:u};return state;
  }
  return {draw,shots,get state(){return state},canvas};
}
