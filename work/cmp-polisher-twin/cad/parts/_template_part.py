"""Parametric CAD source for one part. Copy to cad/parts/<part_id>.py and edit.

Every dimension traces to a research source (source_id + locator from research/corpus.json)
or is marked grade E3_inferred/E4_unknown with a justified sigma. scripts/dta_cad_build.py
imports this file, calls build(), validates the solid, exports STEP + GLB and fills cad/parts.json.
Do not hard-code numbers inside build(); read them from PARAMS so the trace survives.
"""

PART = {
    "id": "p-example-plate",            # stable part id, also used in assembly.json and rationale cards
    "mesh_object_id": "example_plate",  # GLB node/mesh name the browser picks
    "feature_id": "f-example-plate",    # features[] entry in the quality manifest
    "critical": True,                   # critical parts need an exact-variant source
    "applies_to": "maker-model-year-variant",
    "technology_family": "declare-from-research",
    "component_type": "structural_plate",
    "units": "mm",
    "cad_tool": "CadQuery",
    "material": {"name": "aluminium alloy", "source_id": "S-TODO", "grade": "E3_inferred",
                 "pbr": {"color": [0.78, 0.79, 0.80, 1.0], "metallic": 0.9, "roughness": 0.45}},
    "exterior": False,                  # True for housings/covers that semantic zoom should fade
    "assembly_axis": [0, 1, 0],         # real disassembly direction for the lift-out gesture
}

# value in PART["units"]; sigma in the same unit; grade E1_measured|E2_photomatched|E3_inferred|E4_unknown
PARAMS = {
    "length":    {"value": 120.0, "sigma": 0.5, "grade": "E1_measured",    "source_id": "S-TODO", "locator": "drawing p.4, dim L"},
    "width":     {"value": 80.0,  "sigma": 0.5, "grade": "E1_measured",    "source_id": "S-TODO", "locator": "drawing p.4, dim W"},
    "thickness": {"value": 6.0,   "sigma": 1.0, "grade": "E2_photomatched", "source_id": "S-TODO", "locator": "side photo, scaled by W"},
    "hole_d":    {"value": 6.5,   "sigma": 0.5, "grade": "E3_inferred",    "source_id": "S-TODO", "locator": "M6 clearance per ISO 273 medium"},
    "hole_inset": {"value": 10.0, "sigma": 2.0, "grade": "E3_inferred",    "source_id": "S-TODO", "locator": "estimated from photo"},
}


def build(p):
    """Return a CadQuery Workplane/Shape built only from p (PARAMS values)."""
    import cadquery as cq
    plate = cq.Workplane("XY").box(p["length"], p["width"], p["thickness"])
    return (plate.faces(">Z").workplane()
            .rect(p["length"] - 2 * p["hole_inset"], p["width"] - 2 * p["hole_inset"], forConstruction=True)
            .vertices().hole(p["hole_d"]))
