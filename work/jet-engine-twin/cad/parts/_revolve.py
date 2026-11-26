"""Shared CadQuery helpers for axisymmetric turbofan parts (engine axis = +X, aft positive, radius in XY-plane Y)."""
import math


def revolve(points):
    """Closed (x, r) polyline revolved 360 deg about the engine X axis."""
    import cadquery as cq
    return cq.Workplane("XY").polyline(points).close().revolve(360, (0, 0, 0), (1, 0, 0))


def shell(x0, x1, r_in0, r_out0, r_in1, r_out1):
    """Conical annular shell between two axial stations."""
    return revolve([(x0, r_in0), (x1, r_in1), (x1, r_out1), (x0, r_out0)])


def stage_bands(x_start, pitch, width, hub0, hub1, tip0, tip1, n):
    """n separate annular blade-row envelopes; hub/tip radii interpolated linearly across the stages."""
    import cadquery as cq
    solids = []
    for i in range(n):
        f = i / max(n - 1, 1)
        hub, tip = hub0 + (hub1 - hub0) * f, tip0 + (tip1 - tip0) * f
        x = x_start + i * pitch
        solids.append(shell(x, x + width, hub, tip, hub, tip).val())
    return cq.Workplane().add(cq.Compound.makeCompound(solids))
