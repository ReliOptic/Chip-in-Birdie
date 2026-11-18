/**
 * Original, deliberately limited CPU 3D fallback for S1E01.
 * Rasterizes the SAME Three BufferGeometry/InstancedMesh and camera. Canvas 2D
 * only presents the pixels; this is not WebGL, a screenshot, or a poster player.
 * Supported: opaque/alpha meshes, groups, smooth vertex lighting, perspective-
 * correct CanvasTexture maps, depth testing, near clipping, directional shadows.
 * Not a replacement for PBR: no PMREM, transmission, skinning or custom shaders.
 */
export function createSoftwareRenderer(T, {canvas, quality='balanced'}={}) {
  if (!canvas) throw new Error('Software 3D needs a fresh canvas');
  const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
  if (!ctx) throw new Error('Canvas 2D is also unavailable');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const colorCache=new Float32Array(256);
  for(let i=0;i<256;i++){const v=i/255;colorCache[i]=v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}
  const srgb=v=>{v=clamp(v);return Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));};
  const littleEndian=new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]===4;
  const pack=(r,g,b)=>littleEndian?((255<<24)|(b<<16)|(g<<8)|r)>>>0:((r<<24)|(g<<16)|(b<<8)|255)>>>0;
  const geometryCache=new WeakMap(), textureCache=new WeakMap();
  const world=new T.Matrix4(), instance=new T.Matrix4(), mvp=new T.Matrix4(), vp=new T.Matrix4(), normal=new T.Matrix3();
  const shadowVP=new T.Matrix4(), shadowMVP=new T.Matrix4(), cameraPosition=new T.Vector3(), lightPosition=new T.Vector3(), lightTarget=new T.Vector3();
  const shadowCamera=new T.OrthographicCamera(-10,10,10,-10,.1,50);
  const shadowSize=quality==='high'?512:384, shadowDepth=new Float32Array(shadowSize*shadowSize);
  const shadeLUT=new Uint8Array(16385);
  let width=1,height=1,pixelRatio=1,logicalWidth=1,logicalHeight=1,imageData, pixels, depth;
  let exposure=-1, useShadow=false, opaqueCalls=0, meshCount=0;
  let background=[.004,.007,.011], fog=null, lights=[], ambient=[.22,.24,.26], hemi=null;
  const transparent=[], transparentPool=[];
  const meshList=[],meshPool=[];
  const info={render:{triangles:0,calls:0,points:0,lines:0},memory:{geometries:0,textures:0},software:{submittedTriangles:0,shadowTriangles:0,backend:'CPU triangle rasterizer / Canvas 2D',quality}};
  // Main projected vertex stride: screen xy, NDC z, reciprocal w, RGB,
  // UV/w, shadow xyz/w. The final two slots hold raw clip z/w for clipping.
  const STRIDE=14;
  const clipA=new Float64Array(STRIDE),clipB=new Float64Array(STRIDE),clipC=new Float64Array(STRIDE);
  const clipOut=Array.from({length:5},()=>new Float64Array(STRIDE));
  let disposed=false;

  function allocate(){
    width=Math.max(1,Math.round(logicalWidth*pixelRatio));height=Math.max(1,Math.round(logicalHeight*pixelRatio));
    canvas.width=width;canvas.height=height;
    imageData=ctx.createImageData(width,height);pixels=new Uint32Array(imageData.data.buffer);depth=new Float32Array(width*height);
  }
  function getGeometry(g){
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    let c=geometryCache.get(g);
    if(c&&c.positionAttribute===p&&c.normalAttribute===n&&c.uvAttribute===uv&&c.indexAttribute===g.index&&c.count===p.count&&c.version===p.version&&c.normalVersion===n?.version&&c.uvVersion===uv?.version)return c;
    const positions=new Float64Array(p.count*3),normals=new Float32Array(p.count*3),uvs=new Float32Array(p.count*2);
    let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
    for(let i=0;i<p.count;i++){
      positions[i*3]=p.getX(i);positions[i*3+1]=p.getY(i);positions[i*3+2]=p.getZ(i);
      minX=Math.min(minX,positions[i*3]);maxX=Math.max(maxX,positions[i*3]);minY=Math.min(minY,positions[i*3+1]);maxY=Math.max(maxY,positions[i*3+1]);minZ=Math.min(minZ,positions[i*3+2]);maxZ=Math.max(maxZ,positions[i*3+2]);
      if(n){normals[i*3]=n.getX(i);normals[i*3+1]=n.getY(i);normals[i*3+2]=n.getZ(i);}
      if(uv){uvs[i*2]=uv.getX(i);uvs[i*2+1]=uv.getY(i);}
    }
    const indices=g.index?g.index.array:Uint32Array.from({length:p.count},(_,i)=>i);
    if(!n){
      for(let i=0;i+2<indices.length;i+=3){const a=indices[i]*3,b=indices[i+1]*3,d=indices[i+2]*3;
        const ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],uz=positions[b+2]-positions[a+2];
        const vx=positions[d]-positions[a],vy=positions[d+1]-positions[a+1],vz=positions[d+2]-positions[a+2];
        const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
        for(const j of[a,b,d]){normals[j]+=nx;normals[j+1]+=ny;normals[j+2]+=nz;}
      }
      for(let i=0;i<normals.length;i+=3){const l=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;normals[i]/=l;normals[i+1]/=l;normals[i+2]/=l;}
    }
    c={positions,normals,uvs,indices,count:p.count,center:[(minX+maxX)/2,(minY+maxY)/2,(minZ+maxZ)/2],projected:new Float64Array(p.count*STRIDE),positionAttribute:p,normalAttribute:n,uvAttribute:uv,indexAttribute:g.index,version:p.version,normalVersion:n?.version,uvVersion:uv?.version};
    if(!geometryCache.has(g))info.memory.geometries++;
    geometryCache.set(g,c);return c;
  }
  function getTexture(map){
    if(!map?.image)return null;
    const old=textureCache.get(map);if(old&&old.version===map.version)return old;
    const image=map.image,w=image.width||image.videoWidth,h=image.height||image.videoHeight;
    if(!w||!h)return null;
    let data;
    try{
      if(image.getContext)data=image.getContext('2d').getImageData(0,0,w,h).data;
      else if(image.data)data=image.data;
      else {const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):canvas.ownerDocument?.createElement('canvas');if(!c)return null;c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(image,0,0);data=x.getImageData(0,0,w,h).data;}
    }catch{return null;}
    if(!data)return null;
    map.updateMatrix?.();
    const result={data,width:w,height:h,flipY:map.flipY!==false,version:map.version,repeatS:map.wrapS===T.RepeatWrapping,repeatT:map.wrapT===T.RepeatWrapping};
    if(!old)info.memory.textures++;
    textureCache.set(map,result);return result;
  }
  function toneTable(){
    const e=Number.isFinite(renderer.toneMappingExposure)?renderer.toneMappingExposure:1;
    if(exposure===e)return;exposure=e;
    for(let i=0;i<shadeLUT.length;i++){let x=i/2048*e;x=(x*(2.51*x+.03))/(x*(2.43*x+.59)+.14);shadeLUT[i]=srgb(x);}
  }
  function collect(scene,camera){
    lights=[];ambient=[.08,.09,.11];hemi=null;let key=null;
    camera.getWorldPosition(cameraPosition);
    scene.traverseVisible(o=>{
      if(o.isAmbientLight){ambient[0]+=o.color.r*o.intensity*.3;ambient[1]+=o.color.g*o.intensity*.3;ambient[2]+=o.color.b*o.intensity*.3;}
      if(o.isHemisphereLight)hemi={sky:o.color,ground:o.groundColor,intensity:o.intensity*.28};
      if(o.isDirectionalLight){
        o.getWorldPosition(lightPosition);o.target.getWorldPosition(lightTarget);lightPosition.sub(lightTarget).normalize();
        lights.push({x:lightPosition.x,y:lightPosition.y,z:lightPosition.z,r:o.color.r*o.intensity*.28,g:o.color.g*o.intensity*.28,b:o.color.b*o.intensity*.28});
        if(!key&&o.castShadow)key=o;
      }
    });
    if(!hemi&&lights.length===0){ambient=[.33,.35,.38];lights.push({x:-.4,y:.8,z:.4,r:.8,g:.75,b:.68});}
    useShadow=!!(renderer.shadowMap.enabled&&key);
    if(useShadow){
      const c=key.shadow?.camera;
      if(c?.isOrthographicCamera){shadowCamera.left=c.left;shadowCamera.right=c.right;shadowCamera.top=c.top;shadowCamera.bottom=c.bottom;shadowCamera.near=c.near;shadowCamera.far=c.far;}
      key.getWorldPosition(shadowCamera.position);key.target.getWorldPosition(lightTarget);shadowCamera.lookAt(lightTarget);shadowCamera.updateProjectionMatrix();shadowCamera.updateMatrixWorld();
      shadowVP.multiplyMatrices(shadowCamera.projectionMatrix,shadowCamera.matrixWorldInverse);shadowDepth.fill(Infinity);
    }
    background=scene.background?.isColor?[scene.background.r,scene.background.g,scene.background.b]:[.004,.007,.011];
    fog=scene.fog?.isFog?scene.fog:null;
  }
  function project(c,matrix,material,instanceColor,shadowOnly=false){
    const positions=c.positions,normals=c.normals,p=c.projected,N=c.count;
    mvp.multiplyMatrices(shadowOnly?shadowVP:vp,matrix);
    const a=mvp.elements,m=matrix.elements,n=normal.getNormalMatrix(matrix).elements;
    if(useShadow&&!shadowOnly)shadowMVP.multiplyMatrices(shadowVP,matrix);
    const sm=shadowMVP.elements,base=material?.color;
    const br=(base?.r??1)*(instanceColor?.r??1),bg=(base?.g??1)*(instanceColor?.g??1),bb=(base?.b??1)*(instanceColor?.b??1);
    const rough=clamp(material?.roughness??.65,.05,1),metal=clamp(material?.metalness??0),power=8+110*(1-rough)*(1-rough);
    const er=(material?.emissive?.r||0)*(material?.emissiveIntensity??1),eg=(material?.emissive?.g||0)*(material?.emissiveIntensity??1),eb=(material?.emissive?.b||0)*(material?.emissiveIntensity??1);
    const textureMatrix=material?.map?.matrix?.elements;
    for(let i=0,j=0,k=0;i<N;i++,j+=3,k+=STRIDE){
      const x=positions[j],y=positions[j+1],z=positions[j+2];
      const cx=a[0]*x+a[4]*y+a[8]*z+a[12],cy=a[1]*x+a[5]*y+a[9]*z+a[13],cz=a[2]*x+a[6]*y+a[10]*z+a[14],cw=a[3]*x+a[7]*y+a[11]*z+a[15];
      // Retain homogeneous coordinates until near clipping; screen is set below.
      p[k]=cx;p[k+1]=cy;p[k+2]=cz;p[k+3]=cw;p[k+12]=cz;p[k+13]=cw;
      if(shadowOnly)continue;
      let nx=n[0]*normals[j]+n[3]*normals[j+1]+n[6]*normals[j+2],ny=n[1]*normals[j]+n[4]*normals[j+1]+n[7]*normals[j+2],nz=n[2]*normals[j]+n[5]*normals[j+1]+n[8]*normals[j+2];
      const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
      const wx=m[0]*x+m[4]*y+m[8]*z+m[12],wy=m[1]*x+m[5]*y+m[9]*z+m[13],wz=m[2]*x+m[6]*y+m[10]*z+m[14];
      let vx=cameraPosition.x-wx,vy=cameraPosition.y-wy,vz=cameraPosition.z-wz;const dist=Math.hypot(vx,vy,vz)||1;vx/=dist;vy/=dist;vz/=dist;
      if(material?.side===T.DoubleSide&&nx*vx+ny*vy+nz*vz<0){nx=-nx;ny=-ny;nz=-nz;}
      let ar=ambient[0],ag=ambient[1],ab=ambient[2],specR=0,specG=0,specB=0;
      if(hemi){const u=ny*.5+.5;ar+=(hemi.ground.r+(hemi.sky.r-hemi.ground.r)*u)*hemi.intensity;ag+=(hemi.ground.g+(hemi.sky.g-hemi.ground.g)*u)*hemi.intensity;ab+=(hemi.ground.b+(hemi.sky.b-hemi.ground.b)*u)*hemi.intensity;}
      for(const l of lights){const d=Math.max(0,nx*l.x+ny*l.y+nz*l.z);ar+=l.r*d;ag+=l.g*d;ab+=l.b*d;
        if(d>0){const hx=vx+l.x,hy=vy+l.y,hz=vz+l.z,hl=Math.hypot(hx,hy,hz)||1;const spec=Math.max(0,(nx*hx+ny*hy+nz*hz)/hl)**power*(.09+.55*metal)*(1-.45*rough);
          specR+=l.r*spec*(1-metal+metal*br);specG+=l.g*spec*(1-metal+metal*bg);specB+=l.b*spec*(1-metal+metal*bb);}
      }
      let r=material?.isMeshBasicMaterial?br:br*ar*(1-.36*metal)+specR+er;
      let g=material?.isMeshBasicMaterial?bg:bg*ag*(1-.36*metal)+specG+eg;
      let b=material?.isMeshBasicMaterial?bb:bb*ab*(1-.36*metal)+specB+eb;
      if(fog){const f=clamp((dist-fog.near)/(fog.far-fog.near));r+=(fog.color.r-r)*f;g+=(fog.color.g-g)*f;b+=(fog.color.b-b)*f;}
      p[k+4]=r;p[k+5]=g;p[k+6]=b;
      let u=c.uvs[i*2],v=c.uvs[i*2+1];
      if(textureMatrix){const q=textureMatrix;const a=u;u=q[0]*a+q[3]*v+q[6];v=q[1]*a+q[4]*v+q[7];}
      p[k+7]=u;p[k+8]=v;
      if(useShadow){p[k+9]=sm[0]*x+sm[4]*y+sm[8]*z+sm[12];p[k+10]=sm[1]*x+sm[5]*y+sm[9]*z+sm[13];p[k+11]=sm[2]*x+sm[6]*y+sm[10]*z+sm[14];}
    }
  }
  function projected(source,at,dest,sizeX,sizeY){
    const iw=1/source[at+3];
    dest[0]=(source[at]*iw*.5+.5)*sizeX;dest[1]=(.5-source[at+1]*iw*.5)*sizeY;dest[2]=source[at+2]*iw;dest[3]=iw;
    for(let j=4;j<STRIDE;j++)dest[j]=source[at+j];
    for(let j=7;j<=11;j++)dest[j]*=iw;
  }
  function shadowTriangle(a,b,c){
    let area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<.00001)return;
    if(area<0){const q=b;b=c;c=q;area=-area;}
    const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(shadowSize-1,Math.ceil(Math.max(a[0],b[0],c[0])));
    const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(shadowSize-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    if(minX>maxX||minY>maxY)return;
    const ax=b[1]-c[1],ay=c[0]-b[0],bx=c[1]-a[1],by=a[0]-c[0],cx=a[1]-b[1],cy=b[0]-a[0];
    const inv=1/area,px=minX+.5,py=minY+.5;
    let e0=(ax*(px-b[0])+ay*(py-b[1])),e1=(bx*(px-c[0])+by*(py-c[1])),e2=(cx*(px-a[0])+cy*(py-a[1]));
    for(let y=minY;y<=maxY;y++){let v0=e0,v1=e1,v2=e2,off=y*shadowSize+minX;for(let x=minX;x<=maxX;x++,off++,v0+=ax,v1+=bx,v2+=cx){if(v0<0||v1<0||v2<0)continue;const z=(v0*a[2]+v1*b[2]+v2*c[2])*inv;if(z>=-1&&z<=1&&z<shadowDepth[off])shadowDepth[off]=z;}e0+=ay;e1+=by;e2+=cy;}
    info.software.shadowTriangles++;
  }
  function raster(a,b,c,material,texture,receivesShadow){
    let area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    if(!Number.isFinite(area)||Math.abs(area)<.015)return;
    // Canvas y goes downward: a front-facing CCW GL triangle has negative area.
    if(material.side!==T.DoubleSide&&((material.side===T.BackSide)?area<0:area>0))return;
    if(area<0){const q=b;b=c;c=q;area=-area;}
    const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
    const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    if(minX>maxX||minY>maxY)return;
    info.render.triangles++;
    const inv=1/area,ax=b[1]-c[1],ay=c[0]-b[0],bx=c[1]-a[1],by=a[0]-c[0],cx=a[1]-b[1],cy=b[0]-a[0];
    const px=minX+.5,py=minY+.5;
    let e0=ax*(px-b[0])+ay*(py-b[1]),e1=bx*(px-c[0])+by*(py-c[1]),e2=cx*(px-a[0])+cy*(py-a[1]);
    const opacity=clamp(material.opacity??1),hasAlpha=opacity<.999,shadow=useShadow&&receivesShadow;
    // Receiver-plane depth correction prevents diagonal self-shadow stripes on
    // broad slanted surfaces. A single large constant bias would erase the
    // thin-layer/contact shadows that matter to this film.
    let slopeX=0,slopeY=0;
    if(shadow){
      const x0=a[9]/a[3]*shadowSize*.5,y0=-a[10]/a[3]*shadowSize*.5,z0=a[11]/a[3];
      const x1=b[9]/b[3]*shadowSize*.5-x0,y1=-b[10]/b[3]*shadowSize*.5-y0,z1=b[11]/b[3]-z0;
      const x2=c[9]/c[3]*shadowSize*.5-x0,y2=-c[10]/c[3]*shadowSize*.5-y0,z2=c[11]/c[3]-z0;
      const d=x1*y2-x2*y1;
      if(Math.abs(d)>.00001){slopeX=clamp((z1*y2-z2*y1)/d,-.5,.5);slopeY=clamp((x1*z2-x2*z1)/d,-.5,.5);}
    }
    const data=texture?.data,tw=texture?.width,th=texture?.height;
    const za=a[2]*inv,zb=b[2]*inv,zc=c[2]*inv;
    const ra=a[4]*inv,rb=b[4]*inv,rc=c[4]*inv,ga=a[5]*inv,gb=b[5]*inv,gc=c[5]*inv,ba=a[6]*inv,bb=b[6]*inv,bc=c[6]*inv;
    const ia=a[3]*inv,ib=b[3]*inv,ic=c[3]*inv;
    const dz=ax*za+bx*zb+cx*zc,dr=ax*ra+bx*rb+cx*rc,dg=ax*ga+bx*gb+cx*gc,db=ax*ba+bx*bb+cx*bc,di=ax*ia+bx*ib+cx*ic;
    const du=(ax*a[7]+bx*b[7]+cx*c[7])*inv,dv=(ax*a[8]+bx*b[8]+cx*c[8])*inv;
    const dsx=(ax*a[9]+bx*b[9]+cx*c[9])*inv,dsy=(ax*a[10]+bx*b[10]+cx*c[10])*inv,dsz=(ax*a[11]+bx*b[11]+cx*c[11])*inv;
    const depthTest=material.depthTest!==false,depthWrite=material.depthWrite!==false&&!hasAlpha;
    for(let y=minY;y<=maxY;y++){
      // Solve the three edge inequalities once per scanline. Long thin rails,
      // wafer rings and lettering no longer visit their entire bounding box.
      let lo=0,hi=maxX-minX;
      if(ax>0)lo=Math.max(lo,Math.ceil((-.000001-e0)/ax));else if(ax<0)hi=Math.min(hi,Math.floor((-.000001-e0)/ax));else if(e0<-.000001)hi=-1;
      if(bx>0)lo=Math.max(lo,Math.ceil((-.000001-e1)/bx));else if(bx<0)hi=Math.min(hi,Math.floor((-.000001-e1)/bx));else if(e1<-.000001)hi=-1;
      if(cx>0)lo=Math.max(lo,Math.ceil((-.000001-e2)/cx));else if(cx<0)hi=Math.min(hi,Math.floor((-.000001-e2)/cx));else if(e2<-.000001)hi=-1;
      let offset=y*width+minX+lo;
      let z=e0*za+e1*zb+e2*zc+lo*dz,R=e0*ra+e1*rb+e2*rc+lo*dr,G=e0*ga+e1*gb+e2*gc+lo*dg,B=e0*ba+e1*bb+e2*bc+lo*db,I=e0*ia+e1*ib+e2*ic+lo*di;
      let U=(e0*a[7]+e1*b[7]+e2*c[7])*inv+lo*du,V=(e0*a[8]+e1*b[8]+e2*c[8])*inv+lo*dv;
      let SX=(e0*a[9]+e1*b[9]+e2*c[9])*inv+lo*dsx,SY=(e0*a[10]+e1*b[10]+e2*c[10])*inv+lo*dsy,SZ=(e0*a[11]+e1*b[11]+e2*c[11])*inv+lo*dsz;
      for(let x=lo;x<=hi;x++,offset++,z+=dz,R+=dr,G+=dg,B+=db,I+=di,U+=du,V+=dv,SX+=dsx,SY+=dsy,SZ+=dsz){
        if(z< -1||z>1||(depthTest&&z>depth[offset]+1e-7))continue;
        let r=R,g=G,bv=B,alpha=opacity;
        const iw=(texture||shadow)?1/I:0;
        if(texture){
          let u=U*iw,v=V*iw;
          u=texture.repeatS?u-Math.floor(u):clamp(u);v=texture.repeatT?v-Math.floor(v):clamp(v);if(texture.flipY)v=1-v;
          const tx=Math.min(tw-1,(u*tw)|0),ty=Math.min(th-1,(v*th)|0),q=(ty*tw+tx)*4;
          r*=colorCache[data[q]];g*=colorCache[data[q+1]];bv*=colorCache[data[q+2]];alpha*=data[q+3]/255;
          if(alpha<(material.alphaTest||.001))continue;
        }
        if(shadow){
          const sx=(SX*iw*.5+.5)*shadowSize,sy=(.5-SY*iw*.5)*shadowSize,sz=SZ*iw;
          const ix=Math.floor(sx-.5),iy=Math.floor(sy-.5);
          if(ix>=1&&ix<shadowSize-1&&iy>=1&&iy<shadowSize-1){const j=iy*shadowSize+ix,bias=.0009;let s=0;
            const reference=sz+slopeX*(ix+.5-sx)+slopeY*(iy+.5-sy)-bias;
            const fx=sx-.5-ix,fy=sy-.5-iy;
            s+=(reference>shadowDepth[j]?1:0)*(1-fx)*(1-fy);s+=(reference+slopeX>shadowDepth[j+1]?1:0)*fx*(1-fy);
            s+=(reference+slopeY>shadowDepth[j+shadowSize]?1:0)*(1-fx)*fy;s+=(reference+slopeX+slopeY>shadowDepth[j+shadowSize+1]?1:0)*fx*fy;
            const f=1-s*.46;r*=f;g*=f;bv*=f;
          }
        }
        let cr=shadeLUT[r<0?0:r>=8?16384:(r*2048+.5)|0],cg=shadeLUT[g<0?0:g>=8?16384:(g*2048+.5)|0],cb=shadeLUT[bv<0?0:bv>=8?16384:(bv*2048+.5)|0];
        if(hasAlpha||alpha<.999){const q=offset*4;cr=Math.round(cr*alpha+imageData.data[q]*(1-alpha));cg=Math.round(cg*alpha+imageData.data[q+1]*(1-alpha));cb=Math.round(cb*alpha+imageData.data[q+2]*(1-alpha));}
        pixels[offset]=littleEndian?((255<<24)|(cb<<16)|(cg<<8)|cr)>>>0:((cr<<24)|(cg<<16)|(cb<<8)|255)>>>0;
        if(depthWrite)depth[offset]=z;
      }
      e0+=ay;e1+=by;e2+=cy;
    }
  }
  function emit(a,b,c,material,texture,receivesShadow,shadowOnly){
    if(shadowOnly){shadowTriangle(a,b,c);return;}
    if(material.transparent){
      const index=transparent.length,item=transparentPool[index]||(transparentPool[index]={v:new Float64Array(STRIDE*3)});
      item.v.set(a,0);item.v.set(b,STRIDE);item.v.set(c,STRIDE*2);item.material=material;item.texture=texture;item.receivesShadow=receivesShadow;item.z=(a[2]+b[2]+c[2])/3;transparent.push(item);
    }else raster(a,b,c,material,texture,receivesShadow);
  }
  function triangle(p,ia,ib,ic,material,texture,receivesShadow,shadowOnly){
    const sx=shadowOnly?shadowSize:width,sy=shadowOnly?shadowSize:height;
    const a=ia*STRIDE,b=ib*STRIDE,c=ic*STRIDE;
    const da=p[a+2]+p[a+3],db=p[b+2]+p[b+3],dc=p[c+2]+p[c+3];
    if(da<0&&db<0&&dc<0)return;
    if(da>=0&&db>=0&&dc>=0){projected(p,a,clipA,sx,sy);projected(p,b,clipB,sx,sy);projected(p,c,clipC,sx,sy);emit(clipA,clipB,clipC,material,texture,receivesShadow,shadowOnly);return;}
    // Sutherland–Hodgman against homogeneous near plane z + w >= 0.
    // The viewport bounds in raster() clip left/right/top/bottom exactly.
    let count=0;
    const ids=[a,b,c];
    for(let i=0;i<3;i++){
      const u=ids[i],v=ids[(i+1)%3],du=p[u+2]+p[u+3],dv=p[v+2]+p[v+3];
      if(du>=0){const dest=clipOut[count++];for(let j=0;j<STRIDE;j++)dest[j]=p[u+j];}
      if((du>=0)!==(dv>=0)){const t=du/(du-dv),dest=clipOut[count++];for(let j=0;j<STRIDE;j++)dest[j]=p[u+j]+(p[v+j]-p[u+j])*t;}
    }
    for(let i=1;i<count-1;i++){projected(clipOut[0],0,clipA,sx,sy);projected(clipOut[i],0,clipB,sx,sy);projected(clipOut[i+1],0,clipC,sx,sy);emit(clipA,clipB,clipC,material,texture,receivesShadow,shadowOnly);}
  }
  function drawMesh(o,shadowOnly){
    if(!o.geometry?.attributes?.position||!o.material)return;
    const c=getGeometry(o.geometry),materials=Array.isArray(o.material)?o.material:[o.material];
    const groups=o.geometry.groups.length&&Array.isArray(o.material)?o.geometry.groups:[{start:0,count:c.indices.length,materialIndex:0}];
    const count=o.isInstancedMesh?o.count:1,ic=o.instanceColor?new T.Color():null;
    for(let i=0;i<count;i++){
      world.copy(o.matrixWorld);if(o.isInstancedMesh){o.getMatrixAt(i,instance);world.multiply(instance);if(ic)o.getColorAt(i,ic);}
      const mirrored=world.determinant()<0;
      for(const group of groups){
        const material=materials[group.materialIndex||0];if(!material||material.visible===false||(material.opacity??1)<=0)continue;
        if(shadowOnly&&(!o.castShadow||(material.opacity??1)<.6))continue;
        const texture=shadowOnly?null:getTexture(material.map);project(c,world,material,ic,shadowOnly);
        const start=Math.max(group.start,o.geometry.drawRange.start||0),end=Math.min(c.indices.length,group.start+group.count,(o.geometry.drawRange.start||0)+(o.geometry.drawRange.count??Infinity));
        if(!shadowOnly){opaqueCalls++;info.software.submittedTriangles+=Math.max(0,Math.floor((end-start)/3));}
        for(let j=start;j+2<end;j+=3)triangle(c.projected,c.indices[j],c.indices[j+(mirrored?2:1)],c.indices[j+(mirrored?1:2)],material,texture,o.receiveShadow,shadowOnly);
      }
    }
  }
  const diagnosticContext={
    RGBA:0x1908,UNSIGNED_BYTE:0x1401,RENDERER:0x1f01,
    getParameter(p){return p===this.RENDERER?'S1E01 CPU 3D / Canvas 2D (not WebGL)':null;},
    readPixels(x,y,w,h,format,type,out){
      if(format!==this.RGBA||type!==this.UNSIGNED_BYTE)throw new Error('Software readback supports RGBA/UNSIGNED_BYTE only');
      if(out.length<w*h*4)throw new Error('Readback destination is too short');
      const src=ctx.getImageData(x,height-y-h,w,h).data;
      for(let row=0;row<h;row++)out.set(src.subarray((h-1-row)*w*4,(h-row)*w*4),row*w*4);
    }
  };
  const renderer={
    isSoftwareRenderer:true,backendLabel:'CPU 3D · Canvas fallback',domElement:canvas,info,
    shadowMap:{enabled:true,type:null},toneMapping:null,toneMappingExposure:1,outputColorSpace:T.SRGBColorSpace,
    setPixelRatio(value){pixelRatio=clamp(Number(value)||1,.25,2);allocate();},getPixelRatio(){return pixelRatio;},
    setSize(w,h,updateStyle=false){logicalWidth=Math.max(1,Number(w)||1);logicalHeight=Math.max(1,Number(h)||1);allocate();if(updateStyle&&canvas.style){canvas.style.width=logicalWidth+'px';canvas.style.height=logicalHeight+'px';}},
    getSize(target){return target.set(logicalWidth,logicalHeight);},getDrawingBufferSize(target){return target.set(width,height);},
    getContext(){return diagnosticContext;},
    render(scene,camera){
      if(disposed)throw new Error('Software renderer was disposed');
      scene.updateMatrixWorld();camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);collect(scene,camera);toneTable();
      info.render.triangles=0;info.render.calls=0;info.software.submittedTriangles=0;info.software.shadowTriangles=0;opaqueCalls=0;meshCount=0;transparent.length=0;meshList.length=0;
      depth.fill(Infinity);pixels.fill(pack(srgb(background[0]),srgb(background[1]),srgb(background[2])));
      const vm=camera.matrixWorldInverse.elements;
      scene.traverseVisible(o=>{
        if(!o.isMesh||!o.geometry?.attributes?.position||!o.layers.test(camera.layers))return;
        const c=getGeometry(o.geometry).center,m=o.matrixWorld.elements;
        const x=m[0]*c[0]+m[4]*c[1]+m[8]*c[2]+m[12],y=m[1]*c[0]+m[5]*c[1]+m[9]*c[2]+m[13],z=m[2]*c[0]+m[6]*c[1]+m[10]*c[2]+m[14];
        const i=meshList.length,item=meshPool[i]||(meshPool[i]={});item.object=o;item.depth=-(vm[2]*x+vm[6]*y+vm[10]*z+vm[14]);meshList.push(item);
      });
      if(useShadow)for(const item of meshList)drawMesh(item.object,true);
      // Front-to-back opaque submission reduces shaded overdraw; actual
      // occlusion is still per-pixel z-buffered. Transparency is sorted later.
      meshList.sort((a,b)=>a.object.renderOrder-b.object.renderOrder||a.depth-b.depth);
      for(const item of meshList){meshCount++;drawMesh(item.object,false);}
      transparent.sort((a,b)=>b.z-a.z);
      for(const item of transparent){const v=item.v;raster(v.subarray(0,STRIDE),v.subarray(STRIDE,STRIDE*2),v.subarray(STRIDE*2,STRIDE*3),item.material,item.texture,item.receivesShadow);}
      info.render.calls=opaqueCalls;info.software.meshes=meshCount;
      // Reset all presentation state. No state is carried from a previous frame.
      ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.putImageData(imageData,0,0);
    },
    dispose(){disposed=true;transparent.length=0;transparentPool.length=0;}
  };
  allocate();return renderer;
}
