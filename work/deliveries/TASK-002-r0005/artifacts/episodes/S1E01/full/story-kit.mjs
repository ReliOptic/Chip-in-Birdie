/** Original film-set construction helpers. Metres, Y-up; no archival claims. */
export function createStoryKit(T) {
  const geometries = new Map();
  const seed = n => { let v = n >>> 0; return () => ((v = (Math.imul(v, 1664525) + 1013904223) >>> 0) / 4294967296); };
  const mat = (hex, roughness = .5, metalness = 0, extra = {}) => new T.MeshStandardMaterial({color:hex, roughness, metalness, ...extra});
  function texture(kind, number = 3) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), rnd = seed(number);
    x.fillStyle = kind === 'wood' ? '#b89d76' : kind === 'pcb' ? '#4b6645' : '#c8c8c2'; x.fillRect(0,0,256,256);
    if (kind === 'wood') {
      for(let i=0;i<180;i++){x.strokeStyle=`rgba(${rnd()>.55?'70,40,18':'239,213,169'},${.025+rnd()*.09})`;x.lineWidth=.4+rnd()*1.4;x.beginPath();const y=rnd()*256;x.moveTo(0,y);x.bezierCurveTo(70,y-4+rnd()*8,180,y-4+rnd()*8,256,y);x.stroke();}
      x.fillStyle='rgba(50,33,21,.13)';x.fillRect(0,127,256,1);
    } else if(kind === 'pcb') {
      x.strokeStyle='#b3b179';x.lineWidth=.6;
      for(let i=0;i<100;i++){let a=Math.round(rnd()*64)*4,b=Math.round(rnd()*64)*4;x.beginPath();x.moveTo(a,b);x.lineTo(a+16,b);x.lineTo(a+32,b+16);x.lineTo(a+32,b+60*rnd());x.stroke();}
    } else if(kind === 'steel') {
      for(let i=0;i<700;i++){x.fillStyle=`rgba(${rnd()>.5?'255,255,255':'30,39,47'},${rnd()*.09})`;x.fillRect(0,rnd()*256,256,.2+rnd()*.5);}
    } else {
      for(let i=0;i<6000;i++){x.fillStyle=`rgba(${rnd()>.5?'255,255,255':'52,53,49'},${rnd()*.06})`;x.fillRect(rnd()*256,rnd()*256,.5+rnd()*2,.5+rnd()*2);}
    }
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex;
  }
  const M = {
    steel:mat('#b4bec4',.34,.73,{map:texture('steel')}), paint:mat('#c3c9c4',.62,.12),
    ink:mat('#151c20',.74,.06), rubber:mat('#171b1b',.94,0), glass:mat('#183b43',.17,.4),
    copper:mat('#b77d42',.3,.75), paper:mat('#e5dfcd',.9,0,{map:texture('paper')}),
    pcb:mat('#b5d2b2',.68,.12,{map:texture('pcb')}), wood:mat('#e4cda9',.58,0,{map:texture('wood')}),
    floor:mat('#99a8a6',.83,.03,{map:texture('floor')}), warm:mat('#d7b68b',.7,0), white:mat('#f1f0e5',.65,.02)
  };
  function box(w,h,d,material,x=0,y=0,z=0,r=.01) {
    r=Math.max(0,Math.min(r,w*.14,h*.14,d*.14));
    const key=[w,h,d,r].join(':');let g=geometries.get(key);
    if(!g){
      if(r>.0015){
        // Chamfered solid: broad readable faces, physically rounded edge strips.
        g=new T.BoxGeometry(w,h,d,2,2,2);const p=g.attributes.position;
        for(let i=0;i<p.count;i++){
          const a=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i));
          const q=new T.Vector3(Math.max(-w/2+r,Math.min(w/2-r,a.x)),Math.max(-h/2+r,Math.min(h/2-r,a.y)),Math.max(-d/2+r,Math.min(d/2-r,a.z)));
          a.sub(q).normalize().multiplyScalar(r).add(q);p.setXYZ(i,a.x,a.y,a.z);
        }g.computeVertexNormals();
      }else g=new T.BoxGeometry(w,h,d);
      geometries.set(key,g);
    }
    const m=new T.Mesh(g,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;
  }
  function cyl(radius,height,material,x=0,y=0,z=0,segments=24){
    const key=['c',radius,height,segments].join(':');let g=geometries.get(key);
    if(!g){g=new T.CylinderGeometry(radius,radius,height,segments);geometries.set(key,g);}
    const m=new T.Mesh(g,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;
  }
  function label(text,width,height,{background='#e7e2d2',color='#162429',size=42,lines=null}={}){
    const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*height/width));
    const x=c.getContext('2d');x.fillStyle=background;x.fillRect(0,0,c.width,c.height);
    const rows=lines || String(text).split('\n');x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';
    x.font=`600 ${Math.min(size*1024/512,c.height/(rows.length+1))}px Arial, sans-serif`;
    rows.forEach((line,i)=>x.fillText(line,c.width/2,c.height*(i+1)/(rows.length+1),c.width*.9));
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    const m=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,side:T.DoubleSide}));m.userData.textureCanvas=c;return m;
  }
  function tube(points,radius,material){const curve=new T.CatmullRomCurve3(points.map(p=>p.isVector3?p:new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,Math.max(6,points.length*3),radius,6,false),material);m.castShadow=m.receiveShadow=true;return m;}
  return {box,cyl,mat,label,tube,seed,M,texture};
}
