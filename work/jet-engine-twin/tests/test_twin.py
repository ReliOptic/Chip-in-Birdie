"""Falsifiable checks of the twin against held-out published numbers (run: python3 -m unittest tests/test_twin.py).
Held-out targets are NOT inputs to the solver: rated thrust (S001/S004), ICAO fuel flows (S004),
displayed EGT limit (S001), blade mass (S006), §33.73 response (S030)."""
import importlib.util, json, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "physics")); sys.path.insert(0, str(ROOT / "cad/parts"))
import solver  # noqa: E402

INP = json.loads((ROOT / "physics/inputs.json").read_text())
LINE = solver.operating_line(INP)
DP = solver.cycle(INP, 1.0)


class HeldOut(unittest.TestCase):
    def test_takeoff_thrust_vs_tcds(self):  # S001 §III.6: 12143 daN; S004: 121.44 kN
        self.assertLess(abs(DP["thrust_N"] / 121440 - 1), 0.05)

    def test_takeoff_fuel_vs_icao(self):  # S004 UID 3CM034: 1.284 kg/s
        self.assertLess(abs(DP["fuel_kg_s"] / 1.284 - 1), 0.10)

    def test_exhaust_below_displayed_egt_limit(self):  # S001 §IV.1.1: 950 °C at T49.5 (between Tt45 and Tt5)
        self.assertLess(DP["Tt5_K"], 950 + 273.15)
        self.assertGreater(DP["Tt45_K"], DP["Tt5_K"])

    def test_idle_thrust_near_icao_idle_mode(self):  # ICAO idle = 7 % rated (S005); model idle within 1–12 %
        frac = LINE[0]["thrust_N"] / DP["thrust_N"]
        self.assertTrue(0.01 < frac < 0.12, frac)

    def test_acceleration_meets_far_33_73(self):  # S030: ≤15 % → 95 % rated in ≤ 5 s
        tr = solver.transient(INP, LINE)
        F = DP["thrust_N"]
        t15 = next(r["t_s"] for r in tr if r["t_s"] >= 1.0)
        t95 = next(r["t_s"] for r in tr if r["thrust_N"] >= 0.95 * F)
        self.assertLessEqual(t95 - t15, 5.0)

    def test_fan_blade_mass_vs_ntsb(self):  # S006 §1.3.1: 10.83 lb = 4.91 kg nominal; Ti-6Al-4V 4430 kg/m3
        spec = importlib.util.spec_from_file_location("fan", ROOT / "cad/parts/p-fan.py"); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        p = {k: v["value"] for k, v in m.PARAMS.items()}
        shape = m.build(p).val()
        hub = m.shell(p["x_le"] - 30, p["x_le"] + 220, 0, p["r_hub"], 0, p["r_hub"] * 1.08).val().Volume()
        blade_m = (shape.Volume() - hub) / 24 * 1e-9 * 4430
        self.mass = blade_m
        print(f"\nmodel blade mass {blade_m:.2f} kg vs NTSB 4.91 kg")
        self.assertLess(abs(blade_m / 4.91 - 1), 0.35)  # E3 airfoil thickness; wide band, reported


class Integrity(unittest.TestCase):
    def test_mutant_rejected(self):  # bypass thrust dropped must miss TCDS thrust badly
        self.assertGreater(abs(DP["thrust_core_N"] / 121440 - 1), 0.3)

    def test_incompatible_part_rejected(self):  # DAC combustor belongs to -7B27/2, not -7B27 SAC (S001 §I.1)
        bad = json.loads((ROOT / "tests/invalid-part.json").read_text())
        ident = json.loads((ROOT / "research/identity.json").read_text())
        self.assertIn(bad["component_type"], ident["forbidden_component_types"])

    def test_trajectory_carries_solver_hash(self):
        row = json.loads((ROOT / "physics/state/trajectory.jsonl").read_text().splitlines()[0])
        self.assertEqual(row["solver_sha256"], __import__("hashlib").sha256((ROOT / "physics/solver.py").read_bytes()).hexdigest())


if __name__ == "__main__":
    unittest.main()
