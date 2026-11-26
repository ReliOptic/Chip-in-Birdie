#!/usr/bin/env python3
"""Project wrapper around the DTA CAD build: same validation, finer angular tessellation (0.08 rad)
so revolved casings render round. Usage: DTA=<skill dir> python3 tools/build_cad.py"""
import os, sys
from pathlib import Path
sys.path.insert(0, str(Path(os.environ["DTA"]) / "scripts"))
import dta_glb, dta_cad_build  # noqa: E402

_orig = dta_glb.tessellate_cadquery
dta_cad_build.tessellate_cadquery = lambda shape, tol=0.05, angular=0.3: _orig(shape, tol, 0.08)
r = dta_cad_build.build_all(Path(__file__).resolve().parents[1], tolerance=0.3, occt_gltf=True)
print({"parts": len(r["parts"]), "errors": r["errors"], "triangles": sum(p["triangles"] for p in r["parts"])})
sys.exit(2 if r["errors"] else 0)
