/** Business workspaces as editorial reconstruction, not portraits or meeting footage. */
export function createDeskSet(T,kit){
  const {box,cyl,mat,label,tube,M}=kit,root=new T.Group(),design=new T.Group(),forecast=new T.Group();
  root.name='Design desk and forecast insert';root.add(design,forecast);
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  const wood=mat('#c8a27b',.57,0,{map:kit.texture('wood',49)}),wall=mat('#c6bda7',.91),paper=mat('#f0e6cf',.91),leather=mat('#171e1e',.89,.01,{map:kit.texture('paper',9)});
  function table(group){group.add(box(5,.06,5,M.floor,0,-.03,0,0),box(5,3,.12,wall,0,1.5,-1.9,0),box(2.25,.075,1.05,wood,0,.765,0,.008));for(const x of[-1,1])for(const z of[-.4,.4])group.add(box(.055,.73,.055,M.ink,x,.365,z,.004));}
  table(design);table(forecast);
  // Design work has its own cooler drafting surface, shelves, lamp and tools.
  design.add(box(1.22,.01,.72,mat('#42726f',.95),-.22,.81,0,0));
  const drawing=label('BOARD LAYOUT\nREVISION B  /  REVIEW',.45,.28,{background:'#dfe5d4',color:'#2e4c50',size:31});drawing.rotation.x=-Math.PI/2;drawing.position.set(-.30,.819,.04);design.add(drawing);
  const prototype=new T.Group();prototype.position.set(.47,.823,.1);prototype.add(box(.20,.007,.15,M.pcb,0,0,0,.001),box(.065,.009,.058,M.ink,0,.01,0,.001));
  for(let i=0;i<4;i++)prototype.add(box(.026,.008,.017,M.ink,-.07+i*.045,.01,-.053,.001));design.add(prototype);
  for(let i=0;i<12;i++){const leg=box(.002,.004,.009,M.steel,-.027+i*.005,.01,.033,0);prototype.add(leg);}
  const ruler=box(.36,.002,.03,M.steel,-.15,.822,.35,.0001);ruler.rotation.y=-.15;design.add(ruler);
  const pencil=cyl(.003,.19,mat('#b58f3b',.75),.2,.825,.32,8);pencil.rotation.z=Math.PI/2;pencil.rotation.y=.35;design.add(pencil);
  design.add(box(.7,.025,.25,M.wood,.6,1.5,-1.76,.004));
  for(let i=0;i<8;i++)design.add(box(.043,.20,.15,i%3===0?M.ink:i%2===0?M.paint:M.paper,.32+i*.066,1.61,-1.73,.001));
  const lampFoot=cyl(.095,.02,M.ink,-.84,.82,-.27,24);design.add(lampFoot,tube([[-.84,.83,-.27],[-.84,1.02,-.29],[-.61,1.28,-.19]],.014,M.steel));
  const shade=new T.Mesh(new T.ConeGeometry(.11,.16,24,1,true),mat('#82968d',.5,.2,{side:T.DoubleSide}));shade.rotation.z=.5;shade.position.set(-.59,1.26,-.19);design.add(shade);
  const clipped=label('PRODUCT DESIGN\nNo fabrication line here.',.48,.19,{background:'#eee9d8',color:'#384742',size:29});clipped.position.set(-.32,1.35,-1.82);design.add(clipped);
  // Forecast: black notebook, actual page thickness, binding, pencil, cup, window.
  forecast.add(box(1.55,1.45,.04,mat('#90acb5',.93,0,{emissive:'#78959f',emissiveIntensity:.05}),0,1.98,-1.82,0));
  for(const x of[-.79,0,.79])forecast.add(box(.035,1.5,.06,M.paint,x,1.98,-1.77,0));
  for(const y of[1.22,2.74])forecast.add(box(1.64,.04,.08,M.paint,0,y,-1.77,0));
  const book=new T.Group();book.position.set(-.10,.82,.03);book.rotation.y=-.14;
  book.add(box(.45,.012,.31,leather,0,0,0,.003),box(.211,.014,.288,paper,-.112,.011,0,.002),box(.211,.014,.288,paper,.112,.011,0,.002),box(.007,.016,.30,leather,0,.013,0,.001));
  const pageCanvas=document.createElement('canvas');pageCanvas.width=640;pageCanvas.height=860;const pctx=pageCanvas.getContext('2d');
  pctx.fillStyle='#f0e6cf';pctx.fillRect(0,0,640,860);pctx.strokeStyle='#c2b7a1';pctx.lineWidth=1;
  for(let i=0;i<13;i++){pctx.beginPath();pctx.moveTo(46,190+i*45);pctx.lineTo(595,190+i*45);pctx.stroke();}
  pctx.fillStyle='#343e3c';pctx.font='500 41px Georgia';pctx.fillText('Wafer demand',46,97);pctx.font='24px Arial';pctx.fillText('FORECAST  /  TO BE CONFIRMED',46,144);
  const pageMap=new T.CanvasTexture(pageCanvas);pageMap.colorSpace=T.SRGBColorSpace;
  const page=new T.Mesh(new T.PlaneGeometry(.197,.267),new T.MeshBasicMaterial({map:pageMap}));page.rotation.x=-Math.PI/2;page.position.set(.112,.019,0);book.add(page);
  // Graphite marks, not invented historical numbers. Revealed by a separate paper mask.
  const annotations=[];
  for(let i=0;i<5;i++){const l=label(['next quarter','capacity required','review together','process readiness','confirm forecast'][i],.163,.012,{background:'#f0e6cf',color:'#42494b',size:21});l.rotation.x=-Math.PI/2;l.position.set(.112,.0195,-.057+i*.031);book.add(l);annotations.push(l);}
  const left=label('CUSTOMER\nOUTLOOK',.18,.085,{background:'#f0e6cf',color:'#7c786b',size:26});left.rotation.x=-Math.PI/2;left.position.set(-.112,.019,-.04);book.add(left);
  forecast.add(book);
  const pen=new T.Group();pen.add(cyl(.004,.145,M.ink,0,.073,0,10),new T.Mesh(new T.ConeGeometry(.004,.015,10),M.steel));pen.children[1].rotation.z=Math.PI;pen.children[1].position.y=-.006;pen.rotation.z=.5;pen.rotation.x=.22;forecast.add(pen);
  const cup=cyl(.044,.085,M.white,.56,.855,-.23,28);forecast.add(cup,cyl(.036,.001,mat('#382a1b',.25),.56,.898,-.23,28));
  const cupHandle=new T.Mesh(new T.TorusGeometry(.031,.007,6,18),M.white);cupHandle.position.set(.607,.856,-.23);forecast.add(cupHandle);
  const folder=box(.32,.012,.24,mat('#617878',.86),-.64,.82,-.20,.002);folder.rotation.y=.08;forecast.add(folder);
  let state={};
  function frame({act='design',p=0,shot='wide',u=0,t=0}){
    design.visible=act==='design';forecast.visible=!design.visible;
    // The notebook is a retrospective insert, not a disembodied historical hand.
    // Put the pen beside it and reset even the hidden set on every absolute seek.
    annotations.forEach((o,i)=>o.visible=!design.visible&&p>(i+1)*.14);
    pen.position.set(.40,.820,.15);pen.rotation.set(0,0,Math.PI/2);pen.visible=true;
    let position,target,fov;
    if(design.visible){
      const views={wide:[[-1.48,1.35,1.55],[-.10,.96,-.16],42],drawing:[[-.19,1.20,.42],[-.18,.82,.03],34],prototype:[[.35,1.53,.51],[.06,.82,.08],46],room:[[-1.95,1.25,2.6],[-.15,1.03,-.20],40]};
      [position,target,fov]=views[shot]||views.wide;prototype.position.y=.823;
    }else{
      const views={wide:[[-1.2,1.37,1.45],[-.1,.85,.01],38],book:[[-.06,1.18,.38],[-.06,.837,.02],35],page:[[.14,1.09,.16],[.012,.839,.02],30],edge:[[-.38,.91,.40],[-.08,.836,.03],34]};
      [position,target,fov]=views[shot]||views.book;
    }
    position=[...position];target=[...target];for(let i=0;i<3;i++)position[i]+=(target[i]-position[i])*.035*ease(u);
    state={act,shot,marksVisible:design.visible?0:annotations.filter(o=>o.visible).length,illustration:true,noHistoricalQuantities:true};
    return {position,target,fov,look:{background:design.visible?'#263a3c':'#494238',key:design.visible?'#d9f1ea':'#f5d5a3',fill:'#b8cad3',exposure:1.03},label:design.visible?'A product they could build. A factory they could not fund.':'A forecast commits a factory.',detail:design.visible?'Editorial workspace illustration · not a named historical startup':'Illustration of Huang’s later recollection · notebook quantities are not reconstructed',state};
  }
  return {root,frame,inspect:()=>state};
}
