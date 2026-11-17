/** Late-1990s PC assembly illustration. NOT an IBM 5150 or an exact RIVA board. */
export function createPCSet(T, kit) {
  const {box,cyl,mat,label,tube,seed,M}=kit;
  const root=new T.Group();root.name='1990s PC assembly room';
  const add=(...o)=>root.add(...o),clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);},mix=(a,b,p)=>a+(b-a)*p;
  const beige=mat('#b6b5a0',.64,.03),edge=mat('#837f6d',.72,.07),boardMat=mat('#b0d4b0',.55,.15,{map:kit.texture('pcb',7)}),gold=mat('#c5a251',.24,.8),chipMat=mat('#202423',.78,.04),wall=mat('#aab4b1',.94);
  add(box(7,.08,7,M.floor,0,-.04,0,0),box(7,3.3,.12,wall,0,1.65,-2.25,0),box(.12,3.3,5,wall,-3.1,1.65,0,0));
  // A window, sill, blinds, conduit and storage give the room an actual scale.
  add(box(1.7,1.35,.045,mat('#b8d2d1',.92,0,{emissive:'#90afbd',emissiveIntensity:.08}),-.95,1.96,-2.16,0));
  for(const x of[-1.82,-.95,-.08])add(box(.045,1.41,.08,M.paint,x,1.96,-2.1,0));
  for(const y of[1.24,2.68])add(box(1.85,.055,.16,M.paint,-.95,y,-2.1,0));
  for(let i=0;i<9;i++)add(box(1.7,.018,.065,M.white,-.95,2.56-i*.12,-2.07,0));
  add(box(1.96,.045,.3,M.wood,-.95,1.24,-2.05,0));
  add(box(2.68,.065,1.2,M.wood,0,.78,0,.008));
  for(const x of[-1.17,1.17])for(const z of[-.43,.43])add(box(.06,.75,.06,M.ink,x,.38,z,.003));
  add(box(2.3,.06,.035,M.ink,0,.31,-.43,0));
  add(box(.7,1.6,.5,M.paint,1.8,.8,-1.5,.008));
  for(let i=0;i<4;i++){add(box(.64,.25,.045,beige,1.8,.34+i*.32,-1.22,.004),box(.18,.018,.035,M.steel,1.8,.35+i*.32,-1.18,.002));}
  const clock=cyl(.15,.025,M.ink,1,2.35,-2.13,36);clock.rotation.x=Math.PI/2;add(clock);
  const clockFace=label('09 : 47',.22,.08,{background:'#dbd9bf',color:'#343e3d',size:25});clockFace.position.set(1,2.35,-2.106);add(clockFace);
  // Open desktop chassis. Motherboard and connector axes correspond physically.
  const caseX=.38,caseY=.825;
  add(box(.74,.025,.53,M.steel,caseX,caseY,0,.003),box(.025,.22,.53,beige,.762,.93,0,.004),box(.025,.22,.53,beige,-.002,.93,0,.004));
  add(box(.76,.22,.035,beige,caseX,.93,.283,.004),box(.74,.22,.018,M.steel,caseX,.93,-.27,0));
  add(box(.30,.034,.01,M.ink,.2,.975,.307,.001),box(.22,.012,.008,edge,.2,.941,.309,0));
  add(box(.19,.047,.012,edge,.58,.974,.306,.002));
  const powerButton=cyl(.014,.014,edge,.657,.886,.307,16);powerButton.rotation.x=Math.PI/2;add(powerButton);
  const powerLED=box(.008,.004,.007,mat('#50624a',.3,0,{emissive:'#79c293',emissiveIntensity:0}),.61,.886,.31,0);add(powerLED);
  for(let i=0;i<12;i++)add(box(.003,.055,.005,edge,.07+i*.022,.873,.308,0));
  const motherboard=box(.60,.008,.42,boardMat,.36,.847,-.015,.001);add(motherboard);
  const rng=seed(917);
  for(let i=0;i<23;i++){
    const x=.09+rng()*.54,z=-.19+rng()*.36;
    if(x>.25&&x<.38)continue;
    add(box(.015+rng()*.03,.012,.014+rng()*.025,chipMat,x,.861,z,.001));
  }
  // Socket, heatsink, RAM and a physically empty graphics connector.
  add(box(.093,.015,.092,edge,.58,.861,-.12,.002),box(.073,.028,.075,M.steel,.58,.882,-.12,.001));
  for(let i=0;i<8;i++)add(box(.006,.024,.075,M.steel,.548+i*.009,.904,-.12,0));
  for(let i=0;i<2;i++)add(box(.012,.052,.13,boardMat,.62+i*.025,.878,.09,.001));
  const slotX=.31,slotY=.87,slotZ=-.01;
  add(box(.018,.021,.205,M.ink,slotX,slotY,slotZ,.001));
  add(box(.004,.022,.193,edge,slotX-.008,slotY+.004,slotZ,0),box(.004,.022,.193,edge,slotX+.008,slotY+.004,slotZ,0));
  for(let i=0;i<18;i++){const z=slotZ-.086+i*.0101;add(box(.001,.006,.004,gold,slotX-.004,slotY+.005,z,0),box(.001,.006,.004,gold,slotX+.004,slotY+.005,z,0));}
  for(let i=0;i<2;i++)add(box(.014,.017,.17,M.white,.17-i*.055,.866,-.02,.001));
  add(box(.12,.11,.16,M.steel,.65,.91,.02,.003));
  // Wiring follows the chassis, never passes through the board insertion path.
  add(tube([[.67,.93,.10],[.55,.94,.17],[.48,.88,.17]],.004,M.rubber));
  add(tube([[.69,.95,-.10],[.52,1.03,-.22],[.48,.87,-.19]],.003,M.copper));
  const cover=new T.Group();cover.add(box(.78,.018,.55,beige,0,0,0,.003),box(.018,.15,.55,beige,-.39,-.075,0,.002),box(.018,.15,.55,beige,.39,-.075,0,.002));add(cover);
  const card=new T.Group();card.name='graphics board moving on connector axis';
  card.add(box(.002,.125,.228,boardMat,0,.073,0,.0001),box(.008,.008,.228,M.ink,.001,.14,0,.001));
  for(let i=0;i<24;i++){const z=-.087+i*.0074;card.add(box(.003,.018,.0045,gold,0,.011,z,0));}
  card.add(box(.009,.042,.047,chipMat,-.006,.080,-.017,.001));
  for(let i=0;i<4;i++)card.add(box(.007,.016,.03,chipMat,-.006,.110,-.075+i*.049,.001));
  for(let i=0;i<3;i++)card.add(box(.007,.02,.032,chipMat,-.006,.042,-.07+i*.06,.001));
  const cardName=label('GRAPHICS',.057,.012,{background:'#222725',color:'#b8b7a0',size:13});cardName.rotation.y=-Math.PI/2;cardName.position.set(-.011,.081,-.017);card.add(cardName);
  card.add(box(.025,.143,.005,M.steel,0,.074,-.119,.001),box(.028,.008,.018,M.steel,0,.147,-.113,.001));
  const connector=box(.038,.018,.012,mat('#435a6b',.7,.1),-.004,.082,-.128,.002);card.add(connector);
  add(card);
  const screw=cyl(.004,.016,M.steel,slotX,1.033,-.12,12);add(screw);
  // Empty / completed shipment, separate from a CPU socket or wafer.
  const tray=new T.Group();tray.position.set(-.28,.822,.40);tray.add(box(.32,.012,.17,M.ink,0,0,0,.003));
  const shipped=[];
  for(let i=0;i<6;i++){const x=-.125+(i%3)*.125,z=-.041+Math.floor(i/3)*.083;tray.add(box(.085,.006,.055,edge,x,.009,z,.001));const die=box(.063,.008,.041,chipMat,x,.017,z,.001);tray.add(die);shipped.push(die);}
  add(tray);
  // Period-shaped CRT; generated test pattern, not archival software footage.
  const monitor=new T.Group();monitor.position.set(-.69,.80,-.12);
  monitor.add(box(.26,.025,.23,beige,0,.014,0,.006),box(.11,.065,.13,edge,0,.052,0,.008),box(.42,.33,.35,beige,0,.245,-.035,.015));
  monitor.add(box(.35,.26,.012,M.rubber,0,.26,.147,.008));
  const screenCanvas=document.createElement('canvas');screenCanvas.width=512;screenCanvas.height=360;const sx=screenCanvas.getContext('2d');
  sx.fillStyle='#112c34';sx.fillRect(0,0,512,360);const sky=sx.createLinearGradient(0,0,0,360);sky.addColorStop(0,'#236277');sky.addColorStop(1,'#08191f');sx.fillStyle=sky;sx.fillRect(6,6,500,348);
  sx.strokeStyle='#9bd2ba';sx.lineWidth=1;
  for(let i=0;i<12;i++){sx.beginPath();sx.moveTo(256,162);sx.lineTo((i-2)*73,360);sx.stroke();}
  for(let i=0;i<7;i++){sx.beginPath();sx.moveTo(0,197+i*i*4);sx.lineTo(512,197+i*i*4);sx.stroke();}
  sx.fillStyle='#c7bf82';sx.beginPath();sx.moveTo(174,222);sx.lineTo(256,89);sx.lineTo(335,218);sx.closePath();sx.fill();sx.fillStyle='#7d9068';sx.beginPath();sx.moveTo(256,89);sx.lineTo(335,218);sx.lineTo(276,262);sx.closePath();sx.fill();
  sx.fillStyle='#d7e3d3';sx.font='13px monospace';sx.fillText('GRAPHICS TEST  //  DISPLAY READY',20,28);
  for(let i=0;i<360;i+=3){sx.fillStyle='rgba(0,0,0,.14)';sx.fillRect(0,i,512,1);}
  const screenTex=new T.CanvasTexture(screenCanvas);screenTex.colorSpace=T.SRGBColorSpace;
  const screenOn=new T.Mesh(new T.PlaneGeometry(.317,.225),new T.MeshBasicMaterial({map:screenTex}));screenOn.position.set(0,.26,.156);monitor.add(screenOn);
  const screenOff=box(.317,.225,.004,mat('#142126',.21,.23),0,.26,.155,.003);monitor.add(screenOff);add(monitor);
  const keyboard=new T.Group();keyboard.position.set(-.72,.823,.35);keyboard.add(box(.47,.018,.15,beige,0,0,0,.006));
  for(let row=0;row<4;row++)for(let i=0;i<15;i++)keyboard.add(box(.025,.009,.024,i===14?edge:M.white,-.216+i*.031,.015,-.052+row*.033,.001));
  add(keyboard);
  add(tube([[-.82,.82,.27],[-1,.82,.10],[-.8,.83,-.36],[-.25,.86,-.29]],.004,M.rubber));
  const labelPlane=label('ASSEMBLY  /  FINAL TEST',.38,.065,{background:'#ddd6bf',color:'#414435',size:22});labelPlane.position.set(.58,1.23,-.65);add(labelPlane);
  let state={};
  function frame({act='blocked',p=0,shot='slot',u=0,t=0}){
    const assembly=act==='assembly',working=act==='working';
    const installed=working?1:assembly?ease((p-.35)/.45):0;
    card.visible=assembly||working;card.position.set(slotX,.863+(1-installed)*.31,slotZ);card.rotation.set(0,0,0);
    const panelOff=assembly?ease(p/.25):1;cover.position.set(caseX,1.065-.108*panelOff+Math.sin(panelOff*Math.PI)*.11,-panelOff*.72);cover.rotation.set(0,0,0);cover.visible=!working;
    screw.position.y=1.014+(1-installed)*.12;screw.visible=installed>.93;
    const powered=working||assembly&&p>.87;screenOn.visible=powered;screenOff.visible=!powered;powerLED.material.emissiveIntensity=powered?.7:0;
    shipped.forEach((m,i)=>m.visible=working||act==='delivery'&&p>(i+1)/7);
    const push=ease(u);let position,target,fov;
    // Cuts observe one continuous board insertion; no orbital interpolation.
    const views={
      slot:{position:[.128,.978,.189],target:[slotX,.884,-.018],fov:35},
      room:{position:[-1.82,1.48,2.10],target:[-.05,1.03,-.04],fov:42},
      tray:{position:[-.57,1.04,.78],target:[-.28,.836,.40],fov:43},
      board:{position:[-.07,1.23,.27],target:[slotX,card.position.y+.075,-.012],fov:32},
      contact:{position:[.21,.947,.17],target:[slotX,.901,-.028],fov:38},
      side:{position:[-.34,1.30,.21],target:[slotX,1.01,-.015],fov:37},
      retention:{position:[.20,1.14,-.02],target:[slotX,1.009,-.119],fov:30},
      screen:{position:[-.97,1.17,.79],target:[-.69,1.06,.036],fov:35},
      wide:{position:[-1.80,1.36,1.84],target:[-.13,1.04,.02],fov:41}
    };
    const v=views[shot]||views.room;position=[...v.position];target=[...v.target];fov=v.fov;
    // A short dolly along the viewing axis, never a turntable arc.
    const amount=['room','wide'].includes(shot)?.06:.012;
    for(let i=0;i<3;i++)position[i]=mix(position[i],target[i],push*amount);
    state={act,shot,boardInserted:installed,remainingInsertionTravelMetres:Number(((1-installed)*.31).toFixed(6)),contactGapMetres:Number(Math.max(0,card.position.y+.002-.885).toFixed(6)),displayPowered:powered,shippedChips:shipped.filter(m=>m.visible).length,coverRemoved:panelOff};
    return {position,target,fov,focus:Math.hypot(...position.map((v,i)=>v-target[i])),look:{background:'#283735',key:'#f9dfb3',fill:'#b5d9e2',exposure:1.02},label:working?'The missing piece arrives.':assembly?'A place inside the PC.':'A product people wanted. A machine still waiting.',detail:'Late-1990s PC assembly illustration · not an IBM 5150 or a specific historical board',state};
  }
  return {root,frame,inspect:()=>state};
}
