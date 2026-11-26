#!/usr/bin/env python3
"""Generate cad/parts/*.py for the EUV source twin from one traced table."""
import pprint
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
N = ("INFERRED-NO-SOURCE", "engineering envelope; no dimensioned source read")
def P(v, s, g, src=N, note=""):
    return {"value": v, "sigma": s, "grade": g, "source_id": src[0], "locator": src[1] + (" — " + note if note else "")}
E1, E2, E3 = "E1_measured", "E2_photomatched", "E3_inferred"
S37a = ("S037", "patent description background: plasma→collector ~15 cm (patent_proposal)")
S37b = ("S037", "patent description: plasma→intermediate location 1–2 m (patent_proposal)")
S04 = ("S004", "§7 Fig.16: collector collection solid angle 5.5 sr (NXE:3100, family)")
S01c = ("S001", "slide 40: ellipsoidal normal-incidence collector, plasma at F1, IF at F2")
S04h = ("S004", "§4: drive laser enters through the collector's central aperture")
STEEL = {"name": "stainless steel vacuum vessel", "pbr": {"color": [0.70, 0.71, 0.72, 1], "metallic": 1.0, "roughness": 0.35}}
MIRROR = {"name": "graded Mo/Si multilayer on polished substrate", "pbr": {"color": [0.55, 0.60, 0.72, 1], "metallic": 1.0, "roughness": 0.08}}
DARK = {"name": "anodised/steel housing", "pbr": {"color": [0.30, 0.31, 0.33, 1], "metallic": 0.6, "roughness": 0.5}}
GEO = dict(f1_vertex=P(150, 30, E3, S37a), f1_f2=P(1500, 250, E3, S37b, "mid of 1–2 m"), solid_angle_sr=P(5.5, 0.3, E2, S04),
           hole_half_angle=P(6, 2, E3, N, "laser aperture half-angle"))
PARTS = {
 "p-collector": dict(mesh="collector", ct="ellipsoidal_normal_incidence_collector", crit=True, mat={**MIRROR, "src": "S001"}, ext=False, axis=[-1, 0, 0],
   params={**GEO, "thickness": P(25, 8, E3)},
   body="""import math
    a0, a1 = math.radians(p['hole_half_angle']), rim_angle(p)
    n = 48
    front = [(-rho(p, a0 + (a1 - a0) * i / n) * math.cos(a0 + (a1 - a0) * i / n), rho(p, a0 + (a1 - a0) * i / n) * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    back = [(-(r + p['thickness']) * math.cos(ph), (r + p['thickness']) * math.sin(ph)) for ph, r in [(a0 + (a1 - a0) * i / n, rho(p, a0 + (a1 - a0) * i / n)) for i in range(n, -1, -1)]]
    return revolve(front + back)"""),
 "p-vessel": dict(mesh="source_vessel", ct="vacuum_vessel", crit=False, mat={**STEEL, "src": "S001"}, ext=True, axis=[0, 1, 0],
   params=dict(x0=P(-140, 40, E3), x1=P(1500, 250, E3, S37b, "ends at IF"), r0=P(360, 60, E3), r1=P(70, 20, E3), wall=P(10, 4, E3)),
   body="return revolve([(p['x0'], p['r0'] - p['wall']), (p['x1'], p['r1'] - p['wall']), (p['x1'], p['r1']), (p['x0'], p['r0'])])"),
 "p-vessel-rear": dict(mesh="vessel_rear_flange", ct="vacuum_flange", crit=False, mat={**STEEL, "src": "S001"}, ext=True, axis=[-1, 0, 0],
   params=dict(x0=P(-140, 40, E3), r0=P(360, 60, E3), t=P(20, 6, E3), r_port=P(90, 20, E3, S04h, "laser port")),
   body="return revolve([(p['x0'] - p['t'], p['r_port']), (p['x0'], p['r_port']), (p['x0'], p['r0'] + 30), (p['x0'] - p['t'], p['r0'] + 30)])"),
 "p-intermediate-focus": dict(mesh="if_aperture", ct="intermediate_focus_aperture", crit=True, mat={**DARK, "src": "S001"}, ext=False, axis=[1, 0, 0],
   params=dict(x_if=P(1500, 250, E3, S37b, "IF = second focus (S001 slide 40)"), r_ap=P(6, 3, E3), r_out=P(90, 20, E3), t=P(12, 4, E3)),
   body="return revolve([(p['x_if'], p['r_ap']), (p['x_if'] + p['t'], p['r_ap'] + 4), (p['x_if'] + p['t'], p['r_out']), (p['x_if'], p['r_out'])])"),
 "p-final-focus-optics": dict(mesh="final_focus_module", ct="drive_laser_final_focus", crit=True, mat={**DARK, "src": "S004"}, ext=False, axis=[-1, 0, 0],
   params=dict(x0=P(-480, 60, E3, S04h), x1=P(-170, 40, E3, S04h), r=P(75, 20, E3)),
   body="return revolve([(p['x0'], 0), (p['x1'], 0), (p['x1'], p['r'] * 0.6), (p['x1'] - 40, p['r']), (p['x0'], p['r'])])"),
 "p-droplet-generator": dict(mesh="droplet_generator", ct="tin_droplet_generator", crit=True, mat={**DARK, "src": "S001"}, ext=False, axis=[0, 0, 1],
   params=dict(z_tip=P(60, 20, E3), z_body=P(330, 60, E3), body_len=P(240, 60, E3), r_body=P(45, 15, E3), r_nozzle=P(8, 3, E3)),
   body="""import cadquery as cq
    tube = cq.Workplane("XY").workplane(offset=p['z_tip']).circle(p['r_nozzle']).extrude(p['z_body'] - p['z_tip'])
    body = cq.Workplane("XY").workplane(offset=p['z_body']).circle(p['r_body']).extrude(p['body_len'])
    return tube.union(body)"""),
 "p-droplet-catcher": dict(mesh="droplet_catcher", ct="tin_catcher", crit=False, mat={**DARK, "src": "S001"}, ext=False, axis=[0, 0, -1],
   params=dict(z_mouth=P(-90, 30, E3), length=P(320, 60, E3), r=P(30, 10, E3), wall=P(4, 2, E3)),
   body="""import cadquery as cq
    return (cq.Workplane("XY").workplane(offset=p['z_mouth'] - p['length']).circle(p['r']).circle(p['r'] - p['wall']).extrude(p['length']))"""),
 "p-obscuration": dict(mesh="central_obscuration", ct="on_axis_obscuration", crit=False, mat={**DARK, "src": "S005"}, ext=False, axis=[0, 1, 0],
   params=dict(x=P(140, 60, E3), r=P(28, 10, E3), t=P(6, 2, E3), strut_w=P(8, 3, E3)),
   body="""import cadquery as cq
    disk = cq.Workplane("YZ").workplane(offset=p['x']).circle(p['r']).extrude(p['t'])
    strut = cq.Workplane("XY").box(p['t'], 300, p['strut_w']).translate((p['x'] + p['t'] / 2, 150 + p['r'] * 0.5, 0))
    return disk.union(strut)"""),
}
HDR = '"""%s — generated by tools/gen_parts.py; edit the table there."""\nimport os, sys\nsys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))\nfrom _euv import ellipse, rho, rim_angle, revolve  # noqa: E402,F401\n\n'
for pid, d in PARTS.items():
    mat = {k: v for k, v in d["mat"].items() if k != "src"}
    part = {"id": pid, "mesh_object_id": d["mesh"], "feature_id": "f-" + pid[2:], "critical": d["crit"],
            "applies_to": "cymer-asml-lpp-euv-source-nxe3400", "technology_family": "CO2-laser-produced tin plasma EUV source",
            "component_type": d["ct"], "units": "mm", "cad_tool": "CadQuery 2.8 (OCCT) — STEP AP242 for CATIA",
            "material": {**mat, "source_id": d["mat"]["src"], "grade": "E3_inferred"}, "exterior": d["ext"], "assembly_axis": d["axis"]}
    body = d["body"] if d["body"].startswith("    ") or "\n" in d["body"] else d["body"]
    body = ("    " + body) if not body.startswith("    ") else body
    (ROOT / "cad/parts" / f"{pid}.py").write_text(HDR % pid + "PART = " + pprint.pformat(part, width=110) + "\n\nPARAMS = " + pprint.pformat(d["params"], width=110) + "\n\n\ndef build(p):\n" + body + "\n")
print(len(PARTS), "parts")
