/** Actual horizontal mesh-cap contact, not an AABB or nominal-radius test. */
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function hull(points){
  const sorted=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),unique=[];
  for(const p of sorted)if(!unique.length||Math.hypot(p[0]-unique.at(-1)[0],p[1]-unique.at(-1)[1])>1e-10)unique.push(p);
  if(unique.length<3)return unique;
  const half=pts=>{const out=[];for(const p of pts){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=1e-14)out.pop();out.push(p);}return out;};
  return half(unique).slice(0,-1).concat(half(unique.slice().reverse()).slice(0,-1));
}
function clipConvex(subject,clip){
  let result=subject;
  for(let i=0;i<clip.length&&result.length;i++){
    const a=clip[i],b=clip[(i+1)%clip.length],input=result;result=[];
    let previous=input.at(-1),previousD=cross(a,b,previous);
    for(const current of input){
      const currentD=cross(a,b,current),inside=currentD>=-1e-13,previousInside=previousD>=-1e-13;
      if(inside!==previousInside){const t=previousD/(previousD-currentD);result.push([previous[0]+t*(current[0]-previous[0]),previous[1]+t*(current[1]-previous[1])]);}
      if(inside)result.push(current);previous=current;previousD=currentD;
    }
  }
  return result;
}
function cap(T,mesh,side){
  mesh.updateWorldMatrix(true,false);const a=mesh.geometry.attributes.position,p=new T.Vector3(),vertices=[];
  for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);vertices.push([p.x,p.y,p.z]);}
  const y=side==='bottom'?Math.min(...vertices.map(v=>v[1])):Math.max(...vertices.map(v=>v[1]));
  return {y,polygon:hull(vertices.filter(v=>Math.abs(v[1]-y)<1e-8).map(v=>[v[0],v[2]]))};
}
export function diskRailContact(T,disk,rail){
  const diskCap=cap(T,disk,'bottom'),railCap=cap(T,rail,'top');
  const intersection=diskCap.polygon.length>=3&&railCap.polygon.length>=3?clipConvex(diskCap.polygon,railCap.polygon):[];
  let twiceArea=0;for(let i=0;i<intersection.length;i++){const a=intersection[i],b=intersection[(i+1)%intersection.length];twiceArea+=a[0]*b[1]-b[0]*a[1];}
  const overlapArea=Math.abs(twiceArea)/2,verticalGap=diskCap.y-railCap.y;
  return {waferBottomY:diskCap.y,railTopY:railCap.y,verticalGap,overlapArea,
    diskCapVertices:diskCap.polygon.length,railCapVertices:railCap.polygon.length,
    contact:Math.abs(verticalGap)<1e-7&&overlapArea>1e-8,intersection};
}

/** Prove shelf-end corners lie inside the actual rounded wall triangle mesh. */
export function railHousingAttachment(T,rail,housing){
  rail.updateWorldMatrix(true,false);housing.updateWorldMatrix(true,false);
  const side=rail.userData.side,parameters=rail.geometry.parameters,parent=rail.parent;
  const direction=new T.Vector3(side,0,0).transformDirection(parent.matrixWorld),forward=new T.Raycaster(),reverse=new T.Raycaster();
  const probes=[];
  for(const dy of[-parameters.height/2+1e-8,0,parameters.height/2-1e-8])for(const dz of[-parameters.depth/2+1e-8,0,parameters.depth/2-1e-8]){
    const origin=parent.localToWorld(new T.Vector3(0,rail.position.y+dy,rail.position.z+dz));
    const outer=rail.localToWorld(new T.Vector3(side*parameters.width/2,dy,dz));
    const extent=outer.clone().sub(origin).dot(direction);
    forward.set(origin,direction);reverse.set(origin.clone().addScaledVector(direction,1),direction.clone().negate());
    const near=forward.intersectObject(housing,false)[0],far=reverse.intersectObject(housing,false)[0];
    const innerDistance=near?.distance??NaN,outerDistance=far?1-far.distance:NaN,penetration=extent-innerDistance;
    probes.push({dy,dz,innerDistance,outerDistance,shelfExtent:extent,penetration,embedded:Number.isFinite(penetration)&&penetration>1e-7&&extent<outerDistance-1e-7});
  }
  return {shelfId:rail.id,housingId:housing.id,side,attached:probes.every(p=>p.embedded),minEmbed:Math.min(...probes.map(p=>p.penetration)),probes};
}
