import bpy, math, random, sys
from mathutils import Vector
from pathlib import Path
out=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path('/workspace/work/media/S1E01');out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.use_denoising=False;s.render.resolution_x=1280;s.render.resolution_y=720;s.render.resolution_percentage=100;s.render.fps=24;s.frame_start=1;s.frame_end=144
s.world.color=(.12,.15,.18)
def mat(n,c,metal=0,rough=.4):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
white=mat('Powder coated warm porcelain',(.64,.69,.72),.35,.3);dark=mat('Black anodized aluminum',(.018,.028,.04),.7,.25);steel=mat('Brushed stainless',(.28,.34,.38),.85,.27);floor=mat('Cleanroom epoxy',(.12,.19,.23),.3,.25);red=mat('TSMC red contextual lettering',(.64,.015,.025),.2,.3);gold=mat('Contact gold',(.6,.32,.07),.8,.2);glass=mat('Amber polycarbonate cassette',(.18,.075,.018),.35,.2)
def box(n,loc,scale,m,bevel=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel: b=o.modifiers.new('Machined edge radii','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def cyl(n,loc,r,depth,m,verts=64):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=n;o.data.materials.append(m);b=o.modifiers.new('Rolled edges','BEVEL');b.width=.008;b.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
def text(t,loc,size,m,rot=(math.pi/2,0,0)):
 cu=bpy.data.curves.new('Etched lettering','FONT');cu.body=t;cu.size=size;cu.extrude=.0004;o=bpy.data.objects.new(t,cu);s.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;o.data.materials.append(m);return o
def light(n,loc,power,color,size,target):
 d=bpy.data.lights.new(n,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new(n,d);s.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
box('Floor',(0,1,-.12),(18,20,.2),floor)
for x in range(-8,9,2):box('Floor expansion joint',(x,1,-.012),(.012,20,.008),dark,0)
for y in range(-8,12,2):box('Floor expansion joint',(0,y,-.01),(18,.012,.008),dark,0)
# Detailed production tool shell, load face, split doors, gaskets, fasteners and exhaust.
for x in [-3.8,0,3.8]:
 box('Process tool main housing',(x,3.4,1.75),(3.3,2.5,3.5),white,.10)
 box('Tool base plinth',(x,3.2,.16),(3.35,2.6,.3),dark)
 box('Recessed load bay',(x,2.12,1.62),(2.9,.12,2.45),dark,.08)
 box('Chamber service door',(x+.6,2.025,1.7),(1.45,.08,2.1),steel)
 for dx in [-.67,.67]:
  box('Door seal',(x+.6+dx,1.974,1.7),(.025,.02,2),dark,.005)
  for z in [.8,2.5]:
   bolt=cyl('Captive screw',(x+.6+dx,1.95,z),.025,.018,dark,16);bolt.rotation_euler.x=math.pi/2
 box('Load port deck',(x-1,1.4,.95),(1.25,1.55,.16),steel)
 box('Load port pedestal',(x-1,1.8,.48),(.65,.75,.95),white)
 box('Cassette back',(x-1,1.87,1.55),(.82,.07,.95),glass)
 for dx in [-.43,.43]:
  box('Cassette structural side',(x-1+dx,1.52,1.55),(.06,.75,.95),glass)
  for z in range(11):box('Cassette wafer slot',(x-1+dx,1.49,1.15+z*.07),(.11,.7,.018),dark,.004)
 for z in range(8):cyl('Stored silicon wafer',(x-1,1.5,1.18+z*.07),.36,.006,steel)
 box('Cassette bridge handle',(x-1,1.5,2.08),(.9,.10,.08),dark)
 box('Tool vent panel',(x+.7,2.05,.48),(1.3,.04,.30),dark)
 for z in range(6):box('Louver',(x+.7,2.015,.37+z*.045),(1.2,.04,.018),steel,.002)
 box('Touchscreen surround',(x+1.08,1.98,2.55),(.58,.08,.45),dark)
 screen=mat('Quiet green display '+str(x),(.02,.16,.15),.2,.3);box('Touchscreen',(x+1.08,1.93,2.55),(.49,.01,.34),screen)
 text('PROCESS / READY',(x+.86,1.915,2.58),.035,white)
 text('LOAD PORT  /  '+str(int(x+5)),(x-1.42,1.91,2.29),.075,white)
 cyl('Exhaust duct',(x,3.4,3.7),.3,.5,steel)
# service room architecture
box('Rear wall',(0,5.4,2.1),(18,.2,4.4),white)
for x in [-7,-5,-3,-1,1,3,5,7]:
 box('Ceiling HEPA frame',(x,1.2,4.45),(1.8,2.8,.10),steel)
 for y in range(12):box('HEPA pleats',(x,.05+y*.21,4.38),(1.65,.025,.03),white,.002)
 light('Overhead softbox',(x,1,4.25),160,(.72,.84,1),1.5,(x,1,0))
box('Facility sign backing',(-4.6,1.98,3.1),(1.55,.05,.48),white)
text('tsmc',(-5.2,1.941,3.08),.30,red)
text('TAIWAN  /  HSINCHU',(-5.17,1.936,2.96),.06,dark)
# wafer with thousands of etched die edges, planar geometry with thin film interference material
wafermat=mat('Silicon thin film interference',(.06,.10,.22),.86,.17)
p=wafermat.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.55;p.inputs['Coat Roughness'].default_value=.1
tex=wafermat.node_tree.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=3
ramp=wafermat.node_tree.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.015,.05,.1,1);ramp.color_ramp.elements[1].color=(.28,.13,.12,1);wafermat.node_tree.links.new(tex.outputs['Fac'],ramp.inputs[0]);wafermat.node_tree.links.new(ramp.outputs['Color'],p.inputs['Base Color'])
wafer=cyl('Hero wafer',(-1,.68,1.76),.65,.012,wafermat,192)
# wafer surface grid uses mesh in local wafer frame
verts=[];faces=[]
for ix in range(-12,13):
 for iy in range(-12,13):
  x=ix*.052;y=iy*.052
  if x*x+y*y<.60**2:
   for dx,dy,w,h in [(0,0,.048,.0015),(0,0,.0015,.048),(.009,.012,.025,.001),(.01,.024,.018,.001)]:
    j=len(verts);verts.extend([(x+dx,y+dy,.007),(x+dx+w,y+dy,.007),(x+dx+w,y+dy+h,.007),(x+dx,y+dy+h,.007)]);faces.append((j,j+1,j+2,j+3))
me=bpy.data.meshes.new('Die streets and metallization');me.from_pydata(verts,[],faces);o=bpy.data.objects.new('Etched die array',me);s.collection.objects.link(o);o.data.materials.append(gold);o.parent=wafer
# end effector with two prongs supports wafer and moves it into transfer bay
robot=box('Transfer blade',(-1,.68,1.72),(.24,1.10,.028),steel,.018)
for dx in [-.18,.18]:
 q=box('Ceramic fork',(-1+dx,.79,1.735),(.045,.60,.022),white,.012);q.parent=robot;q.matrix_parent_inverse=robot.matrix_world.inverted()
base=cyl('Robot wrist',(-1,.16,1.65),.13,.1,dark)
for ob in [wafer,robot,base]:
 start=ob.location.copy();ob.keyframe_insert('location',frame=1)
 ob.location.y=start.y+.72;ob.keyframe_insert('location',frame=96)
 ob.location.z=start.z-(.04 if ob==wafer else .08);ob.keyframe_insert('location',frame=112)
 if ob!=wafer:ob.location.y=start.y
 ob.keyframe_insert('location',frame=144)
 for fc in ob.animation_data.action.fcurves:
  for kp in fc.keyframe_points:kp.interpolation='BEZIER'
box('Transfer robot floor anchor',(-1,.1,.08),(.75,1.3,.16),dark)
box('Robot structural column',(-1,.1,.78),(.28,.35,1.4),steel)
box('Linear transfer guide',(-1,.45,1.46),(.22,1.5,.14),dark)
box('Linear guide race',(-1,.45,1.55),(.12,1.48,.025),steel)
# cinematic camera, dedicated focus on wafer
bpy.ops.object.camera_add(location=(1.15,-2.75,2.92));cam=bpy.context.object;cam.name='Macro transfer camera';s.camera=cam;cam.data.lens=42;cam.data.dof.use_dof=True;cam.data.dof.focus_object=wafer;cam.data.dof.aperture_fstop=4.5
for fr,pos,target in [(1,(1.15,-2.75,2.92),(-1,1.05,1.65)),(144,(.75,-2.40,2.72),(-1,1.58,1.7))]:
 cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert('location',frame=fr);cam.keyframe_insert('rotation_euler',frame=fr)
light('Wafer warm rim',(-3,-.8,3),260,(1,.67,.37),2,(-1,1,1.7));light('Broad key',(2,-1,4.5),400,(.65,.82,1),3,(-1,1,1.7))
wafer.scale=(.55,.55,1)
bpy.data.objects['Facility sign backing'].location=(-.9,1.98,2.48)
bpy.data.objects['tsmc'].location=(-1.45,1.941,2.47)
bpy.data.objects['tsmc'].data.size=.24
bpy.data.objects['TAIWAN  /  HSINCHU'].location=(-1.43,1.936,2.36)
s.view_settings.view_transform='AgX';s.render.image_settings.file_format='PNG';s.render.filepath=str(out/'hero-still.png');s.frame_set(60)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'hero.blend'));bpy.ops.export_scene.gltf(filepath=str(out/'web/scene.glb'),export_format='GLB',export_cameras=True,export_lights=False,export_animations=True)
if '--skip-still' not in sys.argv: bpy.ops.render.render(write_still=True)
