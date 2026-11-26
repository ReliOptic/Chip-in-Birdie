#!/usr/bin/env python3
"""Shared build for the twins in work/: runs the DTA CAD build (validation, STEP re-import, GLB) with finer
angular tessellation, then writes CATIA-grade exchange files:
  cad/step-ap242/<part>.step          one solid per part, schema AP242 (AP242_MANAGED_MODEL_BASED_3D_ENGINEERING)
  cad/<project>-assembly-ap242.step   named, coloured, placed assembly (XCAF) in AP242
Each AP242 file is re-imported and its volume compared with the kernel solid (≤1 %).
Usage: DTA=<skill dir> python3 work/_dta-tools/build_cad.py <project>"""
import json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(os.environ["DTA"]) / "scripts"))
import dta_glb, dta_cad_build  # noqa: E402

_orig = dta_glb.tessellate_cadquery
dta_cad_build.tessellate_cadquery = lambda shape, tol=0.05, angular=0.3: _orig(shape, tol, 0.08)


def ap242(project: Path) -> dict:
    import cadquery as cq
    from OCP.Interface import Interface_Static
    from OCP.STEPControl import STEPControl_Writer, STEPControl_AsIs
    STEPControl_Writer()  # loads the STEP statics
    assert Interface_Static.SetCVal_s("write.step.schema", "AP242DIS")
    out = project / "cad" / "step-ap242"; out.mkdir(parents=True, exist_ok=True)
    asm_def = json.loads((project / "cad" / "assembly.json").read_text())
    place = {p["part_id"]: p for p in asm_def["parts"]}
    asm = cq.Assembly(name=project.name)
    rep = {"schema": "AP242DIS", "parts": []}
    for src in sorted((project / "cad" / "parts").glob("*.py")):
        if src.name.startswith("_"):
            continue
        part, params, build = dta_cad_build.load_part(src)
        res = build({k: float(v["value"]) for k, v in params.items()})
        shape = res.val() if hasattr(res, "val") else res
        w = STEPControl_Writer(); w.Transfer(shape.wrapped, STEPControl_AsIs)
        path = out / f"{part['id']}.step"; w.Write(str(path))
        back = cq.importers.importStep(str(path))
        err = abs(sum(s.Volume() for s in back.solids().vals()) - shape.Volume()) / shape.Volume()
        if err > 0.01:
            raise SystemExit(f"{path}: AP242 re-import volume error {err:.2%}")
        pl = place[part["id"]]; t = pl.get("translation", [0, 0, 0]); rx, ry, rz = pl.get("rotation_deg", [0, 0, 0])
        loc = cq.Location(cq.Vector(*t), cq.Vector(0, 0, 1), rz) * cq.Location(cq.Vector(), cq.Vector(0, 1, 0), ry) * cq.Location(cq.Vector(), cq.Vector(1, 0, 0), rx)
        col = (part.get("material") or {}).get("pbr", {}).get("color", [0.7, 0.7, 0.72, 1])
        asm.add(shape, name=part["mesh_object_id"], loc=loc, color=cq.Color(*col[:4]))
        rep["parts"].append({"id": part["id"], "path": str(path.relative_to(project)), "reimport_volume_error": err})
    apath = project / "cad" / f"{project.name}-assembly-ap242.step"
    asm.save(str(apath), exportType="STEP")
    head = apath.read_text(errors="ignore")[:2000]
    rep["assembly"] = {"path": str(apath.relative_to(project)), "schema_ok": "AP242" in head}
    (project / "cad" / "ap242-report.json").write_text(json.dumps(rep, indent=2))
    return rep


if __name__ == "__main__":
    proj = Path(sys.argv[1]).resolve()
    r = dta_cad_build.build_all(proj, tolerance=float(os.environ.get("TOL", 0.3)), occt_gltf=True)
    print({"parts": len(r["parts"]), "errors": r["errors"], "triangles": sum(p["triangles"] for p in r["parts"])})
    if r["errors"]:
        sys.exit(2)
    a = ap242(proj)
    print({"ap242_parts": len(a["parts"]), "assembly": a["assembly"]})
