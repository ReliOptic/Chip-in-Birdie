#!/usr/bin/env python3
"""Generate cad/parts/<id>.py from one table so every dimension keeps its trace.
Re-run after editing SRC (source ids) or values; build with dta_cad_build.py."""
import json, pprint
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = json.loads((ROOT / "tools" / "sources.json").read_text())  # role -> source_id/locator

def P(v, s, g, role, note=""):
    src = SRC.get(role, {"source_id": "S-INFER", "locator": "proportion from public cutaway"})
    return {"value": v, "sigma": s, "grade": g, "source_id": src["source_id"],
            "locator": (src["locator"] + (" — " + note if note else ""))}

E1, E2, E3 = "E1_measured", "E2_photomatched", "E3_inferred"
TI = {"name": "titanium alloy", "pbr": {"color": [0.62, 0.63, 0.65, 1.0], "metallic": 1.0, "roughness": 0.32}}
AL = {"name": "aluminium/composite nacelle skin, painted", "pbr": {"color": [0.86, 0.87, 0.88, 1.0], "metallic": 0.15, "roughness": 0.42}}
NI = {"name": "nickel superalloy", "pbr": {"color": [0.55, 0.50, 0.46, 1.0], "metallic": 1.0, "roughness": 0.38}}
ST = {"name": "steel", "pbr": {"color": [0.48, 0.49, 0.50, 1.0], "metallic": 1.0, "roughness": 0.45}}
HOT = {"name": "nickel superalloy, heat-tinted", "pbr": {"color": [0.42, 0.34, 0.28, 1.0], "metallic": 1.0, "roughness": 0.5}}

R_TIP = 1549.4 / 2  # 61.0 in fan diameter
PARTS = {
 "p-spinner": dict(mesh="spinner", ctype="spinner_cone", crit=False, mat={**AL, "name": "spinner (composite/aluminium)", "pbr": {"color": [0.92, 0.92, 0.9, 1], "metallic": 0.1, "roughness": 0.35}},
   ext=False, axis=[-1, 0, 0],
   params=dict(r_base=P(235, 25, E3, "hub_tip", "hub/tip ~0.3 of fan radius"), length=P(330, 40, E3, "cutaway"), x_base=P(-40, 20, E3, "cutaway")),
   body="return revolve([(p['x_base']-p['length'], 0), (p['x_base']-p['length']*0.55, p['r_base']*0.62), (p['x_base'], p['r_base']), (p['x_base'], 0)])"),
 "p-fan": dict(mesh="fan_rotor", ctype="fan_rotor_wide_chord", crit=True, mat={**TI, "name": "solid titanium wide-chord blades"}, ext=False, axis=[-1, 0, 0],
   params=dict(n_blades=P(24, 0, E1, "fan_blades"), r_tip=P(R_TIP - 4, 2, E1, "fan_diameter", "61.0 in diameter minus tip gap"),
               r_hub=P(235, 25, E3, "hub_tip"), chord_root=P(190, 30, E3, "cutaway"), chord_tip=P(300, 40, E3, "cutaway", "wide-chord"),
               t_root=P(22, 6, E3, "cutaway"), t_tip=P(6, 2, E3, "cutaway"), stagger_root=P(25, 8, E3, "cutaway", "deg from axial"),
               stagger_tip=P(62, 8, E3, "cutaway", "deg from axial"), x_le=P(0, 10, E3, "cutaway")),
   body="""import cadquery as cq, math
    solids = [shell(p['x_le']-30, p['x_le']+220, 0, p['r_hub'], 0, p['r_hub']*1.08).val()]
    n = int(round(p['n_blades']))
    def section(r, chord, t, stag):
        a = math.radians(stag); c = p['x_le'] + 0.5 * p['chord_root']
        pts = []
        for sx, sz in [(-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)]:
            ax, tz = sx * chord, sz * t
            pts.append(cq.Vector(c + ax * math.cos(a) - tz * math.sin(a), r, ax * math.sin(a) + tz * math.cos(a)))
        return cq.Wire.makePolygon(pts, close=True)
    blade = cq.Solid.makeLoft([section(p['r_hub']-10, p['chord_root'], p['t_root'], p['stagger_root']),
                               section((p['r_hub']+p['r_tip'])/2, (p['chord_root']+p['chord_tip'])/2, (p['t_root']+p['t_tip'])/2, (p['stagger_root']+p['stagger_tip'])/2),
                               section(p['r_tip'], p['chord_tip'], p['t_tip'], p['stagger_tip'])], True)
    for i in range(n):
        solids.append(blade.rotate(cq.Vector(0,0,0), cq.Vector(1,0,0), 360.0 * i / n))
    return cq.Workplane().add(cq.Compound.makeCompound(solids))"""),
 "p-fan-case": dict(mesh="fan_case", ctype="fan_containment_case", crit=True, mat={**AL, "name": "aluminium fan case (containment)", "pbr": {"color": [0.66, 0.67, 0.68, 1], "metallic": 0.85, "roughness": 0.4}},
   ext=False, axis=[0, 1, 0],
   params=dict(r_in=P(R_TIP, 2, E1, "fan_diameter"), wall=P(40, 15, E3, "cutaway"), x0=P(-160, 30, E3, "cutaway"), x1=P(620, 50, E3, "cutaway")),
   body="return shell(p['x0'], p['x1'], p['r_in'], p['r_in']+p['wall'], p['r_in']-20, p['r_in']+p['wall'])"),
 "p-nacelle-inlet": dict(mesh="inlet_cowl", ctype="nacelle_inlet", crit=False, mat=AL, ext=True, axis=[-1, 0, 0],
   params=dict(x_hl=P(-950, 60, E3, "nacelle"), r_hl=P(735, 30, E3, "nacelle", "highlight radius"), r_out=P(930, 40, E3, "nacelle"),
               x_aft=P(-160, 30, E3, "cutaway"), r_throat=P(720, 25, E3, "nacelle")),
   body="""pts = [(p['x_hl'], p['r_hl']), (p['x_hl']+40, p['r_throat']), (p['x_aft'], p['r_throat']+55), (p['x_aft'], p['r_out']),
           (p['x_hl']+300, p['r_out']-10), (p['x_hl']+60, p['r_hl']+110), (p['x_hl']+5, p['r_hl']+40)]
    return revolve(pts)"""),
 "p-thrust-reverser": dict(mesh="fan_cowl_reverser", ctype="cascade_thrust_reverser_sleeve", crit=False, mat=AL, ext=True, axis=[1, 0, 0],
   params=dict(x0=P(-160, 30, E3, "cutaway"), x1=P(1850, 80, E3, "nacelle", "fan nozzle exit"), r_out0=P(930, 40, E3, "nacelle"),
               r_out1=P(790, 40, E3, "nacelle"), r_in0=P(R_TIP + 45, 10, E3, "cutaway"), r_in1=P(760, 40, E3, "nacelle")),
   body="return revolve([(p['x0'], p['r_in0']), (p['x1'], p['r_in1']), (p['x1'], p['r_in1']+12), (p['x0']+900, p['r_out0']-25), (p['x0'], p['r_out0'])])"),
 "p-booster": dict(mesh="booster_lpc", ctype="axial_compressor_rows", crit=True, mat=TI, ext=False, axis=[1, 0, 0],
   params=dict(n_stages=P(3, 0, E1, "booster_stages"), x0=P(260, 30, E3, "cutaway"), pitch=P(80, 15, E3, "cutaway"), width=P(45, 10, E3, "cutaway"),
               hub0=P(265, 25, E3, "cutaway"), hub1=P(285, 25, E3, "cutaway"), tip0=P(345, 25, E3, "cutaway"), tip1=P(330, 25, E3, "cutaway")),
   body="return stage_bands(p['x0'], p['pitch'], p['width'], p['hub0'], p['hub1'], p['tip0'], p['tip1'], int(round(p['n_stages'])))"),
 "p-hpc": dict(mesh="hp_compressor", ctype="axial_compressor_rows", crit=True, mat=TI, ext=False, axis=[1, 0, 0],
   params=dict(n_stages=P(9, 0, E1, "hpc_stages"), x0=P(640, 40, E3, "cutaway"), pitch=P(58, 10, E3, "cutaway"), width=P(32, 8, E3, "cutaway"),
               hub0=P(175, 20, E3, "cutaway"), hub1=P(245, 20, E3, "cutaway"), tip0=P(290, 20, E3, "cutaway"), tip1=P(270, 20, E3, "cutaway")),
   body="return stage_bands(p['x0'], p['pitch'], p['width'], p['hub0'], p['hub1'], p['tip0'], p['tip1'], int(round(p['n_stages'])))"),
 "p-combustor": dict(mesh="combustor", ctype="annular_combustor", crit=True, mat=HOT, ext=False, axis=[1, 0, 0],
   params=dict(x0=P(1190, 40, E3, "cutaway"), x1=P(1450, 40, E3, "cutaway"), r_in=P(230, 20, E3, "cutaway"), r_out=P(335, 20, E3, "cutaway"),
               wall=P(8, 3, E3, "cutaway")),
   body="""import cadquery as cq
    outer = revolve([(p['x0'], p['r_in']+30), (p['x0']+40, p['r_in']), (p['x1'], p['r_in']+20), (p['x1'], p['r_out']-15), (p['x0']+40, p['r_out']), (p['x0'], p['r_out']-30)])
    inner = revolve([(p['x0']+p['wall']+20, p['r_in']+30), (p['x0']+40, p['r_in']+p['wall']), (p['x1']+1, p['r_in']+20+p['wall']), (p['x1']+1, p['r_out']-15-p['wall']), (p['x0']+40, p['r_out']-p['wall']), (p['x0']+p['wall']+20, p['r_out']-30)])
    return outer.cut(inner)"""),
 "p-hpt": dict(mesh="hp_turbine", ctype="axial_turbine_rows", crit=True, mat=HOT, ext=False, axis=[1, 0, 0],
   params=dict(n_stages=P(1, 0, E1, "hpt_stages"), x0=P(1470, 30, E3, "cutaway"), width=P(55, 10, E3, "cutaway"), hub=P(255, 20, E3, "cutaway"), tip=P(345, 20, E3, "cutaway")),
   body="return stage_bands(p['x0'], 70, p['width'], p['hub'], p['hub'], p['tip'], p['tip'], int(round(p['n_stages'])))"),
 "p-lpt": dict(mesh="lp_turbine", ctype="axial_turbine_rows", crit=True, mat=NI, ext=False, axis=[1, 0, 0],
   params=dict(n_stages=P(4, 0, E1, "lpt_stages"), x0=P(1580, 40, E3, "cutaway"), pitch=P(95, 15, E3, "cutaway"), width=P(55, 10, E3, "cutaway"),
               hub0=P(290, 20, E3, "cutaway"), hub1=P(300, 20, E3, "cutaway"), tip0=P(395, 25, E3, "cutaway"), tip1=P(470, 25, E3, "cutaway")),
   body="return stage_bands(p['x0'], p['pitch'], p['width'], p['hub0'], p['hub1'], p['tip0'], p['tip1'], int(round(p['n_stages'])))"),
 "p-core-cowl": dict(mesh="core_cowl", ctype="core_cowl", crit=False, mat={**AL, "pbr": {"color": [0.74, 0.75, 0.76, 1], "metallic": 0.6, "roughness": 0.4}}, ext=True, axis=[0, 1, 0],
   params=dict(x_split=P(230, 30, E3, "cutaway", "splitter"), r_split=P(350, 20, E3, "cutaway"), x1=P(2000, 60, E3, "cutaway"),
               r_max=P(520, 30, E3, "cutaway"), r_end=P(500, 30, E3, "cutaway")),
   body="return revolve([(p['x_split'], p['r_split']), (p['x_split']+250, p['r_split']+5), (p['x1'], p['r_end']-25), (p['x1'], p['r_end']), (1150, p['r_max']), (p['x_split']+120, p['r_split']+80)])"),
 "p-exhaust-nozzle": dict(mesh="core_nozzle", ctype="primary_exhaust_nozzle", crit=False, mat=HOT, ext=True, axis=[1, 0, 0],
   params=dict(x0=P(2000, 60, E3, "cutaway"), x1=P(2330, 60, E3, "cutaway"), r0=P(500, 30, E3, "cutaway"), r1=P(405, 30, E3, "cutaway"), wall=P(10, 4, E3, "cutaway")),
   body="return shell(p['x0'], p['x1'], p['r0']-p['wall']-15, p['r0'], p['r1']-p['wall'], p['r1'])"),
 "p-exhaust-plug": dict(mesh="exhaust_plug", ctype="exhaust_centerbody", crit=False, mat=HOT, ext=False, axis=[1, 0, 0],
   params=dict(x0=P(1990, 40, E3, "cutaway"), r0=P(300, 25, E3, "cutaway"), length=P(620, 60, E3, "cutaway")),
   body="return revolve([(p['x0'], 0), (p['x0'], p['r0']), (p['x0']+p['length']*0.45, p['r0']*0.8), (p['x0']+p['length'], 25), (p['x0']+p['length'], 0)])"),
 "p-lp-shaft": dict(mesh="lp_shaft", ctype="low_pressure_shaft", crit=True, mat=ST, ext=False, axis=[1, 0, 0],
   params=dict(x0=P(-20, 20, E3, "cutaway"), x1=P(2000, 60, E3, "cutaway"), r=P(48, 10, E3, "cutaway"), r_bore=P(30, 8, E3, "cutaway")),
   body="return shell(p['x0'], p['x1'], p['r_bore'], p['r'], p['r_bore'], p['r'])"),
 "p-hp-shaft": dict(mesh="hp_spool", ctype="high_pressure_spool_drum", crit=True, mat=TI, ext=False, axis=[1, 0, 0],
   params=dict(x0=P(630, 40, E3, "cutaway"), x1=P(1530, 40, E3, "cutaway"), r_in=P(80, 15, E3, "cutaway"), r_out=P(175, 20, E3, "cutaway")),
   body="return revolve([(p['x0'], p['r_in']), (p['x1'], p['r_in']), (p['x1'], p['r_out']*1.25), (p['x1']-300, p['r_out']*1.2), (p['x0']+500, p['r_out']*1.3), (p['x0'], p['r_out'])])"),
 "p-gearbox": dict(mesh="accessory_gearbox", ctype="accessory_gearbox", crit=False, mat={"name": "aluminium/magnesium casting", "pbr": {"color": [0.5, 0.52, 0.5, 1], "metallic": 0.7, "roughness": 0.55}},
   ext=False, axis=[0, -1, 0],
   params=dict(length=P(480, 80, E3, "gearbox"), height=P(170, 40, E3, "gearbox"), depth=P(260, 50, E3, "gearbox"), x_c=P(260, 60, E3, "gearbox")),
   body="""import cadquery as cq
    return cq.Workplane("XY").box(p['length'], p['height'], p['depth']).edges("|Z").fillet(25).translate((p['x_c'], -(%.1f + 40 + p['height']/2), 0))""" % R_TIP),
}

HEADER = '"""%s — generated by tools/gen_parts.py; edit the table there, not here."""\nimport os, sys\nsys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))\nfrom _revolve import revolve, shell, stage_bands  # noqa: E402\n\n'

def main():
    out = ROOT / "cad" / "parts"
    for pid, d in PARTS.items():
        part = {"id": pid, "mesh_object_id": d["mesh"], "feature_id": "f-" + pid[2:], "critical": d["crit"],
                "applies_to": "cfm-cfm56-7b-1997-7b27", "technology_family": "two-spool high-bypass separate-flow turbofan",
                "component_type": d["ctype"], "units": "mm", "cad_tool": "CadQuery 2.8 (OCCT) — STEP AP214 for CATIA import",
                "material": {**d["mat"], "source_id": SRC.get("material:" + pid, {}).get("source_id", "S-INFER"), "grade": "E3_inferred"},
                "exterior": d["ext"], "assembly_axis": d["axis"]}
        body = d["body"]
        if "\n" not in body:
            body = "    " + body
        elif not body.startswith("    "):
            body = "    " + body
        src = HEADER % pid + "PART = " + pprint.pformat(part, width=110) + "\n\nPARAMS = " + pprint.pformat(d["params"], width=110) + "\n\n\ndef build(p):\n" + body + "\n"
        (out / f"{pid}.py").write_text(src)
    print(len(PARTS), "parts written")

if __name__ == "__main__":
    main()
