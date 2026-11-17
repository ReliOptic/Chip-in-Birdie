/* S1E01 r4 — physical relationships, not a succession of miniature title cards.
 * Original authored geometry. The recurring L is an illustrative interconnect
 * motif, NOT a functioning circuit, customer design or historical reconstruction.
 * All picture state and cameras are closed functions of (phase, u, shotId).
 */
export function createWorlds(T) {
  const C={paper:0xe4ded1,ink:0x233039,steel:0x9eabb0,copper:0xae783d,
    silicon:0x35576b,teal:0x4b8175,red:0xa44a36,wood:0x504435};
  const mat=(color,roughness=.45,metalness=0,extra={})=>
    new T.MeshStandardMaterial({color,roughness,metalness,...extra});
  const M={paper:mat(C.paper,.83),ink:mat(C.ink,.41,.42),steel:mat(C.steel,.3,.78),
    copper:mat(C.copper,.3,.82),silicon:new T.MeshPhysicalMaterial({color:C.silicon,
      metalness:.68,roughness:.22,clearcoat:.8,clearcoatRoughness:.18}),
    teal:mat(C.teal,.45,.2),red:mat(C.red,.56),wood:mat(C.wood,.78),
    dark:mat(0x131a1c,.65),oxide:mat(0xb5c2c3,.58),
    glass:mat(0xb6c9cd,.26,.08,{transparent:true,opacity:.14,depthWrite:false}),
    muted:mat(0x706f66,.7,.16)};
  const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const ramp=(u,a,b)=>ease((u-a)/(b-a));
  const lerp=(a,b,u)=>a+(b-a)*u;
  const vec=(a,b,u)=>a.map((v,i)=>lerp(v,b[i],u));
  const geometries=new Map();
  function box(w,h,d,m,x=0,y=0,z=0,r=.025) {
    const key=['box',w,h,d,r].join('/');let g=geometries.get(key);
    if(!g) {
      if(r>0) {
        r=Math.min(r,w/5,d/5,h/3);const a=w/2,b=d/2,s=new T.Shape();
        s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);
        s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);
        s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);
        g=new T.ExtrudeGeometry(s,{depth:Math.max(.001,h-2*r),bevelEnabled:true,
          bevelThickness:r,bevelSize:r*.5,bevelSegments:2,steps:1,curveSegments:3});
        g.rotateX(-Math.PI/2);g.translate(0,-h/2+r,0);
      } else g=new T.BoxGeometry(w,h,d);
      geometries.set(key,g);
    }
    const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;
  }
  function cyl(r,h,m,x=0,y=0,z=0,segments=48) {
    const key=['cyl',r,h,segments].join('/');let g=geometries.get(key);
    if(!g){g=new T.CylinderGeometry(r,r,h,segments);geometries.set(key,g)}
    const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;
  }
  function line(points,color=C.copper,width=.018) {
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const o=new T.Mesh(new T.TubeGeometry(curve,Math.max(8,points.length*5),width,6,false),
      mat(color,.38,.7));o.castShadow=true;o.receiveShadow=true;return o;
  }
  // Only call on fixed subassemblies: animated child objects are never merged.
  function batch(group) {
    group.updateMatrixWorld(true);const inv=new T.Matrix4().copy(group.matrixWorld).invert(),sets=new Map();
    group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
      const k=o.geometry.uuid+o.material.uuid;if(!sets.has(k))sets.set(k,[]);sets.get(k).push(o)});
    for(const members of sets.values()) {
      if(members.length<4)continue;
      const inst=new T.InstancedMesh(members[0].geometry,members[0].material,members.length);
      inst.name='Fixed detail / '+group.name;inst.castShadow=true;inst.receiveShadow=true;inst.frustumCulled=false;
      members.forEach((m,i)=>{inst.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inv,m.matrixWorld));m.removeFromParent()});
      group.add(inst);
    }
    return group;
  }
  function labelTexture(lines) {
    const cv=document.createElement('canvas');cv.width=1200;cv.height=800;
    const c=cv.getContext('2d');c.fillStyle='#e4ded1';c.fillRect(0,0,1200,800);
    c.fillStyle='#34454c';c.textBaseline='top';
    c.font='500 88px Georgia, serif';c.fillText(lines[0]||'',94,96,1012);
    c.font='400 42px Arial, sans-serif';if(lines[1])c.fillText(lines[1],96,218,1008);
    // Abstract ruled lines, deliberately NOT a forged document facsimile.
    c.strokeStyle='#b5b2a7';c.lineWidth=2;
    for(let i=0;i<6;i++){c.beginPath();c.moveTo(96,360+i*45);c.lineTo(1060-i%3*120,360+i*45);c.stroke()}
    const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;return tx;
  }
  function paper(lines,w=2.5,d=1.7) {
    const g=new T.Group();g.name='Authored source summary, not archival scan';
    g.add(box(w,.022,d,M.paper,0,0,0,.003));
    const face=new T.Mesh(new T.PlaneGeometry(w*.99,d*.99),new T.MeshStandardMaterial({map:labelTexture(lines),roughness:.95}));
    face.rotation.x=-Math.PI/2;face.position.y=.015;g.add(face);return g;
  }
  function layout(scale=1) {
    const g=new T.Group();g.name='Illustrative customer L';
    const parts=[[-.55,0,.14,1.25],[.02,.6,1.27,.14],[.5,-.5,.52,.38]];
    for(const[x,z,w,d]of parts)g.add(box(w,.035,d,M.copper,x,0,z,.007));
    for(const[x,z]of[[-.55,-.63],[-.55,.6],[.65,.6]])g.add(box(.22,.05,.22,M.copper,x,.013,z,.012));
    for(let i=0;i<6;i++)g.add(box(.032,.018,.26,M.steel,.29+i*.08,.03,-.52,0));
    for(let i=0;i<10;i++){
      g.add(box(.042,.009,.11,M.copper,-.75+i*.16,.005,-.82,0));
      g.add(box(.042,.009,.11,M.copper,-.75+i*.16,.005,.85,0));
    }
    batch(g);g.scale.setScalar(scale);return g;
  }
  function chip(scale=1) {
    const g=new T.Group();g.name='Illustrative die';
    g.add(box(1.9,.105,1.9,M.silicon,0,0,0,.018));
    g.add(box(1.87,.016,1.87,M.oxide,0,.059,0,.004));
    g.add(box(1.83,.012,1.83,M.silicon,0,.073,0,.003));
    const l=layout();l.position.y=.093;g.add(l);g.scale.setScalar(scale);return g;
  }
  function wafer(radius=1.85) {
    const g=new T.Group();g.name='Schematic patterned wafer';
    g.add(cyl(radius,.065,M.silicon,0,0,0,80));
    const details=new T.Group();details.name='Wafer die grid';g.add(details);
    const pitch=.42,size=.365;
    for(let iz=-5;iz<=5;iz++)for(let ix=-5;ix<=5;ix++){
      const x=ix*pitch,z=iz*pitch;if(Math.hypot(Math.abs(x)+size/2,Math.abs(z)+size/2)>radius-.055)continue;
      details.add(box(size,.012,size,M.silicon,x,.039,z,.003));
      details.add(box(.025,.006,.23,M.copper,x-.10,.049,z,0));
      details.add(box(.235,.006,.025,M.copper,x,.049,z+.105,0));
    }
    batch(details);return g;
  }
  function fabModule() {
    // Open-front industrial cutaway. No logo, fab identity, recipe or historical architecture.
    const g=new T.Group();g.name='Illustrative manufacturing facility';
    g.add(box(3.12,.12,2.30,M.paper,0,.05,0,.025));
    g.add(box(3.10,1.34,.09,M.oxide,0,.76,-1.1,.012));
    for(const x of[-1.48,1.48]){
      g.add(box(.09,1.42,2.28,M.paper,x,.78,0,.012));
      g.add(box(.11,1.59,.11,M.steel,x,.84,1.05,.006));
    }
    g.add(box(3.16,.13,.70,M.ink,0,1.53,-.79,.014));
    const fixed=new T.Group();fixed.name='Facility installed equipment';g.add(fixed);
    for(let i=0;i<3;i++) {
      const x=(i-1)*.92;
      fixed.add(box(.78,.89,.87,M.paper,x,.60,-.42,.04));
      fixed.add(box(.57,.54,.035,M.ink,x,.65,.033,.01));
      fixed.add(box(.38,.04,.29,M.steel,x,.31,.22,.008));
      fixed.add(cyl(.20,.024,M.silicon,x,.348,.20,24));
      fixed.add(cyl(.065,.38,M.steel,x,1.28,-.75,16));
      fixed.add(box(.56,.055,.42,M.steel,x,1.66,-.80,.008));
      for(let j=0;j<4;j++)fixed.add(box(.49,.008,.018,M.dark,x,1.694,-.95+j*.09,0));
    }
    for(let i=-6;i<=6;i++)fixed.add(box(.008,.004,2.05,M.muted,i*.22,.116,.03,0));
    batch(fixed);return g;
  }
  function camera(a,b,target,fov=37,u=0,targetEnd=target,fovEnd=fov) {
    // Each take has its own location and lens; no repeated world-level ease.
    return {position:vec(a,b,clamp(u)),target:vec(target,targetEnd,clamp(u)),fov:lerp(fov,fovEnd,clamp(u))};
  }
  const worlds={};

  // DESIGN — start inside the material; widen when the organisation is spoken.
  {
    const root=new T.Group();root.name='Design and ownership';
    root.add(box(11.6,.16,6.2,M.dark,0,-.12,0,.045));
    const bench=new T.Group();bench.name='Customer original';root.add(bench);
    const board=chip(1.66);board.position.set(-.65,.13,0);bench.add(board);
    const holder=new T.Group();holder.name='Wafer inspection holder';bench.add(holder);
    for(const x of[-2.40,1.1]){
      holder.add(box(.15,.13,3.8,M.steel,x,.085,0,.015));
      for(const z of[-1.68,1.68])holder.add(cyl(.07,.035,M.dark,x,.17,z,20));
    }
    const waferEdge=wafer(1.8);waferEdge.position.set(-3.20,0,-2.3);root.add(waferEdge);
    const ruleBook=paper(['Process interface','Authored schematic'],2.1,1.5);
    ruleBook.position.set(2.55,.08,-.95);ruleBook.rotation.y=-.14;root.add(ruleBook);
    const ruleGlass=new T.Group();root.add(ruleGlass);
    ruleGlass.add(box(2.1,.04,1.50,M.glass,2.55,.22,-.95,.006));
    for(const z of[-1.61,-.29])ruleGlass.add(box(2.10,.05,.07,M.steel,2.55,.22,z,.006));
    const fitGauge=new T.Group();fitGauge.name='Two illustrative spacing features';bench.add(fitGauge);
    fitGauge.position.set(-.15,.33,-.15);
    fitGauge.add(box(.40,.06,.98,M.copper,-.22,0,0,.006));
    const movingFeature=box(.40,.06,.98,M.copper,.215,0,0,.006);fitGauge.add(movingFeature);
    const gapWarning=box(.035,.065,.72,M.red,-.0025,.004,0,.002);fitGauge.add(gapWarning);
    const processGauge=box(.48,.008,.035,M.paper,.045,.058,.64,.002);fitGauge.add(processGauge);
    const factory=fabModule();factory.position.set(2.10,.01,-.15);root.add(factory);
    const ownershipFrame=new T.Group();root.add(ownershipFrame);
    for(const z of[-1.65,1.6])ownershipFrame.add(box(7.3,.06,.04,M.copper,0,.02,z,.004));
    for(const x of[-3.65,3.65])ownershipFrame.add(box(.04,.06,3.25,M.copper,x,.02,-.02,.004));
    const customerTile=chip(.63);customerTile.position.set(-2.8,.24,0);root.add(customerTile);
    const supplyRail=new T.Group();root.add(supplyRail);supplyRail.add(box(3.4,.025,.14,M.steel,-.45,.075,.72,.007));
    const copy=chip(.19);root.add(copy);
    const smallDesk=box(1.7,.15,1.7,M.paper,-2.8,.09,0,.03);root.add(smallDesk);
    const vacantPlaces=new T.Group();vacantPlaces.name='Prospective customers, not yet present';root.add(vacantPlaces);
    for(const z of[.15,1.80]){
      vacantPlaces.add(box(1.38,.045,1.28,M.paper,-4.55,-.01,z,.01));
      vacantPlaces.add(box(1.23,.052,1.13,M.dark,-4.55,0,z,.008));
    }
    let last={};
    function update(u,phase='drawing') {
      u=clamp(u);const alt=['alternatives','separate','independent'].includes(phase);
      bench.visible=!alt;bench.position.set(0,0,0);board.visible=true;
      ruleBook.visible=ruleGlass.visible=!alt;waferEdge.visible=!alt;
      factory.visible=alt||phase==='drawing';customerTile.visible=supplyRail.visible=smallDesk.visible=copy.visible=alt;
      vacantPlaces.visible=phase==='drawing';
      ownershipFrame.visible=phase==='alternatives';ownershipFrame.scale.set(1,1,1);
      factory.position.set(2.10,.01,-.15);customerTile.position.set(-2.8,.24,0);smallDesk.position.set(-2.8,.09,0);
      if(phase==='drawing')factory.position.set(3.70,.01,-.7);
      fitGauge.visible=['violation','repair'].includes(phase);
      const gap=phase==='repair'?lerp(.035,.42,ramp(u,.16,.62)):phase==='violation'?.035:.42;
      movingFeature.position.x=.18+gap;gapWarning.visible=phase==='violation'||(phase==='repair'&&u<.46);
      gapWarning.scale.x=1;processGauge.scale.x=phase==='repair'?lerp(.08,1,ramp(u,.16,.62)):.08;
      ruleGlass.position.y=phase==='fit'?lerp(.25,0,ramp(u,.18,.65)):0;
      if(alt) {
        const separate=phase==='alternatives'?ramp(u,.40,.77):1;
        customerTile.position.x=lerp(-1.80,-2.8,separate);smallDesk.position.x=customerTile.position.x;
        factory.position.x=lerp(1.25,2.10,separate);
        ownershipFrame.scale.x=lerp(1,1.12,separate);ownershipFrame.visible=phase==='alternatives'&&u<.65;
        const move=phase==='independent'?ramp(u,.33,.85):ramp(u,.52,.9);
        copy.position.set(lerp(-2.8,.8,move),.30,.72);copy.visible=phase!=='separate'||u>.45;
      } else copy.position.set(-2.8,.30,.72);
      last={phase,u,violationPin:movingFeature.position.x,alternative:alt,spacingGap:gap,
        originalRemainsWithCustomer:true,designCopyX:copy.position.x,illustrative:true,functioningCircuit:false};
    }
    function cameraAt(u,phase,shotId='') {
      if(shotId==='design-close'||phase==='drawing'){
        if(u<.40)return camera([1.03,1.40,1.65],[.70,1.56,2.02],[-.60,.29,.16],43,u/.40,[-.70,.25,.03],42);
        return camera([.70,1.56,2.02],[5.5,5.3,8.6],[-.70,.25,.03],42,ramp(u,.40,.91),[-.35,.48,-.30],41);
      }
      if(shotId==='rules-close'||phase==='violation')return camera([.92,1.09,1.30],[.78,1.04,1.20],[-.15,.33,-.11],36,u);
      if(shotId==='rules-adjust'||phase==='repair')return camera([.78,1.04,1.20],[.64,1.01,1.22],[-.15,.33,-.11],36,u,[.02,.33,-.10]);
      if(shotId==='rules-documents')return camera([2.6,6.9,4.4],[1.85,6.55,4.25],[.2,.2,-.2],36,u);
      if(shotId==='boundary-silicon')return camera([.28,.78,2.55],[.15,1.02,2.32],[-.65,.28,.05],38,u);
      if(phase==='alternatives')return camera([6.0,3.1,6.9],[5.0,3.3,6.6],[0,.52,0],42,u,[-.15,.50,0]);
      if(phase==='separate')return camera([4.9,2.0,4.7],[4.5,2.2,4.35],[1.20,.65,-.08],39,u);
      if(phase==='independent')return camera([-4.8,2.3,5.4],[-3.9,2.15,5.1],[-.25,.47,.15],39,u);
      return camera([3.2,3.8,4.9],[2.7,3.5,4.5],[-.2,.2,0],38,u);
    }
    update(0,'drawing');worlds.design={root,update,state:()=>({...last}),cameraAt,
      camera:{from:[1.03,1.4,1.65],to:[.6,1.56,2.22],target:[-.6,.29,.16],fov:43},
      label:'Who can you trust with your design?',disclosure:'Illustrative design · not a functioning circuit',
      modelNotes:'The L is an authored interconnect motif. Spacing is qualitative, with no process node or rule value implied.',
      anchors:{original:[-.65,.3,0],gap:[-.15,.36,-.15],manufacturer:[2.1,.9,-.15]}};
  }

  // ARCHIVE — resources and commitments carry the assertion. Text is overlaid.
  {
    const root=new T.Group();root.name='Resources and commitments';root.add(box(9.2,.22,5.8,M.wood,0,-.14,0,.055));
    const seams=new T.Group();seams.name='Workbench joinery';root.add(seams);
    for(let i=0;i<7;i++)seams.add(box(9.1,.001,.006,M.muted,0,-.028,-2.55+i*.82,0));batch(seams);
    const papers={};for(const [phase,title]of Object.entries({'1985':'1985 / the proposal',capital:'1987 / investment',
      partners:'1987 / the partners',contracts:'Capability agreements',charter:'1994 / the charter',cirrus:'1993 / Cirrus Logic',visit:'Customer planning'})) {
      const p=paper([title,'Authored source summary'],2.0,1.35);p.position.set(-3.22,.05,-1.96);p.rotation.y=-.13;root.add(p);papers[phase]=p;
    }
    const binder=box(2.12,.10,1.45,M.ink,-3.22,-.005,-1.96,.02);binder.rotation.y=-.13;root.add(binder);
    const foundation=box(4.72,.15,2.50,M.dark,.38,.06,-.34,.025);root.add(foundation);
    const facility=fabModule();facility.position.set(.38,.17,-.38);facility.scale.setScalar(1.30);root.add(facility);
    const proposal=new T.Group();proposal.name='Unbuilt factory footprint';root.add(proposal);
    const plan=paper(['Manufacturing','A proposal, not an existing customer base'],4.65,2.55);plan.position.set(.38,.03,-.34);proposal.add(plan);
    for(const x of[-1.65,2.4])proposal.add(box(.055,.05,2.4,M.copper,x,.08,-.34,.005));
    for(const z of[-1.52,.84])proposal.add(box(4.1,.05,.055,M.copper,.38,.08,z,.005));
    const proposalTile=chip(.46);proposalTile.position.set(-2.90,.13,.35);root.add(proposalTile);
    const emptyShelf=box(1.65,.10,.80,M.paper,-2.95,.015,1.20,.015);root.add(emptyShelf);
    const funding=new T.Group();funding.name='Abstract pooled capital, not currency';root.add(funding);
    const capitalBlocks=[];for(let i=0;i<9;i++){
      const b=box(.56,.12,.92,[M.copper,M.silicon,M.paper][Math.floor(i/3)],0,0,0,.012);funding.add(b);capitalBlocks.push(b);
    }
    const shares=new T.Group();shares.name='48 percent, 27 percent, balance ownership';root.add(shares);
    const shareParts=[],fractions=[.48,.27,.25];let edge=-2.25;
    for(let i=0;i<3;i++){
      const w=fractions[i]*5.10,b=box(w,.22,1.12,[M.copper,M.silicon,M.paper][i],edge+w/2,.16,1.70,.014);
      shares.add(b);shareParts.push({b,x:edge+w/2,width:w});edge+=w+.025;
    }
    const capability=new T.Group();root.add(capability);
    const room=fabModule();room.scale.setScalar(.60);capability.add(room);
    const technology=new T.Group();capability.add(technology);
    technology.add(box(1.12,.07,1.08,M.ink,0,0,0,.012));technology.add(box(.96,.015,.93,M.glass,0,.052,0,.003));
    const techL=layout(.51);techL.position.y=.071;technology.add(techL);
    const manual=paper(['Process knowledge','Technology cooperation'],1.34,.97);technology.add(manual);manual.position.set(0,-.07,.10);
    const charter=new T.Group();root.add(charter);
    charter.add(box(.12,1.45,1.44,M.red,2.45,.79,.26,.012));charter.add(box(2.1,.025,.13,M.steel,2.16,.12,.26,.006));
    const ownTile=chip(.36);ownTile.position.set(3.65,.17,.26);charter.add(ownTile);
    const commitment=new T.Group();root.add(commitment);
    const leftContract=paper(['Customer commitment','Deposit and supply'],1.72,1.2);leftContract.position.set(-2.95,.06,.08);commitment.add(leftContract);
    const rightContract=paper(['Manufacturing commitment','Wafer products'],1.72,1.2);rightContract.position.set(3.08,.06,.08);commitment.add(rightContract);
    commitment.add(box(5.95,.026,.15,M.steel,0,.10,1.63,.008));
    const deposit=box(.58,.18,.54,M.copper,-2.95,.22,1.62,.016);commitment.add(deposit);
    const deliveredWafers=[];for(let i=0;i<3;i++){
      const w=wafer(.47);w.position.set(1.25,.17+i*.1,1.62);commitment.add(w);deliveredWafers.push(w);
    }
    const visit=new T.Group();root.add(visit);
    const nextDesign=chip(.58);visit.add(nextDesign);nextDesign.position.set(-2.10,.24,.80);
    const firstDesign=chip(.40);visit.add(firstDesign);firstDesign.position.set(-3.40,.17,.38);
    visit.add(box(2.30,.11,1.82,M.ink,2.35,.08,1.05,.035));
    const plannedWafers=[];for(let i=0;i<5;i++){const w=wafer(.65);visit.add(w);plannedWafers.push(w)}
    const schedule=new T.Group();schedule.name='Illustrative future production slots';visit.add(schedule);
    for(let i=0;i<5;i++)schedule.add(box(.48,.045,.48,M.paper,-1.1+i*.56,.07,2.15,.01));
    const booking=box(.40,.075,.40,M.copper,-1.1,.11,2.15,.01);visit.add(booking);
    let last={};
    function update(u,phase='1985') {
      u=clamp(u);for(const[k,p]of Object.entries(papers))p.visible=k===phase;
      proposal.visible=proposalTile.visible=emptyShelf.visible=phase==='1985';
      foundation.visible=phase!=='1985';facility.visible=phase!=='1985'&&phase!=='contracts';
      facility.position.set(.38,.17,-.38);facility.scale.setScalar(1.30);
      funding.visible=phase==='capital';shares.visible=phase==='partners';capability.visible=phase==='contracts';
      charter.visible=phase==='charter';commitment.visible=phase==='cirrus';visit.visible=phase==='visit';
      proposalTile.position.x=lerp(-3.28,-2.90,ramp(u,.26,.68));
      capitalBlocks.forEach((b,i)=>{
        const start=[-3.4,0,3.45][Math.floor(i/3)],p=ramp(u,.08+i*.046,.43+i*.046);
        b.position.set(lerp(start,-1.72+i*.49,p),lerp(.08+(i%3)*.15,.18,p),lerp(1.72,1.48,p));
        b.rotation.set(0,lerp((Math.floor(i/3)-1)*.08,0,p),0);
      });
      if(phase==='capital')facility.position.y=.17+1.6*(1-ramp(u,.45,.90));
      shareParts.forEach(({b,x},i)=>{const p=ramp(u,.05+i*.16,.36+i*.16);b.position.set(x,.16,lerp(2.65,1.70,p))});
      room.position.set(lerp(-3.1,-.55,ramp(u,.08,.55)),.17,-.27);
      technology.position.set(lerp(3.45,1.45,ramp(u,.35,.78)),.22,.42);
      charter.position.set(0,0,0);charter.children[0].position.y=lerp(2.05,.79,ramp(u,.17,.60));
      deposit.position.x=lerp(-2.95,.2,ramp(u,.12,.42));
      deliveredWafers.forEach((w,i)=>w.position.set(lerp(.65,2.85,ramp(u,.46+i*.09,.72+i*.09)),.17+i*.10,1.62));
      nextDesign.scale.setScalar(lerp(.58,.75,ramp(u,.1,.46)));
      plannedWafers.forEach((w,i)=>{const p=ramp(u,.26+i*.10,.46+i*.10);w.visible=phase==='visit'&&u>=.24+i*.10;w.position.set(lerp(.25,2.35,p),.19+i*.09,1.05)});
      booking.position.x=lerp(-1.1,1.14,ramp(u,.45,.91));
      last={record:phase,u,pooledCapital:phase==='capital'?capitalBlocks.map(b=>b.position.x):[],ownershipShares:[.48,.27,.25],
        depositX:deposit.position.x,planningWaferCount:plannedWafers.filter(w=>w.visible).length,facilitiesAndTechnology:phase==='contracts',
        abstractUnitsNotMoney:true,waferCountIllustrative:true,historicalReconstruction:false};
    }
    function cameraAt(u,phase) {
      if(phase==='1985')return camera([4.8,2.6,5.3],[3.8,2.9,4.9],[.15,.12,-.15],39,u);
      if(phase==='capital')return camera([4.2,2.5,6.1],[3.15,3.2,5.9],[.20,.55,.55],40,u);
      if(phase==='partners')return camera([.2,8.8,4.0],[.05,8.60,3.85],[.2,.55,.20],40,u);
      if(phase==='contracts')return camera([-3.9,2.0,5.3],[-3.05,2.4,5.65],[0,.5,.1],40,u,[.3,.52,.10]);
      if(phase==='charter')return camera([5.9,2.3,4.3],[5.25,2.4,4.15],[1.55,.68,.12],38,u);
      if(phase==='cirrus')return camera([.35,3.2,7.2],[-.35,3.0,6.8],[0,.50,.8],42,u);
      if(phase==='visit')return camera([-5.45,3.9,5.7],[-3.4,4.3,6.0],[0,.50,.75],41,u,[.85,.50,.80]);
      return camera([4.2,5.2,6.7],[3.5,5.0,6.5],[0,.25,0],39,u);
    }
    update(0,'1985');worlds.archive={root,update,state:()=>({...last}),cameraAt,
      camera:{from:[4.8,2.6,5.3],to:[3.8,2.9,4.9],target:[.15,.12,-.15],fov:39},
      label:'The resources behind a manufacturing promise',disclosure:'Evidence-led illustration · not archival footage',
      modelNotes:'Capital units, equipment, transfers, documents and wafer-planning slots are authored visual relationships, not depictions of an actual meeting, factory, payment, order quantity or allocation.',
      anchors:{capital:[.2,.25,1.5],government:[-1.02,.3,1.7],philips:[.92,.3,1.7],others:[2.28,.3,1.7],
        facility:[.38,1.1,-.38],technology:[1.45,.3,.42],customer:[-2.95,.12,.08],production:[2.35,.5,1.05]}};
  }

  // BOUNDARY — original left; a copy enters; output returns. Other risks remain.
  {
    const root=new T.Group();root.name='Manufacturing without a competing product';root.add(box(10.1,.13,5.3,M.paper,0,-.11,0,.045));
    const customer=new T.Group();root.add(customer);customer.position.set(-3.45,0,.16);
    customer.add(box(2.12,.19,2.3,M.ink,0,.04,0,.035));const original=chip(.83);original.position.y=.24;customer.add(original);
    const factory=fabModule();factory.position.set(.1,0,-.40);root.add(factory);
    const own=chip(.53);own.position.set(3.60,.20,-1.00);root.add(own);
    const ownBase=box(1.45,.13,1.5,M.muted,3.60,.02,-1,.025);root.add(ownBase);
    const route=new T.Group();route.name='Customer and product routes';root.add(route);
    route.add(box(2.65,.025,.20,M.copper,-1.5,.07,.48,.01));route.add(box(4.18,.025,.23,M.teal,-1.45,.07,1.55,.01));
    route.add(box(.18,.025,1.1,M.teal,.63,.07,1.03,.01));route.add(box(3.0,.025,.18,M.steel,2.05,.07,-1.68,.01));
    route.add(box(.18,.025,.8,M.steel,3.6,.07,-1.30,.01));
    const gate=new T.Group();gate.name='Only the own-product branch is blocked';gate.position.set(2.35,.08,-1.68);root.add(gate);
    for(const z of[-.38,.38])gate.add(box(.10,1.48,.11,M.ink,0,.74,z,.007));
    const stop=box(.12,1.16,.69,M.red,0,.69,0,.015);gate.add(stop);
    const work=chip(.22);root.add(work);const returned=chip(.27);root.add(returned);
    const extraOutputs=[];for(let i=0;i<2;i++){const c=chip(.25);root.add(c);extraOutputs.push(c)}
    const outputStop=new T.Group();root.add(outputStop);outputStop.position.set(-1.62,.11,1.55);
    for(const z of[-.28,.28])outputStop.add(box(.08,.44,.08,M.ink,0,.22,z,.005));
    outputStop.add(box(.08,.12,.64,M.copper,0,.45,0,.005));
    root.add(box(.025,.014,4.6,M.ink,-1.98,-.025,.05,0));
    let last={};
    function update(u,phase='open') {
      u=clamp(u);const closing=phase==='close'?ramp(u,.12,.56):1;
      stop.scale.y=1;stop.position.y=.59+1.34*(1-closing);gate.visible=true;
      work.visible=['open','close'].includes(phase);work.position.set(lerp(-2.58,-.55,ramp(u,.08,.72)),.23,.48);
      returned.visible=['return','risk'].includes(phase);const travel=phase==='risk'?ramp(u,.02,.33):ramp(u,.12,.80);
      returned.position.set(lerp(phase==='risk'?-.58:.63,phase==='risk'?-1.1:-3.33,travel),.23,1.55);
      extraOutputs.forEach((c,i)=>{c.visible=phase==='risk';c.position.set(.02+i*.58,.23,1.55)});
      outputStop.visible=phase==='risk';own.visible=ownBase.visible=true;
      last={phase,u,gate:closing,gatePanelBottom:stop.position.y-.58,customerProductX:returned.position.x,
        customerOriginalX:-3.45,designCopyX:work.position.x,capacityBlocked:phase==='risk',
        competitionBranchClosed:closing>=.999,illustrative:true,contractDiagram:false};
    }
    function cameraAt(u,phase,shotId='') {
      if(shotId==='title-boundary'||phase==='open')return camera([6.8,3.8,8.0],[6.25,4.2,7.8],[-.15,.48,.1],42,u);
      if(phase==='close')return camera([4.45,1.75,1.9],[4.15,1.85,2.22],[2.1,.72,-1.39],40,u,[1.95,.65,-1.35]);
      if(phase==='return')return camera([.8,1.38,5.3],[-1.15,1.55,5.5],[-1.55,.35,.9],42,u,[-2.1,.4,.7]);
      if(phase==='risk')return camera([5.3,5.1,7.5],[4.65,5.25,7.2],[-.2,.4,.15],42,u);
      return camera([6.8,3.8,8.0],[6.25,4.2,7.8],[-.15,.48,.1],42,u);
    }
    update(0,'open');worlds.boundary={root,update,state:()=>({...last}),cameraAt,
      camera:{from:[6.8,3.8,8],to:[6.25,4.2,7.8],target:[-.15,.48,.1],fov:42},
      label:'One conflict is bounded. Other obligations remain.',disclosure:'Illustrative relationship · not an allocation or contract diagram',
      modelNotes:'A factory copy moves, while the customer original stays. The own-product route is closed independently of the illustrative finite-capacity queue.',
      anchors:{customer:[-3.45,.4,.16],factory:[.1,1,-.4],competitionGate:[2.35,.72,-1.68],capacity:[-1.62,.5,1.55]}};
  }

  // RETURN — a diagnostic window keeps the L visible through the final package.
  {
    const root=new T.Group();root.name='Same design, manufactured device';root.add(box(8.8,.15,7.5,M.dark,0,-.10,-.9,.045));
    const drawing=new T.Group();root.add(drawing);drawing.add(box(2.45,.035,2.50,M.paper,-2.50,.04,.05,.008));
    const drawingMotif=layout(.98);drawingMotif.position.set(-2.5,.08,.05);drawing.add(drawingMotif);
    const fineRule=new T.Group();fineRule.name='Design datum';drawing.add(fineRule);
    for(const x of[-3.55,-1.44])for(const z of[-1.05,1.15]){
      fineRule.add(box(.18,.005,.012,M.muted,x,.063,z,0));fineRule.add(box(.012,.005,.18,M.muted,x,.063,z,0));
    }
    const productBoard=new T.Group();productBoard.name='Illustrative customer product assembly';root.add(productBoard);
    productBoard.add(box(4.35,.15,3.7,M.teal,1.14,.055,0,.03));
    const details=new T.Group();details.name='Product board connectors and traces';productBoard.add(details);
    for(let i=0;i<8;i++){
      details.add(box(.042,.012,.54,M.copper,2.18+i*.15,.14,1.52,0));
      details.add(box(.13,.11,.32,M.ink,2.54,.19,-1.28+i*.14,.008));
    }
    details.add(box(.39,.29,1.13,M.steel,3.12,.24,-.55,.025));details.add(box(.05,.17,.91,M.dark,3.335,.25,-.55,.007));
    for(let i=0;i<4;i++){
      details.add(box(.18,.16,.33,M.paper,-.64,.22,-1.13+i*.35,.012));
      details.add(box(.025,.006,.76,M.copper,.05+i*.18,.139,1.23,0));
    }batch(details);
    const packageGroup=new T.Group();packageGroup.position.set(1.05,.37,0);root.add(packageGroup);
    packageGroup.add(box(2.64,.15,2.64,M.ink,0,0,0,.035));packageGroup.add(box(2.48,.045,2.48,M.paper,0,.10,0,.012));
    const die=chip(.85);die.position.y=.24;packageGroup.add(die);
    const lid=new T.Group();lid.name='Illustrative package cutaway window';packageGroup.add(lid);
    for(const z of[-1.31,1.31])lid.add(box(2.72,.53,.10,M.steel,0,.285,z,.012));
    for(const x of[-1.31,1.31])lid.add(box(.10,.53,2.52,M.steel,x,.285,0,.012));
    for(const z of[-1.18,1.18])lid.add(box(2.72,.10,.32,M.steel,0,.59,z,.012));
    for(const x of[-1.18,1.18])lid.add(box(.32,.10,2.08,M.steel,x,.59,0,.012));
    const lidWindow=box(2.08,.025,2.08,M.glass,0,.604,0,.003);lid.add(lidWindow);
    const bonds=new T.Group();bonds.name='Visible package wire bonds';packageGroup.add(bonds);
    for(let i=-3;i<=3;i++)for(const s of[-1,1]){
      const x=i*.20;bonds.add(line([[x,.32,s*.80],[x,.48,s*1.02],[x,.14,s*1.18]],C.copper,.010));
    }
    const balls=new T.InstancedMesh(new T.SphereGeometry(.058,8,6),M.steel,81);balls.frustumCulled=false;
    const mx=new T.Matrix4();let n=0;for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){
      mx.makeTranslation(x*.25,-.13,z*.25);balls.setMatrixAt(n++,mx);
    }packageGroup.add(balls);
    const sourceEdge=box(.020,.012,3.50,M.copper,-.91,.01,0,0);root.add(sourceEdge);
    const nextResponsibility=new T.Group();nextResponsibility.name='Customer next design, manufacturer next work';root.add(nextResponsibility);
    const futureFactory=fabModule();futureFactory.position.set(.05,.02,-2.98);futureFactory.scale.setScalar(.72);nextResponsibility.add(futureFactory);
    nextResponsibility.add(box(2.10,.022,.12,M.copper,-1.35,.03,-1.80,.004));
    const nextCopy=chip(.18);nextResponsibility.add(nextCopy);
    let last={};
    function update(u,phase='die') {
      u=clamp(u);drawing.visible=phase!=='die';sourceEdge.visible=phase!=='die';
      productBoard.visible=['together','final'].includes(phase);productBoard.position.y=phase==='together'?lerp(-.30,0,ramp(u,.02,.36)):0;
      nextResponsibility.visible=['together','final'].includes(phase);
      nextCopy.position.set(lerp(-2.50,-.30,phase==='final'?ramp(u,.30,.86):0),.16,-1.80);
      packageGroup.position.set(phase==='die'?.12:1.05,.37,0);packageGroup.rotation.set(0,phase==='die'?lerp(-.10,.02,ease(u)):0,0);
      lid.visible=phase!=='die';lid.position.set(0,phase==='package'?lerp(1.34,.10,ramp(u,.14,.68)):.10,0);
      lid.children[0].visible=true;lid.children[1].visible=phase!=='package';
      lidWindow.visible=phase==='package';
      last={phase,u,lid:lid.position.y,phaseVisible:lid.visible,recurringLayoutVisible:true,opaqueLid:false,
        lidWindowOpacity:lidWindow.visible?lidWindow.material.opacity:0,customerProductAssembly:productBoard.visible,illustrativePackage:true,realSku:false};
    }
    function cameraAt(u,phase) {
      if(phase==='die')return camera([1.58,1.72,2.30],[1.38,1.84,2.18],[.13,.63,0],38,u);
      if(phase==='package')return camera([3.55,2.1,3.58],[3.2,2.50,3.36],[1.05,.83,.03],38,u);
      if(phase==='together')return camera([3.1,5.6,6.5],[2.65,5.9,6.45],[.1,.34,.05],39,u,[-.15,.30,-.45]);
      if(phase==='final')return camera([2.65,5.9,6.45],[2.0,6.65,7.3],[-.15,.30,-.45],39,u,[-.25,.28,-.55],40);
      return camera([3.1,5.6,6.5],[2.65,5.9,6.45],[.1,.34,.05],39,u);
    }
    update(0,'die');worlds.return={root,update,state:()=>({...last}),cameraAt,
      camera:{from:[1.58,1.72,2.3],to:[1.38,1.84,2.18],target:[.13,.63,0],fov:38},
      label:'The same design. A different way to make it.',disclosure:'Illustrative die, cutaway package and customer product assembly',
      modelNotes:'The clear window is an explanatory cutaway, not a commercial package. No TSMC end product, specific customer board, process dimensions or functioning circuit is represented.',
      anchors:{original:[-2.50,.09,.05],die:[1.05,.70,0],package:[1.05,1.12,0],product:[3.12,.27,-.55]}};
  }
  return worlds;
}
