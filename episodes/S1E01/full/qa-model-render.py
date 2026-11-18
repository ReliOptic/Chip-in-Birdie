"""Render exported film geometry for inspection. Never substitute for WebGL QA."""
import bpy
import json
import math
import os
import sys
from mathutils import Vector

paths = sys.argv[sys.argv.index('--') + 1:]
for source in paths:
    with open(source, encoding='utf8') as f:
        data = json.load(f)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 16
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.world = bpy.data.worlds.new('Inspection studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.14,.18,.22,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .45
    for i, part in enumerate(data['meshes']):
        mesh = bpy.data.meshes.new('geometry')
        mesh.from_pydata(part['vertices'], [], part['faces'])
        mesh.update()
        obj = bpy.data.objects.new('part-' + str(i), mesh)
        scene.collection.objects.link(obj)
        m = part['material']
        mat = bpy.data.materials.new('surface')
        mat.use_nodes = True
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = (*m['color'], 1)
        shader.inputs['Metallic'].default_value = m['metalness']
        shader.inputs['Roughness'].default_value = m['roughness']
        shader.inputs['Alpha'].default_value = m['opacity']
        shader.inputs['Emission Color'].default_value = (*m['emissive'],1)
        shader.inputs['Emission Strength'].default_value = m['emissiveIntensity']
        if part['uv']:
            uv = mesh.uv_layers.new(name='UVMap')
            for loop in mesh.loops:
                vi=loop.vertex_index
                uv.data[loop.index].uv=part['uv'][2*vi:2*vi+2]
        if m['texture']:
            tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
            tex.image=bpy.data.images.load(os.path.join(os.path.dirname(source), m['texture']), check_existing=True)
            mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
        obj.data.materials.append(mat)
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0,0,-.23))
    floor=bpy.context.object
    fm=bpy.data.materials.new('Floor'); fm.diffuse_color=(.012,.022,.028,1); fm.use_nodes=True
    fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.012,.022,.028,1)
    fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.86
    floor.data.materials.append(fm)
    def light(name, location, energy, size, color):
        ld=bpy.data.lights.new(name,'AREA');ld.energy=energy;ld.shape='DISK';ld.size=size;ld.color=color
        ob=bpy.data.objects.new(name,ld);scene.collection.objects.link(ob);ob.location=location
        ob.rotation_euler=(Vector((0,0,.2))-ob.location).to_track_quat('-Z','Y').to_euler()
    light('Key',(-4,-6,9),1800,5,(1,.86,.68))
    light('Rim',(4,5,6),1400,4,(.62,.76,1))
    light('Fill',(3,-5,3),600,5,(.7,.9,1))
    cd=bpy.data.cameras.new('Exact model inspection camera');camera=bpy.data.objects.new('Camera',cd);scene.collection.objects.link(camera)
    camera.location=data['camera']['position']
    camera.rotation_euler=(Vector(data['camera']['target'])-camera.location).to_track_quat('-Z','Y').to_euler()
    cd.sensor_fit='VERTICAL';cd.sensor_height=24;cd.lens=12/math.tan(math.radians(data['camera']['fov'])/2)
    scene.camera=camera
    scene.render.filepath=os.path.splitext(source)[0]+'.png'
    bpy.ops.render.render(write_still=True)
    print('MODEL_INSPECTION_ONLY',scene.render.filepath,flush=True)
