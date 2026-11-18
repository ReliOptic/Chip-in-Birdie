/**
 * S1E01 R5 — authored mechanical illustrations of shared facilities and yield.
 * No previous episode meshes, L-layout, wafer/probe or chamber loop are reused.
 * The host owns the renderer, lights, narration, large labels and master clock.
 * All animation is evaluated from (u, phase); geometry is built only once.
 *
 * Direction: tactile booking office / qualification bench; ivory paper, olive
 * enamel, copper fasteners and graphite. Motion changes an economic state; no
 * orbit, glow, decorative particles or shader-only information is required.
 * Analytic part positioning is informed by aimotion 148, not its demo design.
 */
export function createEconomics(T) {
  const C={paper:0xeee7d8,edge:0xd0c6b4,olive:0x505943,copper:0x995f43,
    graphite:0x292d2a,steel:0x92968b,stone:0xaaa79a,reject:0x815241};
  const mat=(color,metalness=0,roughness=.62)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const M={paper:mat(C.paper,.02,.74),edge:mat(C.edge,.04,.75),olive:mat(C.olive,.16,.49),
    copper:mat(C.copper,.75,.35),graphite:mat(C.graphite,.34,.48),steel:mat(C.steel,.72,.36),
    stone:mat(C.stone,.08,.66),reject:mat(C.reject,.18,.6)};
  const customerMaterials=[M.olive,M.copper,M.graphite,M.stone];
  const boxG=new T.BoxGeometry(1,1,1),cylinderG=new T.CylinderGeometry(1,1,1,24);
  const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const ramp=(u,a,b)=>ease((u-a)/(b-a));
  const lerp=(a,b,u)=>a+(b-a)*u;
  function mesh(g,m,p,s,parent,name=''){
    const o=new T.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.name=name;
    o.castShadow=o.receiveShadow=true;parent.add(o);return o;
  }
  const box=(parent,p,s,m=M.paper,name='')=>mesh(boxG,m,p,s,parent,name);
  const cyl=(parent,p,s,m=M.steel,name='')=>mesh(cylinderG,m,p,s,parent,name);
  function batch(group){
    group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),sets=new Map();
    group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
      const k=o.geometry.uuid+o.material.uuid;if(!sets.has(k))sets.set(k,[]);sets.get(k).push(o)});
    for(const members of sets.values())if(members.length>=3){
      const o=new T.InstancedMesh(members[0].geometry,members[0].material,members.length);
      o.name='Fixed '+group.name;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;
      members.forEach((m,i)=>{o.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));m.removeFromParent()});
      group.add(o);
    }
  }
  function slabGeometry(points,depth){
    const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    return new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1,curveSegments:1});
  }
  function trajectory(g,a,b,p,depth=.48){
    g.position.set(lerp(a[0],b[0],p),lerp(a[1],b[1],p),lerp(a[2],b[2],p)+depth*Math.sin(Math.PI*p));
    g.rotation.set(0,0,0);
  }

  function bookingsWorld(){
    const root=new T.Group();root.name='Mechanical customer booking board — illustrative';
    const fixed=new T.Group();fixed.name='Fixed capacity spine and booking board';root.add(fixed);
    box(fixed,[0,.08,.1],[7.35,.16,1.55],M.graphite,'Cast booking-board foot');
    box(fixed,[0,1.35,-.13],[6.90,2.36,.16],M.paper,'Ivory booking board');
    for(const x of [-3.38,3.38]){
      box(fixed,[x,1.32,-.04],[.13,2.55,.30],M.olive,'Frame upright');
      const brace=box(fixed,[x,.55,-.33],[.11,1.1,.12],M.steel,'Back brace');brace.rotation.x=-.35;
    }
    box(fixed,[0,2.55,-.02],[6.88,.13,.27],M.olive,'Top frame');
    // One uninterrupted, bolted metal spine: adding customers never adds this
    // expensive physical resource. The eight bays are illustrative, not dates.
    box(fixed,[0,.59,.04],[6.28,.66,.24],M.olive,'SAME fixed factory-capacity spine');
    const xs=Array.from({length:8},(_,i)=>-2.66+i*.76),laneX=[-2.7,-.9,.9,2.7];
    const targets=xs.map(x=>[x,.63,.245]);
    const sources=Array.from({length:8},(_,i)=>[laneX[Math.floor(i/2)],i%2?1.57:2.04,.13]);
    for(let i=0;i<8;i++){
      const x=xs[i];
      box(fixed,[x,.62,.18],[.60,.47,.06],M.graphite,'Empty booking recess '+i);
      for(const dx of [-.305,.305])box(fixed,[x+dx,.61,.26],[.035,.51,.16],M.steel,'Retaining clip');
      box(fixed,[x,.355,.27],[.64,.035,.16],M.steel,'Booking ledge');
      for(const dx of [-.25,.25]){const screw=cyl(fixed,[x+dx,.925,.17],[.026,.018,.026],M.copper);screw.rotation.x=Math.PI/2;}
    }
    for(let i=0;i<4;i++){
      for(const dx of [-.37,.37])box(fixed,[laneX[i]+dx,1.82,.06],[.035,.98,.10],M.steel,'Separate customer lane');
      box(fixed,[laneX[i],1.29,.12],[.78,.035,.19],M.graphite,'Customer lane shelf');
      box(fixed,[laneX[i],2.38,.14],[.50,.075,.05],customerMaterials[i],'Customer identity strip');
    }
    // A recognisable bound equipment bill remains on its stand in every phase.
    const bill=new T.Group();bill.name='Unchanged equipment bill';root.add(bill);bill.position.set(0,.17,1.02);
    box(bill,[0,.065,0],[1.74,.13,.63],M.edge,'Fixed bill paper block');
    for(let i=0;i<5;i++)box(bill,[0,.020+i*.021,.322],[1.68,.004,.006],M.paper,'Paper edges');
    box(bill,[-.57,.15,0],[.14,.035,.68],M.copper,'Copper bill binding');
    for(const z of [-.12,.04,.18])box(bill,[.28,.139,z],[.70,.005,.018],M.graphite,'Printed invoice rule');
    const outbox=new T.Group();outbox.name='Diverted or withdrawn bookings';root.add(outbox);outbox.position.set(3.62,.18,.45);
    box(outbox,[0,0,0],[.68,.10,.76],M.graphite,'Return pocket');
    for(const x of [-.33,.33])box(outbox,[x,.15,0],[.035,.30,.76],M.olive);
    box(outbox,[0,.15,-.37],[.68,.30,.035],M.olive);
    const cardG=slabGeometry([[-.26,-.19],[.18,-.19],[.26,-.11],[.26,.19],[-.26,.19]],.045);
    function card(m,customer,name){
      const g=new T.Group();g.name=name;root.add(g);
      mesh(cardG,m,[0,0,0],[1,1,1],g,'Removable reservation ticket');
      box(g,[0,-.12,.052],[.32,.025,.012],M.paper,'Booking rule');
      box(g,[0,-.065,.052],[.32,.013,.012],M.paper);
      for(const x of [-.15,.15])box(g,[x,-.218,.015],[.065,.06,.03],M.steel,'Compatible process key');
      if(customer===0){const d=cyl(g,[0,.075,.067],[.065,.025,.065],M.paper,'Circle customer mark');d.rotation.x=Math.PI/2;}
      else if(customer===1){const d=box(g,[0,.075,.067],[.10,.10,.02],M.paper,'Diamond customer mark');d.rotation.z=Math.PI/4;}
      else if(customer===2)for(const x of [-.055,.055])box(g,[x,.075,.067],[.033,.12,.02],M.paper,'Twin customer mark');
      else for(const y of [.045,.10])box(g,[0,y,.067],[.14,.024,.02],M.paper,'Parallel customer mark');
      batch(g);return g;
    }
    const cards=Array.from({length:8},(_,i)=>card(customerMaterials[Math.floor(i/2)],Math.floor(i/2),'Customer '+Math.floor(i/2)+' booking '+i));
    const overflow=[0,1].map(i=>card(M.graphite,3,'IDM spare-capacity order '+i));
    const incompatible=card(M.reject,1,'Incompatible process order');
    box(incompatible,[0,-.25,.015],[.10,.12,.065],M.copper,'Nonmatching third process key');
    const interlock=new T.Group();interlock.name='Compatibility stop — empty capacity is not sufficient';root.add(interlock);interlock.position.set(2.66,1.02,.27);
    // The two gaps accept the two normal key tabs. An extra centre key has no
    // matching opening: spare slots do not make a process interchangeable.
    for(const [x,width]of [[-.2575,.125],[0,.21],[.2575,.125]])box(interlock,[x,0,0],[width,.07,.18],M.copper,'Process-key comb tooth');
    box(interlock,[0,-.065,0],[.64,.06,.18],M.olive,'Process-key comb backing');
    // Eight identical slips allocate ONE unchanged overhead index. Their total
    // volume remains constant; this is not a measured monetary price chart.
    const allocations=Array.from({length:8},(_,i)=>{
      const g=new T.Group();g.name='Share of same fixed overhead '+i;root.add(g);
      box(g,[0,0,0],[.44,.085,.23],M.paper,'Cost allocation slip');
      box(g,[-.14,0,0],[.07,.096,.25],M.copper,'Allocation binding');return g;
    });
    batch(fixed);batch(bill);batch(outbox);
    let current={};
    function update(u,phase='alone'){
      u=clamp(u);const seated=new Set(),arriving=new Set(),withdrawn=new Set();
      cards.forEach((g,i)=>{g.visible=false;g.position.set(...sources[i]);g.rotation.set(0,0,0)});
      overflow.forEach((g,i)=>{g.visible=false;g.position.set(...targets[i]);g.rotation.set(0,0,0)});
      incompatible.visible=false;incompatible.position.set(...sources[6]);incompatible.rotation.set(0,0,0);
      interlock.visible=phase==='incompatible';
      allocations.forEach(g=>{g.visible=false;g.position.set(0,0,0);g.rotation.set(0,0,0)});
      const place=(i,p=1)=>{cards[i].visible=true;trajectory(cards[i],sources[i],targets[i],p);if(p>=1)seated.add(i);else arriving.add(i);};
      if(phase==='alone')for(const i of [0,1])place(i);
      else if(phase==='shared'){
        for(let i=0;i<8;i++)place(i,i<2?1:ramp(u,.06+(i-2)*.075,.24+(i-2)*.075));
      }else if(phase==='spread'){
        // Continue from the full shared board. Do not replay the preceding
        // customer-arrival scene merely to illustrate fixed-cost allocation.
        for(let i=0;i<8;i++)place(i);
      }else if(phase==='incompatible'){
        for(let i=0;i<6;i++)place(i);
        incompatible.visible=true;
        const stop=[2.66,1.31,.31],p=ramp(u,.04,.38),divert=ramp(u,.51,.86);
        trajectory(incompatible,sources[6],stop,p,.28);
        if(u>.51)trajectory(incompatible,stop,[3.62,.43,.45],divert,.22);
      }else if(phase==='slump'){
        const p=ramp(u,.16,.78);
        for(let i=0;i<8;i++){
          if(i%2===0)place(i);
          else{cards[i].visible=true;trajectory(cards[i],targets[i],[3.62,.36+(i>>1)*.07,.45],p,.55);
            if(p===0)seated.add(i);else withdrawn.add(i);}
        }
      }else if(phase==='overflow'){
        const p=ramp(u,.12,.82);
        overflow.forEach((g,i)=>{g.visible=true;trajectory(g,targets[i],[3.62,.38+i*.08,.45],p,.55);
          if(p===0)seated.add(i);else withdrawn.add(i)});
      }else if(phase==='growth'){
        for(let i=0;i<8;i++){
          const rank=(i%2)*4+Math.floor(i/2),start=.025+rank*.085;
          if(u>=start)place(i,ramp(u,start,start+.22));
        }
      }else throw new Error('Unknown bookings phase: '+phase);
      if(phase==='spread'){
        const spread=ramp(u,.12,.82);
        allocations.forEach((g,i)=>{
          g.visible=true;const owner=i<4?0:1,level=i%4;
          const from=[xs[owner],1.09+level*.105,.34],to=[xs[i],1.09,.34];
          trajectory(g,from,to,spread,.21);
        });
      }
      const occupied=seated.size;
      current={phase,u,illustrative:true,historicalQuantities:false,fixedCapacitySlots:8,
        occupiedSlots:occupied,emptySlots:8-occupied,arrivingBookings:arriving.size,
        distinctSeatedCustomers:phase==='overflow'?(occupied?1:0):new Set([...seated].map(i=>Math.floor(i/2))).size,
        sharedPhysicalSpines:1,fixedOverheadIndex:1,measuredPrices:false,
        allocatedOverheadSlips:phase==='spread'?8:0,totalAllocationIndex:phase==='spread'?1:null,
        incompatibleOrderAdmitted:false,incompatibleOrderDiverted:phase==='incompatible'&&u>=.86,
        withdrawnBookings:withdrawn.size,correlatedDemandDecline:phase==='slump',
        customerSource:phase==='overflow'?'IDM overflow work':phase==='growth'?'Recurring independent design-company orders':'Illustrative compatible customers'};
    }
    function cameraAt(u,phase){
      u=clamp(u);
      if(phase==='incompatible')return {position:[4.65,2.75,5.8],target:[2.16,1.10,.22],fov:35};
      if(phase==='spread')return {position:[2.65,2.05,8.0],target:[0,.91,.30],fov:37};
      // Identical frame exposes the contrast between uncertain overflow orders
      // and recurring independent customers; no ambient camera orbit is used.
      return {position:[3.35,3.10,9.6],target:[.16,1.25,.18],fov:35};
    }
    update(0,'alone');
    return {root,label:'Several customers. The same factory.',disclosure:'Illustrative bookings and cost allocation · not historical quantities or measured prices',
      update,cameraAt,state:()=>({...current}),modelNotes:'A mechanical analogy for compatible bookings and fixed costs, not a factory scheduler or measured capacity model. The allocation slips represent the same unchanged overhead bill.',
      anchors:{capacity:[0,.63,.24],bill:[0,.32,1.02],compatibility:[2.66,1.1,.3],returned:[3.62,.4,.45]}};
  }

  function yieldWorld(){
    const root=new T.Group();root.name='Two independent hypothetical qualification runs';
    const fixed=new T.Group();fixed.name='Cutaway inspection bench';root.add(fixed);
    box(fixed,[0,.17,.25],[7.25,.22,5.05],M.olive,'Inspection-bench cast base');
    for(const x of [-3.3,3.3]){
      box(fixed,[x,1.35,-1.52],[.18,2.18,.22],M.graphite,'Inspection support');
      box(fixed,[x,.38,-1.52],[.48,.18,.58],M.steel,'Support foot');
    }
    box(fixed,[0,2.40,-1.52],[6.82,.18,.28],M.paper,'Inspection cross-slide');
    box(fixed,[0,2.23,-1.31],[6.62,.045,.07],M.steel,'Linear guide');
    // An open service side exposes the fixture, rail and small controller board;
    // it is not a replica of a fab tool or an electrical/optical simulation.
    box(fixed,[-3.00,.48,.40],[.25,.42,2.45],M.graphite,'Cutaway service enclosure');
    for(let i=0;i<5;i++)box(fixed,[-3.00,.70,-.5+i*.38],[.18,.04,.20],M.copper,'Fixture service connection');
    const head=new T.Group();head.name='Illustrative qualification fixture';root.add(head);
    box(head,[0,2.23,-1.27],[.42,.31,.35],M.graphite,'Slide carriage');
    box(head,[0,1.75,-.98],[.11,.85,.13],M.steel,'Fixture support');
    box(head,[0,1.55,.13],[.12,.12,2.62],M.steel,'Fore-aft fixture rail');
    const fixture=new T.Group();fixture.name='Authored die-location fixture';head.add(fixture);
    box(fixture,[0,1.34,0],[.54,.24,.43],M.paper,'Cutaway inspection head');
    box(fixture,[.18,1.34,.22],[.12,.13,.025],M.olive,'Exposed fixture insert');
    box(fixture,[-.09,1.34,.23],[.25,.035,.025],M.copper,'Fixture connection');
    const dieShape=[[-.087,-.087],[.059,-.087],[.087,-.059],[.087,.087],[-.087,.087]];
    const dieG=slabGeometry(dieShape,.041);dieG.rotateX(-Math.PI/2);
    const dieMat=mat(0xffffff,.36,.41),dummy=new T.Object3D();
    const baseColor=new T.Color(C.graphite),acceptedColor=new T.Color(C.olive),rejectColor=new T.Color(C.reject);
    const runs=[];
    function makeRun(id,accepted,processingCostIndex){
      const supplier=id===1?'A':'B';
      const g=new T.Group();g.name='Independent run / Supplier '+supplier+' — 100 candidates';root.add(g);
      const frame=new T.Group();frame.name='Die tray '+id;g.add(frame);
      box(frame,[0,.43,0],[2.56,.17,2.56],M.steel,'Die tray aluminium frame');
      box(frame,[0,.53,0],[2.36,.055,2.36],M.graphite,'Candidate tray dark recess');
      for(let i=0;i<=10;i++){
        const p=-1.10+i*.22;
        box(frame,[p,.58,0],[.022,.08,2.23],M.paper,'Recessed die-well divider');
        box(frame,[0,.58,p],[2.23,.08,.022],M.paper,'Recessed die-well divider');
      }
      for(const x of [-1.27,1.27])box(frame,[x,.53,.05],[.07,.22,2.65],M.olive,'Tray sidewall');
      box(frame,[0,.43,1.88],[2.56,.13,1.05],M.graphite,'Rejection drawer, same run');
      for(const x of [-1.27,1.27])box(frame,[x,.50,1.88],[.055,.14,1.05],M.olive,'Drawer wall');
      box(frame,[0,.50,2.40],[2.56,.14,.055],M.olive,'Drawer front');
      box(frame,[0,.43,2.47],[.65,.12,.13],M.steel,'Drawer handle');
      // Large geometric I / II identity, not text that must be decoded to follow
      // the comparison. RUN / SUPPLIER A and B labels are supplied by the host.
      for(let i=0;i<id;i++)box(frame,[-.09+(i-(id-1)/2)*.16,.66,-1.23],[.06,.025,.15],M.copper,'Independent run identity');
      const dies=new T.InstancedMesh(dieG,dieMat,100);dies.name='Run '+id+' exactly 100 candidate dies';
      const pads=new T.InstancedMesh(boxG,M.copper,400);pads.name='Run '+id+' die contact islands';
      const rejectMarks=new T.InstancedMesh(boxG,M.paper,(100-accepted)*2);rejectMarks.name='Run '+id+' rejected-die crosses';
      for(const o of [dies,pads,rejectMarks]){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;g.add(o);}
      const failIds=Array.from({length:100},(_,i)=>i).filter(i=>(i*37)%100>=accepted);
      const failurePosition=new Map(failIds.map((v,i)=>[v,i]));
      const cost=new T.Group();cost.name='Hypothetical processing quote — '+supplier;g.add(cost);cost.position.set(.72,0,-1.81);
      box(cost,[0,.46,0],[.92,.20,.62],M.graphite,'Cost-standard pedestal');
      // Each equal copper plate represents ten hypothetical quote-index units:
      // A has ten plates (100); B has twelve (120), not a cheaper input bill.
      for(let i=0;i<processingCostIndex/10;i++)box(cost,[0,.60+i*.036,0],[.76,.025,.48],M.copper,'Ten-unit processing-cost plate');
      const share=new T.Group();share.name='Cost per usable die — illustrative allocation';g.add(share);share.position.set(1.48,.55,.70);
      for(let i=0;i<10;i++)box(share,[0,.018+i*.036,0],[.29,.025,.25],M.paper,'Per-usable-die allocation receipt');
      box(share,[-.10,.18,0],[.045,.38,.26],M.copper,'Receipt binding');
      batch(frame);batch(cost);batch(share);
      return {root:g,accepted,processingCostIndex,dies,pads,rejectMarks,failIds,failurePosition,cost,share};
    }
    runs.push(makeRun(1,60,100),makeRun(2,90,120));batch(fixed);
    function evaluateRun(run,progress){
      // The authored scan and the rejection motion use the SAME sequence index.
      // A chip cannot move into a reject drawer before it has been classified.
      const sequence=(progress-.04)/.80*100;
      const tested=Math.floor(Math.max(0,Math.min(100,sequence))),counts={tested,accepted:0,rejected:0};
      let markIndex=0;
      for(let i=0;i<100;i++){
        const ix=i%10,iz=Math.floor(i/10),from=[(ix-4.5)*.22,.60,(iz-4.5)*.22];
        const fail=run.failurePosition.has(i),known=i<tested;
        if(known)counts[fail?'rejected':'accepted']++;
        let p=0,to=from;
        if(fail){const j=run.failurePosition.get(i);to=[(j%10-4.5)*.22,.505,1.55+Math.floor(j/10)*.22];
          p=known?ramp(sequence,i+1,i+13.5):0;}
        const x=lerp(from[0],to[0],p),y=lerp(from[1],to[1],p)+.34*Math.sin(Math.PI*p),z=lerp(from[2],to[2],p);
        dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();run.dies.setMatrixAt(i,dummy.matrix);
        run.dies.setColorAt(i,known?(fail?rejectColor:acceptedColor):baseColor);
        for(let j=0;j<4;j++){
          dummy.position.set(x+(j%2?1:-1)*.052,y+.045,z+(j<2?1:-1)*.052);
          dummy.scale.set(.026,.005,.026);dummy.updateMatrix();run.pads.setMatrixAt(i*4+j,dummy.matrix);
        }
        if(fail)for(const angle of [-Math.PI/4,Math.PI/4]){
          dummy.position.set(x,y+.049,z);dummy.rotation.set(0,angle,0);dummy.scale.set(known?.105:0,.004,known?.012:0);
          dummy.updateMatrix();run.rejectMarks.setMatrixAt(markIndex++,dummy.matrix);
        }
      }
      run.dies.instanceMatrix.needsUpdate=true;run.dies.instanceColor.needsUpdate=true;
      run.pads.instanceMatrix.needsUpdate=true;run.rejectMarks.instanceMatrix.needsUpdate=true;
      return counts;
    }
    let current={};
    function update(u,phase='reject'){
      u=clamp(u);if(!['reject','improve','cost','limit'].includes(phase))throw new Error('Unknown yield phase: '+phase);
      const comparison=phase!=='reject',isCost=phase==='cost'||phase==='limit';
      runs[0].root.position.set(comparison?-1.65:0,0,0);runs[0].root.visible=true;
      runs[1].root.position.set(1.65,0,0);runs[1].root.visible=comparison;
      // Run A is already complete when a NEW Run B begins. Its rejected chips
      // stay in their own drawer; no die changes identity or becomes repaired.
      const a=evaluateRun(runs[0],phase==='reject'?u:1);
      const b=evaluateRun(runs[1],phase==='improve'?u:phase==='reject'?0:1);
      runs.forEach(run=>{run.cost.visible=isCost;run.share.visible=isCost;
        // Normalise to B's 120/90. Integer arithmetic gives exact 1.25 : 1.
        run.share.scale.set(1,run.processingCostIndex*90/(run.accepted*120),1);});
      head.visible=!isCost;
      const active=phase==='improve'?1:0,scan=clamp((u-.04)/.80)*99,row=Math.floor(scan/10),col=scan%10;
      head.position.set(runs[active].root.position.x+(col-4.5)*.22,0,0);
      fixture.position.set(0,0,(row-4.5)*.22);
      // The fixture position is only an authored visual locator. It does not
      // calculate or claim electrical/optical measurements for the die states.
      current={phase,u,hypothetical:true,measuredData:false,independentAlternativeRuns:true,repairedRejects:0,
        candidatesPerRun:100,visibleRuns:comparison?2:1,
        runA:{candidates:100,tested:a.tested,accepted:a.accepted,rejected:a.rejected,targetAccepted:60},
        runB:{candidates:100,tested:b.tested,accepted:b.accepted,rejected:b.rejected,targetAccepted:90},
        runLabels:{runA:'RUN / SUPPLIER A',runB:'RUN / SUPPLIER B'},
        waferProcessingCostIndex:{runA:100,runB:120},
        costPerUsableDie:{runA:100/60,runB:120/90,displayA:'1.67',displayB:'1.33'},
        supplierBQuotePremiumPercent:20,supplierBUnitCostReductionPercent:20,
        unitCostRatioBToA:120*60/(90*100),
        costScope:'Hypothetical wafer-processing quotes A 100 and B 120 only; downstream and other fixed costs excluded',
        toolIsIllustrative:true,qualificationNotSimulated:true};
    }
    function cameraAt(u,phase){
      u=clamp(u);
      if(phase==='reject')return {position:[2.75,6.25,7.2],target:[0,.70,.45],fov:39};
      if(phase==='cost')return {position:[3.30,6.2,7.25],target:[0,.65,.25],fov:39};
      if(phase==='limit')return {position:[2.5,6.4,8.2],target:[0,.66,.35],fov:39};
      return {position:[2.9,6.7,8.0],target:[0,.64,.45],fov:39};
    }
    update(0,'reject');
    return {root,label:'A higher quote can buy lower unit cost.',
      disclosure:'Hypothetical supplier comparison · not measured yield, prices, or TSMC data',
      update,cameraAt,state:()=>({...current,runA:{...current.runA},runB:{...current.runB},runLabels:{...current.runLabels},waferProcessingCostIndex:{...current.waferProcessingCostIndex},costPerUsableDie:{...current.costPerUsableDie}}),
      modelNotes:'Authored acceptance/rejection examples, not a simulation or measured fab performance. RUN / SUPPLIER A and B are independent alternatives. Sorting conserves 100 candidate die identities per run; rejects are never repaired. Hypothetical processing quotes are A 100 for 60 usable dies and B 120 for 90, from 100 candidates each. B costs 20% more to process but 20% less per usable die (1.6667 versus 1.3333 index units). Quotes exclude downstream and other fixed costs, and are not actual TSMC values. Both quotes and outcomes are stipulated: paying more alone is not claimed to cause higher yield.',
      anchors:{runA:[-1.65,.6,0],runB:[1.65,.6,0],rejectA:[-1.65,.51,1.88],rejectB:[1.65,.51,1.88]}};
  }
  return {bookings:bookingsWorld(),yield:yieldWorld()};
}
