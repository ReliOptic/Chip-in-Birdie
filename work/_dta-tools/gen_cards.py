#!/usr/bin/env python3
"""ui/part-rationale.json from cad/build-report.json + cad/parts.json + ui/card-text.json
({part_id: {label, geometry, physics, manipulable?}}). Grades come from the build, never hand-set."""
import importlib.util, json, sys
from pathlib import Path
R = Path(sys.argv[1]).resolve()
rep = {p["id"]: p for p in json.loads((R / "cad/build-report.json").read_text())["parts"]}
inv = {p["id"]: p for p in json.loads((R / "cad/parts.json").read_text())}
asm = {p["part_id"]: p for p in json.loads((R / "cad/assembly.json").read_text())["parts"]}
txt = json.loads((R / "ui/card-text.json").read_text())
sys.path.insert(0, str(R / "cad/parts"))
cards = []
for pid, t in txt.items():
    r, i = rep[pid], inv[pid]
    spec = importlib.util.spec_from_file_location("m", R / f"cad/parts/{pid}.py"); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    g = r["worst_param_grade"]
    missing = [{"what": f"{k} ({v['value']} ±{v.get('sigma')})", "resolves_with": "dimensioned drawing, product teardown or maker figure"}
               for k, v in i["parameters"].items() if v["grade"] in ("E3_inferred", "E4_unknown")][:4]
    cards.append({"part_id": pid, "mesh_object_id": i["mesh_object_id"], "label": t["label"], "evidence_grade": g,
                  "confidence": {"E1_measured": 0.95, "E2_photomatched": 0.75, "E3_inferred": 0.45, "E4_unknown": 0.0}[g],
                  "sigma_m": round(r["max_sigma_m"], 4), "missing": missing, "geometry_decision": t["geometry"],
                  "material_decision": m.PART["material"]["name"] + " (" + m.PART["material"]["grade"] + ")",
                  "physics_rationale": t["physics"], "uncertainty": f"worst parameter grade {g}; max σ {r['max_sigma_m']*1000:.0f} mm",
                  "cad_parameters": f"see cad/parts/{pid}.py PARAMS", "source_ids": i["source_ids"],
                  "assembly_axis": asm[pid]["explode"]["axis"], "exterior": bool(m.PART.get("exterior")),
                  "manipulable": bool(t.get("manipulable")), "pbr": m.PART["material"]["pbr"]})
(R / "ui/part-rationale.json").write_text(json.dumps(cards, indent=2, ensure_ascii=False))
print(len(cards), "cards", sorted({c["evidence_grade"] for c in cards}))
