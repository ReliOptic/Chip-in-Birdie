#!/usr/bin/env python3
"""ui/part-rationale.json from cad/build-report.json + cad/parts.json (grades are never hand-set)."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
rep = {p["id"]: p for p in json.loads((ROOT / "cad/build-report.json").read_text())["parts"]}
inv = {p["id"]: p for p in json.loads((ROOT / "cad/parts.json").read_text())}
asm = {p["part_id"]: p for p in json.loads((ROOT / "cad/assembly.json").read_text())["parts"]}

TEXT = {  # label (≤8 words), geometry, physics
 "p-spinner": ("Spinner", "Ogive cone ahead of the fan hub; length from cutaway proportion.", "static aerodynamic fairing; rotates with N1"),
 "p-fan": ("Fan, 24 wide-chord blades", "24 lofted blades, twist root→tip; count and diameter sourced, airfoil inferred.", "fan stage of cycle: FPR, η_fan; N1 spool"),
 "p-fan-case": ("Fan containment case", "Annular case at fan tip radius; wall thickness inferred.", "static; reference frame of assembly"),
 "p-nacelle-inlet": ("Inlet cowl", "Revolved lip; 737NG flattened lower lip not yet modelled.", "inlet total-pressure recovery π_d"),
 "p-thrust-reverser": ("Fan cowl / thrust reverser", "Revolved outer cowl to fan nozzle exit; cascades not modelled.", "bypass nozzle: convergent, choke check"),
 "p-booster": ("Booster, 3 stages", "3 annular row envelopes; per-row blade counts unknown.", "core compression on N1 spool"),
 "p-hpc": ("HP compressor, 9 stages", "9 annular row envelopes tapering to exit; blade counts unknown.", "OPR, η_comp; driven by HPT on N2"),
 "p-combustor": ("Annular combustor", "Hollow annular liner envelope; dome/nozzle details unknown.", "energy balance: fuel-air ratio from Tt4"),
 "p-hpt": ("HP turbine, 1 stage", "Single row envelope; cooled blade geometry unknown.", "work = HPC work / η_mech"),
 "p-lpt": ("LP turbine, 4 stages", "4 row envelopes growing in radius aft.", "work = fan + booster work / η_mech"),
 "p-core-cowl": ("Core cowl", "Revolved inner bypass wall from splitter to core exhaust.", "bypass duct inner boundary"),
 "p-exhaust-nozzle": ("Core exhaust nozzle", "Conical primary nozzle shell.", "core nozzle: convergent, choke check"),
 "p-exhaust-plug": ("Exhaust plug", "Revolved centerbody aft of LPT.", "static fairing"),
 "p-lp-shaft": ("LP shaft", "Hollow tube fan→LPT; diameter inferred.", "transmits LPT work to fan; N1"),
 "p-hp-shaft": ("HP spool drum", "Drum linking HPC and HPT; geometry inferred.", "transmits HPT work to HPC; N2"),
 "p-gearbox": ("Accessory gearbox", "Rounded box on lower fan case; position/size inferred.", "static; driven off N2 (not modelled)"),
}
cards = []
for pid, (label, geo, phys) in TEXT.items():
    r, i = rep[pid], inv[pid]
    g = r["worst_param_grade"]
    params = i["parameters"]
    missing = [{"what": f"{k} ({v['value']} mm ±{v['sigma']})" if k not in ("n_blades", "n_stages") else k,
                "resolves_with": "exact-variant drawing, measured section, or service-manual figure"}
               for k, v in params.items() if v["grade"] in ("E3_inferred", "E4_unknown")][:4]
    conf = {"E1_measured": 0.95, "E2_photomatched": 0.75, "E3_inferred": 0.45, "E4_unknown": 0.0}[g]
    cards.append({"part_id": pid, "mesh_object_id": i["mesh_object_id"], "label": label, "evidence_grade": g,
                  "confidence": conf, "sigma_m": round(r["max_sigma_m"], 4), "missing": missing,
                  "geometry_decision": geo, "material_decision": json.loads((ROOT / "cad/parts.json").read_text()) and "",
                  "physics_rationale": phys, "uncertainty": f"worst parameter grade {g}; max σ {r['max_sigma_m']*1000:.0f} mm",
                  "cad_parameters": f"see cad/parts/{pid}.py PARAMS", "source_ids": i["source_ids"],
                  "assembly_axis": asm[pid]["explode"]["axis"], "exterior": pid in ("p-nacelle-inlet", "p-thrust-reverser", "p-core-cowl", "p-exhaust-nozzle"),
                  "manipulable": pid == "p-fan"})
# material decision from part files
import importlib.util, sys
sys.path.insert(0, str(ROOT / "cad/parts"))
for c in cards:
    spec = importlib.util.spec_from_file_location("m", ROOT / f"cad/parts/{c['part_id']}.py"); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    c["material_decision"] = m.PART["material"]["name"] + " (grade " + m.PART["material"]["grade"] + ")"
    c["pbr"] = m.PART["material"]["pbr"]
(ROOT / "ui/part-rationale.json").write_text(json.dumps(cards, indent=2, ensure_ascii=False))
print(len(cards), "cards", {c["part_id"]: c["evidence_grade"] for c in cards})
