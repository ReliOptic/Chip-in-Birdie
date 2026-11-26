"""Shared geometry for the LPP EUV source (x axis: plasma F1 at origin → intermediate focus F2 at +2c; up = Y)."""
import math


def ellipse(p):
    c = p["f1_f2"] / 2.0
    a = c + p["f1_vertex"]
    b = math.sqrt(a * a - c * c)
    return a, b, c


def rho(p, phi):
    """Distance from F1 to the collector surface at polar angle phi (rad) measured from -x (toward the near vertex)."""
    a, b, c = ellipse(p)
    return b * b / (a + c * math.cos(phi))


def rim_angle(p):
    """Rim angle such that the collector annulus subtends the sourced solid angle from F1."""
    return math.acos(math.cos(math.radians(p["hole_half_angle"])) - p["solid_angle_sr"] / (2 * math.pi))


def revolve(points):
    import cadquery as cq
    return cq.Workplane("XY").polyline(points).close().revolve(360, (0, 0, 0), (1, 0, 0))
