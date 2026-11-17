// R5: three different economic objects, not the old circuit/factory motif.
// All geometry is authored illustration. No real customer design or banknote.
export function createTransactions(T) {
  const C={paper:0xe9dfc9,ink:0x262924,olive:0x697258,copper:0xb97851,steel:0x8c9690,red:0x9e4f3f,white:0xf3ecdc};
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)},lerp=(a,b,t)=>a+(b-a)*t;
  const mat=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const M={paper:mat(C.paper,.93),ink:mat(C.ink,.58),olive:mat(C.olive,.72),copper:mat(C.copper,.3,.65),steel:mat(C.steel,.35,.72),red:mat(C.red,.8),white:mat(C.white,.8)};
  const box=(g,x,y,z,w,h,d,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o};
  const cyl=(g,x,y,z,r,h,m,n=32)=>{const o=new T.Mesh(new T.CylinderGeometry(r,r,h,n),m);o.position.set(x,y,z);g.add(o);return o};
  function slab(g,w,d,h,m){const s=new T.Shape(),r=.07; s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const geo=new T.ExtrudeGeometry(s,{depth:h,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,curveSegments:5});geo.rotateX(-Math.PI/2);const o=new T.Mesh(geo,m);g.add(o);return o;}
  function print(lines,{w=1024,h=768,bg='#e9dfc9',color='#252a24',large=55,ruled=false}={}){
    const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);
    // Fine deterministic paper fibres are baked once, not animated noise.
    for(let j=0;j<170;j++){const a=(j*173)%w,b=(j*97)%h;x.strokeStyle=j%2?'#5f503609':'#ffffff20';x.lineWidth=.6;x.beginPath();x.moveTo(a,b);x.lineTo(a+5+(j%17),b+2);x.stroke()}
    if(ruled){x.strokeStyle='#756e5733';x.lineWidth=1;for(let y=190;y<h-40;y+=55){x.beginPath();x.moveTo(65,y);x.lineTo(w-65,y);x.stroke()}}
    x.textBaseline='top';lines.forEach((line,i)=>{const txt=typeof line==='string'?line:line.text,size=typeof line==='string'?(i===0?large:large*.68):line.size||large;x.fillStyle=typeof line==='string'?color:line.color||color;x.font=(i===0?'500 ':'400 ')+size+'px '+(i===0?'Georgia':'Arial');x.fillText(txt,64,58+i*(h-110)/Math.max(1,lines.length));});
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
  }
  function paper(g,x,y,z,w,d,lines,opts={}){const group=new T.Group();group.position.set(x,y,z);g.add(group);box(group,0,0,0,w,.035,d,M.paper);const o=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:print(lines,opts),side:T.DoubleSide}));o.rotation.x=-Math.PI/2;o.position.y=.020;group.add(o);return group;}
  function plaque(g,text,x,y,z,w=1.5,d=.42,bg='#e9dfc9'){return paper(g,x,y,z,w,d,[text],{w:768,h:192,large:63,bg});}
  function board(g){const p=new T.Group();g.add(p);slab(p,2.65,1.55,.08,M.olive);const body=box(p,.15,.15,-.05,1.01,.16,.78,M.ink);box(p,.15,.245,-.05,.64,.025,.41,M.steel);for(let side of [-1,1])for(let i=0;i<10;i++)box(p,.15+(i-4.5)*.093,.13,side*.46-.05,.045,.035,.16,M.copper);
    for(let i=0;i<12;i++){box(p,-.95+i*.17,.105,.67,.075,.02,.2,M.copper);box(p,-.95+i*.17,.101,-.66,.08,.02,.15,M.copper)}
    for(let i=0;i<5;i++){const x=-1+i*.48;box(p,x,.12,-.49,.23,.08,.12,M.ink);box(p,x,.12,.45,.19,.07,.12,M.ink)}
    for(let i=0;i<4;i++){box(p,-1.13,.18,-.25+i*.18,.16,.20,.12,M.steel);box(p,.92,.13,-.35+i*.22,.32,.09,.10,M.ink)}
    for(let i=0;i<5;i++){box(p,-.65+i*.12,.09,0,.025,.013,.8,M.copper);box(p,.6,.091,-.25+i*.12,.45,.012,.018,M.copper)}
    for(const x of [-1.18,1.18])for(const z of [-.61,.61])cyl(p,x,.092,z,.045,.018,M.steel,16);
    return p;
  }
  function clipboard(g,x,y,z,w,d,lines,options={}){const b=new T.Group();b.position.set(x,y,z);g.add(b);slab(b,w+.18,d+.18,.1,M.ink);paper(b,0,.115,0,w,d,lines,{ruled:true,...options});box(b,0,.17,-d*.44,w*.38,.07,.14,M.steel);return b}
  const camera=(a,b,target,fov,u)=>({position:a.map((v,i)=>lerp(v,b[i],ease(u))),target,fov});
  function bench(g,w=8,d=4.6){const a=slab(g,w,d,.18,M.ink);a.position.y=-.2;for(const x of[-w*.43,w*.43])box(g,x,-.36,0,.13,.26,d*.88,M.steel);return a}

  const deal=(()=>{
    const root=new T.Group();bench(root,7.6,4.2);
    const product=board(root);product.position.set(1.55,.07,.05);product.rotation.y=-.20;
    const invoice=clipboard(root,-1.7,.03,.08,2.45,3.05,[{text:'FACTORY',size:112},'Ownership','Buildings + equipment','Manufacturing staff'],{large:85,color:'#141c15'});
    const order=paper(root,-1.62,.30,.12,2.4,3.0,[{text:'PRODUCTION',size:100},'Purchase order','Your chip design','Made by a foundry'],{ruled:true,large:85,bg:'#efdfb9',color:'#172319'});
    const packages=new T.Group();root.add(packages);for(let i=0;i<7;i++){const p=box(packages,1.0+(i%4)*.40,.18,1.38+Math.floor(i/4)*.33,.29,.13,.25,M.ink);box(p,0,.075,0,.18,.015,.15,M.steel)}
    const ribbon=box(root,0,.035,.22,5.6,.015,.065,M.copper);
    const cirrus=clipboard(root,0,.1,0,3.4,2.6,['Cirrus Logic / TSMC','Minimum purchase','Guaranteed quantities','Supply agreements'],{ruled:true});
    const clasp=new T.Group();root.add(clasp);cyl(clasp,0,0,0,.23,.15,M.steel);box(clasp,0,.15,0,.12,.28,.12,M.copper);
    const buyer=plaque(root,'CUSTOMER',-2.7,.08,1.6,1.7),seller=plaque(root,'MANUFACTURER',2.35,.08,-1.6,2.3);
    let phase='opening',u=0;
    function update(t,p){u=clamp(t);phase=p;const q=ease((u-.12)/.62);for(const o of [invoice,order,product,packages,ribbon,cirrus,clasp,buyer,seller])o.visible=false;
      product.position.set(1.45,.07,.05);product.rotation.set(0,-.20,0);product.scale.setScalar(1.12);invoice.position.set(-1.7,.03,.08);invoice.rotation.set(0,0,0);order.position.set(-1.62,.30,.12);order.rotation.set(0,0,0);packages.position.set(0,0,0);clasp.position.set(0,0,0);clasp.rotation.set(0,0,0);
      if(p==='opening'){invoice.visible=product.visible=order.visible=true;invoice.position.x=-1.7-q*9;invoice.rotation.y=-q*.28;order.position.y=.06;order.position.x=-1.65;product.position.x=1.45-.2*q;}
      else if(p==='roles'){product.visible=packages.visible=ribbon.visible=buyer.visible=seller.visible=true;packages.position.set(lerp(0,-1.1,q),0,0);product.position.x=-1.8;product.rotation.y=.1;}
      else if(p==='terms'){cirrus.visible=clasp.visible=buyer.visible=seller.visible=true;clasp.position.set(1.35,.65-.36*q,.85);clasp.rotation.y=-.25;}
      else {order.visible=product.visible=true;order.position.x=-1.8;product.position.x=1.5;}
    }
    return {root,label:'What a chip company can buy',disclosure:'AUTHORED ECONOMIC MODEL · NO ACTUAL CUSTOMER DESIGN',update,cameraAt(t,p){if(p==='terms')return camera([3.4,6.6,5.6],[3.1,6.3,5.3],[0,.15,0],37,t);if(p==='roles')return camera([.3,8.3,5.5],[.3,8.1,5.4],[0,.15,.2],41,t);return camera([1.9,6.8,7.4],[1.5,6.4,7.0],[0,.2,0],39,t)},state:()=>({world:'deal',phase,u,ownsFactory:phase==='opening'?u<.65:false,minimumPurchaseShown:phase==='terms'})};
  })();

  const founder=(()=>{
    const root=new T.Group();bench(root,9.5,5.3);
    const productPlan=clipboard(root,-2.2,.06,0,3.3,3.7,['Product business','Engineering / design','Masks / test / packaging','Find a buyer'],{ruled:true});
    const factory=new T.Group();factory.position.set(2.45,.05,0);root.add(factory);slab(factory,3.2,3.7,.18,M.steel);
    // Construction section: pipe services, exterior columns and production floor.
    for(const x of[-1.4,1.4])for(const z of[-1.6,0,1.6])box(factory,x,1.05,z,.10,1.8,.10,M.ink);
    for(const z of[-1.6,0,1.6])box(factory,0,1.97,z,2.95,.12,.10,M.ink);
    for(const x of[-.75,-.25,.25,.75]){const p=cyl(factory,x,1.82,0,.055,3.5,M.copper,16);p.rotation.x=Math.PI/2}
    for(let i=0;i<4;i++){const z=-1.2+i*.8;box(factory,-.55,.68,z,.95,.97,.57,M.white);box(factory,-.55,.91,z+.3,.58,.36,.03,M.ink);box(factory,.74,.40,z,.65,.42,.55,M.olive);cyl(factory,.72,.69,z,.20,.15,M.steel,24)}
    plaque(factory,'OWN FACTORY',0,.23,1.82,2.8,.38);
    const prototype=board(root);prototype.scale.setScalar(.69);prototype.position.set(-2.2,.22,.15);
    const capital=new T.Group();root.add(capital);for(let i=0;i<16;i++)box(capital,-2.8+(i%8)*.24,.15+Math.floor(i/8)*.07,1.94,.19,.055,.34,M.copper);
    const receipts=[];for(const [i,name] of ['DESIGN','MASKS','TEST / PACKAGE','WORKING CAPITAL'].entries()){const a=paper(root,-3+i*2,.10,1.7,1.65,.7,[name],{w:768,h:256,large:44});receipts.push(a)}
    const supplier=clipboard(root,2.25,.15,.10,2.9,3.4,['Supplier agreement','Production orders','Agreed process','Capacity commitment'],{ruled:true});
    let phase='bundle',u=0;
    function update(t,p){phase=p;u=clamp(t);const q=ease((u-.05)/.65);productPlan.visible=prototype.visible=true;capital.visible=false;supplier.visible=false;factory.visible=true;receipts.forEach((o,i)=>{o.visible=false;o.position.set(-3+i*2,.10,1.7)});factory.position.set(2.45,.05,0);factory.scale.setScalar(1);prototype.position.set(-2.2,.22,.15);prototype.scale.setScalar(.69);capital.position.set(0,0,0);
      if(p==='asset'){productPlan.visible=prototype.visible=false;factory.position.set(.45,.05,0);}
      if(['without','team','prototype','remaining','price'].includes(p)){factory.visible=false;supplier.visible=true;}
      if(p==='without'){factory.visible=u<.7;factory.position.set(2.45+q*5,.05,0);supplier.position.y=.15;}
      if(p==='team'){capital.visible=true;capital.position.x=-q*.5;prototype.position.y=.22+.05*q;}
      if(p==='prototype'){productPlan.visible=false;prototype.position.set(-1,.17,0);prototype.scale.setScalar(1.25);}
      if(p==='remaining'){receipts.forEach((o,i)=>{o.visible=true;o.position.z=1.7+(.4*(1-ease(u*3-i*.35)))});prototype.position.z=-.4;}
      if(p==='price'){productPlan.rotation.y=-.05;prototype.position.z=-.3;factory.visible=true;supplier.visible=false;}
      else productPlan.rotation.y=0;
    }
    return {root,label:'The founder’s financing decision',disclosure:'ILLUSTRATIVE START-UP · NO COMPANY BUDGET OR COST SCALE',update,cameraAt(t,p){if(p==='asset')return camera([4.8,3.9,6.5],[4.5,3.75,6.2],[.3,.9,0],38,t);if(p==='team')return camera([.5,8.9,7.8],[.4,8.7,7.6],[0,.15,0],43,t);if(p==='remaining')return camera([.3,8.8,5.9],[.3,8.7,5.8],[0,.25,.35],44,t);return camera([4.3,6.5,9.4],[4.1,6.2,9.1],[0,.5,0],42,t)},state:()=>({world:'founder',phase,u,factoryRequired:phase==='bundle'||phase==='asset',remainingCosts:['design','masks','test/package','working capital']})};
  })();

  const contract=(()=>{
    const root=new T.Group();bench(root,9.4,5.3);
    const ledger=clipboard(root,-2.5,.08,0,3.3,3.8,['Cirrus Logic / TSMC','FY1997 disclosure','Minimum wafer purchases','For assured supply'],{ruled:true});
    const future=clipboard(root,1.55,.08,-.4,4.1,3.4,['Advance commitment','≈ US$118 million','½ FY1998  /  ½ FY1999','FY1996 agreement'],{ruled:true});
    const review=paper(root,1.55,.22,.5,3.8,1.4,['Terms under review','No new written agreement'],{w:1024,h:384,large:66,bg:'#d4c1a4',color:'#713e30'});
    const reservation=new T.Group();reservation.position.set(1.25,.05,0);root.add(reservation);slab(reservation,4.7,3.6,.1,M.steel);
    const slots=[],allocated=[];for(let i=0;i<10;i++){const x=(i%5-2)*.83,z=(Math.floor(i/5)-.5)*1.0;box(reservation,x,.145,z,.72,.07,.82,M.ink);const tile=new T.Group();tile.position.set(x,.29,z);reservation.add(tile);slab(tile,.63,.7,.12,M.olive);const face=paper(tile,0,.14,0,.57,.64,[String(i+1).padStart(2,'0')],{w:256,h:256,large:98,bg:'#6b765c',color:'#f3ecdc'});slots.push(tile);allocated.push({x,z});}
    const buy=plaque(root,'BOUGHT',-2.7,.15,2.25,2.3),resell=plaque(root,'RESOLD',0,.15,2.25,1.8),unsold=plaque(root,'UNSOLD',2.85,.15,2.25,1.8,.42,'#c49b83');
    const charge=clipboard(root,2.9,.1,.15,2.2,2.6,['Possible penalty','Unsold shortfall','Per-wafer condition','Not a loss dataset'],{ruled:true});
    const joint=paper(root,-2.4,.17,.0,3.4,3.4,['Also: manufacturing stakes','Supply access','Capital commitments','Control'],{ruled:true});
    let phase='terms',u=0;
    function update(t,p){phase=p;u=clamp(t);const q=ease((u-.1)/.72);[ledger,future,review,reservation,buy,resell,unsold,charge,joint].forEach(o=>o.visible=false);ledger.position.set(-2.5,.08,0);future.position.set(1.55,.08,-.4);review.position.set(1.55,.22,.5);reservation.position.set(1.25,.05,0);charge.position.set(2.9,.1,.15);slots.forEach((o,i)=>{o.visible=true;o.position.set(allocated[i].x,.29,allocated[i].z);o.rotation.set(0,0,0);o.children[0].material=M.olive;});
      if(p==='terms'){ledger.visible=future.visible=true;future.position.x=2.1;}
      if(p==='advance'||p==='dated'){future.visible=true;future.position.x=0;}
      if(p==='renegotiate'){future.visible=review.visible=true;future.position.x=0;review.position.x=0;review.position.z=lerp(3.6,.5,q);}
      if(['shortfall','resold','penalty'].includes(p)){reservation.visible=buy.visible=resell.visible=unsold.visible=true;reservation.position.set(0,.05,-.5);const bought=p==='shortfall'?q:1;for(let i=0;i<7;i++){const a=slots[i];a.position.x=lerp(allocated[i].x,-3.8+(i%4)*.74,bought);a.position.z=lerp(allocated[i].z,1.15+Math.floor(i/4)*.80,bought);a.position.y=.29+.16*Math.sin(bought*Math.PI)}
        if(p==='resold'||p==='penalty')for(let i=7;i<9;i++){const sold=p==='resold'?q:1,a=slots[i];a.position.x=lerp(allocated[i].x,-.4+(i-7)*.8,sold);a.position.z=lerp(allocated[i].z,1.65,sold);a.children[0].material=M.copper;}
        if(p==='penalty'){charge.visible=true;charge.position.set(2.8,.15,0);slots[9].position.set(2.7,.3,1.6);slots[9].children[0].material=M.red;}
      }
      if(p==='dependency'){joint.visible=ledger.visible=true;ledger.position.x=2.3;}
    }
    return {root,label:'The price of assured supply',disclosure:'FY1997 FILING · BOOKING COUNTS ARE ILLUSTRATIVE',update,cameraAt(t,p){if(p==='advance'||p==='dated'||p==='renegotiate')return camera([.3,7.4,4.7],[.3,7.3,4.5],[0,.2,-.2],39,t);if(p==='penalty')return camera([4.2,7.8,7.2],[4,7.5,7],[.2,.1,.2],44,t);if(p==='shortfall'||p==='resold')return camera([.1,8.6,5.3],[.1,8.5,5.2],[0,.1,.1],44,t);return camera([3.2,7.2,8.0],[3.1,7.0,7.8],[0,.1,0],45,t)},state:()=>({world:'contract',phase,u,futureAdvanceUSD:118000000,payYears:['FY1998','FY1999'],paidAlready:false,illustration:phase==='shortfall'||phase==='resold'||phase==='penalty',minimum:10,bought:7,resold:phase==='resold'||phase==='penalty'?2:0,penaltyExposed:phase==='penalty'?1:null})};
  })();
  return {deal,founder,contract};
}
