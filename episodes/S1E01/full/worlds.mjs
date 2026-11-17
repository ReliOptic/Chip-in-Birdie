/* Original S1E01 scene geometry. One fictional customer layout crosses the film.
 * All reconstruction choices are illustrative; no proprietary facility or circuit. */
export function createWorlds(T){
  const C={paper:0xebe5d8,ink:0x1b2932,steel:0x9ca8ae,copper:0xb07844,silicon:0x355b73,teal:0x3c8279,red:0xa84536};
  const mat=(color,roughness=.45,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const M={paper:mat(C.paper,.85),ink:mat(C.ink,.32,.5),steel:mat(C.steel,.24,.8),copper:mat(C.copper,.24,.8),silicon:new T.MeshPhysicalMaterial({color:C.silicon,metalness:.65,roughness:.2,clearcoat:1,clearcoatRoughness:.14}),teal:mat(C.teal,.4,.2),red:mat(C.red,.55),wood:mat(0x453b30,.7),dark:mat(0x101b22,.6)};
  const clamp=x=>Math.max(0,Math.min(1,x));const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  function box(w,h,d,m,x=0,y=0,z=0,r=.035){
    let g;if(r>0){r=Math.min(r,w/5,d/5,h/3);const a=w/2,b=d/2;const s=new T.Shape();s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);g=new T.ExtrudeGeometry(s,{depth:Math.max(.001,h-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r*.5,bevelSegments:2,steps:1,curveSegments:3});g.rotateX(-Math.PI/2);g.translate(0,-h/2+r,0)}else g=new T.BoxGeometry(w,h,d);
    const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;
  }
  function cyl(r,h,m,x=0,y=0,z=0){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,40),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
  function line(points,color=C.copper,width=.018){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,Math.max(8,points.length*5),width,6,false),mat(color,.35,.7));return o;}
  function labelTexture(lines,{bg='#ebe5d8',fg='#23333d',width=1200,height=800,title=90}={}){
    const cv=document.createElement('canvas');cv.width=width;cv.height=height;const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,width,height);
    c.fillStyle=fg;c.textBaseline='top';for(let i=0;i<lines.length;i++){c.font=`${i===0?'600':'500'} ${i===0?title:Math.round(title*.6)}px ${i===0?'Georgia':'Arial'}, serif`;c.fillText(lines[i],width*.09,height*.12+i*height*.17,width*.82)}
    const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;return tx;
  }
  function paper(lines,w=3.8,d=2.65){const g=new T.Group();g.add(box(w,.022,d,M.paper,0,0,0,.003));const face=new T.Mesh(new T.PlaneGeometry(w*.99,d*.99),new T.MeshStandardMaterial({map:labelTexture(lines),roughness:.95}));face.rotation.x=-Math.PI/2;face.position.y=.015;g.add(face);return g;}
  function plaque(text,w=2.3){const o=new T.Mesh(new T.PlaneGeometry(w,.39),new T.MeshStandardMaterial({map:labelTexture([text],{width:1000,height:180,title:80}),roughness:.8}));return o;}
  function layout(scale=1){const g=new T.Group();const parts=[[-.55,0,.14,1.25],[.02,.6,1.27,.14],[.5,-.5,.52,.38]];for(const[x,z,w,d]of parts)g.add(box(w,.035,d,M.copper,x,.0,z,.007));for(const[x,z]of[[-.55,-.63],[-.55,.6],[.65,.6]])g.add(box(.22,.05,.22,M.copper,x,.013,z,.012));for(let i=0;i<6;i++)g.add(box(.032,.018,.26,M.steel,.29+i*.08,.03,-.52,0));g.scale.setScalar(scale);return g;}
  function chip(scale=1){const g=new T.Group();g.add(box(1.9,.16,1.9,M.silicon,0,0,0,.05));const l=layout();l.position.y=.1;g.add(l);g.scale.setScalar(scale);return g;}
  function factoryMini(){const g=new T.Group();g.add(box(1.6,.9,1.2,M.paper,0,.45,0,.045));g.add(box(1.7,.12,1.3,M.ink,0,.99,0));for(let i=0;i<5;i++){g.add(box(.18,.24,.03,M.silicon,-.55+i*.28,.65,.62));g.add(box(.22,.08,.45,M.steel,-.55+i*.28,1.1,0))}g.add(box(.42,.5,.03,M.dark,.4,.25,.63));return g;}
  function base(root,w=8,d=5){root.add(box(w,.19,d,M.ink,0,-.1,0,.07));for(const x of[-w/2+.35,w/2-.35])for(const z of[-d/2+.3,d/2-.3])root.add(cyl(.055,.014,M.steel,x,.012,z));}
  const worlds={};
  // 01. A genuine design desk: pattern plate, technical papers, instrument rail.
  {
    const root=new T.Group();base(root,7.9,4.8);
    const board=box(3.4,.12,3.1,M.silicon,-.65,.12,0,.05);root.add(board);
    const grid=new T.Group();for(let i=-7;i<=7;i++){grid.add(box(.007,.003,2.8,M.steel,i*.2-.65,.183,0,0));grid.add(box(3,.003,.007,M.steel,-.65,.183,i*.19,0))}root.add(grid);
    const motif=layout(1.55);motif.position.set(-.65,.24,0);root.add(motif);
    const pin=box(.13,.065,.72,M.red,-.34,.24,-.4,.008);root.add(pin);
    const rule=paper(['PROCESS RULES','SPACING / CONNECTIONS','Illustrative dimensions'],2.2,1.5);rule.position.set(2.5,.15,-.75);rule.rotation.y=-.12;root.add(rule);
    const notes=paper(['CUSTOMER DESIGN','Not a real circuit','Layout study  /  01'],2.1,1.2);notes.position.set(2.4,.16,.85);notes.rotation.y=.08;root.add(notes);
    const pen=cyl(.035,1.7,M.steel,3.4,.22,.3);pen.rotation.z=Math.PI/2-.2;root.add(pen);
    const company=factoryMini();company.position.set(2.3,.21,0);company.scale.setScalar(1.2);root.add(company);
    const designTile=chip(.65);designTile.position.set(-2.5,.25,.25);root.add(designTile);
    const connect=line([[-1.4,.22,0],[0,.22,0],[1.6,.22,0]],C.copper,.028);root.add(connect);
    worlds.design={root,label:'The customer’s layout',disclosure:'ILLUSTRATIVE MODEL · NOT A CUSTOMER CIRCUIT',camera:{from:[5.5,6.4,6.7],to:[4.7,5.8,6.4],target:[0,.25,0],fov:37},update(u,phase){
      const v=ease(u);const alt=['alternatives','separate','independent'].includes(phase);board.visible=grid.visible=motif.visible=!alt;rule.visible=notes.visible=pen.visible=!alt;company.visible=designTile.visible=connect.visible=alt;pin.visible=['violation','repair'].includes(phase);pin.position.x=-.34+(phase==='repair'?.55*v:0);
      company.position.x=phase==='separate'?1.3+1.0*v:2.3;designTile.position.x=phase==='independent'?-2.5+.5*v:-2.5;
      motif.position.y=.24;motif.rotation.y=0;board.material=M.silicon;
    },state(){return {violationPin:pin.position.x,alternative:company.visible}}};
  }
  // 02. Records as physical objects. All displayed text is an authored summary, never a forged scan.
  {
    const root=new T.Group();root.add(box(8,.22,5.3,M.wood,0,-.1,0,.09));
    for(let i=0;i<8;i++)root.add(box(7.9,.001,.008,mat(0x514337,.9),0,.013,-2.3+i*.62,0));
    const sheets={
      '1985':paper(['1985 / TAIWAN','A new semiconductor company','Morris Chang’s 2007 recollection','Manufacturing as a potential strength']),
      capital:paper(['1987 / STARTING CAPITAL','About US$220 million','Chang, conversation recorded in 2007','Retrospective estimate']),
      partners:paper(['INITIAL INVESTORS','Government  48%','Philips  about 27%','Other Taiwanese investors  balance']),
      contracts:paper(['1987 / CAPABILITIES','ITRI  ·  facilities and equipment','Philips  ·  technology cooperation','Reported in the 1994 annual report']),
      charter:paper(['1994 / COMPANY RECORD','No own-brand IC end products','Charter described by TSMC','Annual report  ·  printed page 5']),
      cirrus:paper(['1993 / CIRRUS LOGIC','Deposit and supply agreement','Wafer manufacturing commitment','Annual report 1994  ·  page 15']),
      visit:paper(['NVIDIA / CUSTOMER VISITS','Chip size  →  future wafer needs','Huang recalling Chang’s visits','2007 conversation  ·  pp. 5–6'])
    };
    for(const s of Object.values(sheets)){s.position.set(-.55,.16,-.12);s.rotation.y=-.09;root.add(s)}
    const under=paper(['CHIP IN BIRDIE','Source dossier / S1E01','Evidence → interpretation → model'],4.1,2.8);under.position.set(-.64,.07,-.14);under.rotation.y=.03;root.add(under);
    const rulerGroup=new T.Group();const ruler=box(.35,.045,3.5,M.steel,2.55,.08,.02,.015);rulerGroup.add(ruler);for(let i=0;i<32;i++)rulerGroup.add(box(i%5===0?.23:.12,.005,.01,M.ink,2.53,.106,-1.55+i*.1,0));root.add(rulerGroup);
    const visitBook=new T.Group();visitBook.add(box(4.02,.12,2.87,M.dark,-.55,.06,-.12,.04));visitBook.add(box(3.87,.04,2.69,M.paper,-.55,.14,-.12,.012));visitBook.rotation.y=-.09;root.add(visitBook);
    const visitDesign=chip(.55);visitDesign.position.set(2.55,.14,-.5);root.add(visitDesign);const visitWafer=cyl(.68,.05,M.silicon,2.55,.08,1.1);root.add(visitWafer);
    const clip=new T.Mesh(new T.TorusGeometry(.12,.016,6,32,Math.PI*1.6),M.steel);clip.rotation.x=Math.PI/2;clip.scale.set(1,2,1);clip.position.set(-2.1,.23,-1.3);root.add(clip);
    const bars=new T.Group();const fractions=[.48,.27,.25];const materials=[M.copper,M.silicon,M.paper];let xpos=-2.7;fractions.forEach((f,i)=>{const b=box(f*5.6,.35,.55,materials[i],xpos+f*2.8,.2,1.95,.015);bars.add(b);xpos+=f*5.6+.035});root.add(bars);
    const dates=new T.Group();for(const [i,t]of['1985','1987','1993','1994'].entries()){const p=plaque(t,.75);p.rotation.x=-Math.PI/2;p.position.set(-2.7+i*1.8,.03,-2.18);dates.add(p)}root.add(dates);
    worlds.archive={root,label:'A decision in the historical record',disclosure:'AUTHORED SOURCE SUMMARY · NOT AN ARCHIVAL IMAGE',camera:{from:[3.6,7.8,5.6],to:[2.8,7.5,4.8],target:[-.2,.05,0],fov:38},update(u,phase){for(const[k,v]of Object.entries(sheets)){v.visible=k===phase;v.position.y=.15+.025*ease(u)}bars.visible=phase==='partners';dates.visible=phase!=='partners'&&phase!=='visit';visitBook.visible=visitDesign.visible=visitWafer.visible=phase==='visit';under.visible=rulerGroup.visible=phase!=='visit';},state(){return{record:Object.keys(sheets).find(k=>sheets[k].visible)}}};
  }
  // 03. Product and foundry are separate places; a real gate closes only the own-product branch.
  {
    const root=new T.Group();base(root,8.2,5.4);const left=new T.Group();left.add(box(2.05,.36,2.25,M.paper,0,.18,0));const l=chip(.8);l.position.y=.45;left.add(l);left.position.x=-2.55;root.add(left);
    const right=factoryMini();right.position.set(.6,.04,0);right.scale.setScalar(1.5);root.add(right);
    const customer=plaque('CUSTOMER',1.75);customer.rotation.x=-Math.PI/2;customer.position.set(-2.55,.03,1.75);root.add(customer);
    const foundry=plaque('FOUNDRY',1.75);foundry.rotation.x=-Math.PI/2;foundry.position.set(.6,.03,1.75);root.add(foundry);
    const branch=line([[.6,.07,-.9],[.6,.07,-1.65],[2.8,.07,-1.65],[2.8,.07,-.6]],C.steel,.032);root.add(branch);
    const own=chip(.5);own.position.set(3,.15,-.1);root.add(own);
    const ownLabel=plaque('OWN PRODUCT',1.65);ownLabel.rotation.x=-Math.PI/2;ownLabel.position.set(2.9,.03,.9);root.add(ownLabel);
    const inbound=line([[-1.5,.07,.25],[-.8,.07,.25],[-.8,.07,-.3],[-.3,.07,-.3]],C.copper,.04);root.add(inbound);
    const outbound=line([[.8,.07,1.1],[.8,.07,1.4],[-2.5,.07,1.4],[-2.5,.07,.9]],C.teal,.035);root.add(outbound);
    const gate=new T.Group();gate.position.set(2.1,.15,-1.65);for(const z of[-.36,.36])gate.add(box(.12,1.5,.12,M.ink,0,.75,z));const stop=box(.13,1.08,.72,M.red,0,.72,0,.015);gate.add(stop);root.add(gate);
    const work=chip(.22);root.add(work);const returned=chip(.24);root.add(returned);
    worlds.boundary={root,label:'One conflict, explicitly bounded',disclosure:'ILLUSTRATIVE BUSINESS RELATIONSHIP · NOT A CONTRACT DIAGRAM',camera:{from:[6.3,7.6,8.5],to:[5.2,6.8,8.2],target:[0,.3,0],fov:36},update(u,phase){
      const v=ease(u);stop.scale.y=phase==='close'?.08+.92*v:1;stop.position.y=.72;work.visible=['open','close'].includes(phase);work.position.set(-1.25+1.6*v,.28,-.1);returned.visible=['return','risk'].includes(phase);returned.position.set(.65-3.0*v,.26,1.35);own.material=M.silicon;own.visible=true;gate.visible=true;branch.visible=true;
    },state(){return {gate:stop.scale.y,customerProductX:returned.position.x}}};
  }
  // 04. The design returns as a device; schematic packaging is disclosed, not a real SKU.
  {
    const root=new T.Group();base(root,7.4,4.9);
    const drawing=paper(['CUSTOMER / ORIGINAL LAYOUT','The product decision remains here','Same fictional pattern'],2.65,2.8);drawing.position.set(-2,.08,0);root.add(drawing);
    const drawingMotif=layout(.85);drawingMotif.position.set(-2,.13,.3);root.add(drawingMotif);
    const packageGroup=new T.Group();packageGroup.position.set(1.25,.3,0);root.add(packageGroup);
    const substrate=box(2.7,.2,2.7,M.ink,0,0,0,.07);packageGroup.add(substrate);
    const die=chip(.85);die.position.y=.23;packageGroup.add(die);
    const lid=new T.Group();lid.add(box(2.82,.12,2.82,M.steel,0,.67,0,.05));for(const z of[-1.36,1.36])lid.add(box(2.82,.61,.1,M.steel,0,.305,z,.02));for(const x of[-1.36,1.36])lid.add(box(.1,.61,2.62,M.steel,x,.305,0,.02));lid.position.y=1.6;packageGroup.add(lid);
    const balls=new T.InstancedMesh(new T.SphereGeometry(.07,8,6),M.steel,81);const mx=new T.Matrix4();let n=0;for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){mx.makeTranslation(x*.27,-.18,z*.27);balls.setMatrixAt(n++,mx)}packageGroup.add(balls);
    const bonds=new T.Group();for(let i=-3;i<=3;i++){const x=i*.2;for(const s of[-1,1])bonds.add(line([[x,.27,s*.8],[x,.52,s*1.0],[x,.12,s*1.25]],C.copper,.011))}packageGroup.add(bonds);
    const tray=box(3.15,.08,3.15,M.paper,1.25,.08,0,.06);root.add(tray);
    const split=box(.012,.012,3.5,M.copper,-.3,.02,0,0);root.add(split);
    worlds.return={root,label:'A design becomes a product',disclosure:'ILLUSTRATIVE DIE / PACKAGE · NOT A TSMC PRODUCT',camera:{from:[5.7,6.6,7.4],to:[4.9,5.5,6.8],target:[.2,.35,0],fov:37},update(u,phase){
      const v=ease(u);lid.visible=['package','together','final'].includes(phase);lid.position.y=['together','final'].includes(phase)?.11:1.6-1.49*v;packageGroup.rotation.y=phase==='die'?-.18+.12*v:0;drawing.visible=drawingMotif.visible=phase!=='die';packageGroup.position.x=phase==='die'?.45:1.25;bonds.visible=true;
    },state(){return{lid:lid.position.y,phaseVisible:lid.visible}}};
  }
  return worlds;
}
