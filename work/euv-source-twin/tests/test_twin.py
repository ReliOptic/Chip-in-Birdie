"""Falsification tests for the EUV source twin. P_IF measured (250 W, S001) is held out of the solver."""
import json, math, sys, unittest, importlib.util, subprocess
from pathlib import Path
R = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R / "physics")); import solver  # noqa: E402
INP = json.loads((R / "physics/inputs.json").read_text()); DP = solver.chain(INP)


class Twin(unittest.TestCase):
    def test_upper_bound_not_below_measured(self):  # an upper bound below 250 W would make the chain impossible
        self.assertGreaterEqual(DP["P_IF_max_W"], 250)

    def test_implied_unmodelled_transmission_is_physical(self):
        T = 250 / DP["P_IF_max_W"]; print(f"\nimplied unmodelled transmission (gas, IF clip, SPF) = {T:.2f}")
        self.assertTrue(0.2 < T <= 1.0)

    def test_pulse_energy_consistency(self):  # S015: 5 mJ/pulse; S001: 250 W @ 50 kHz
        self.assertAlmostEqual(250 / INP["f_Hz"]["value"], 5e-3, places=6)

    def test_droplet_spacing_vs_patent_example(self):  # S053: 1.4 mm at 70 m/s, 50 kHz — same relation
        self.assertAlmostEqual(70 / 50e3, 1.4e-3, places=6)
        self.assertAlmostEqual(DP["droplet_spacing_m"], INP["v_droplet_m_s"]["value"] / INP["f_Hz"]["value"])

    def test_cad_collector_subtends_sourced_solid_angle(self):  # CAD ↔ evidence: oracle ray-casts the CAD ellipsoid
        out = json.loads(subprocess.check_output([sys.executable, str(R / "physics/oracle.py")]))["output"]
        self.assertLess(abs(out[1] - 1), 0.01)

    def test_mutant_rejected_by_definition_not_by_250W(self):
        mut = json.loads(subprocess.check_output([sys.executable, str(R / "physics/mutant.py")]))["output"][0] * 250
        ora = json.loads(subprocess.check_output([sys.executable, str(R / "physics/oracle.py")]))["output"][0] * 250
        print(f"\nmutant {mut:.0f} W, oracle bound {ora:.0f} W, measured 250 W (mutant lies close to 250 W by coincidence)")
        self.assertGreater(abs(mut / ora - 1), 0.3)

    def test_incompatible_part_rejected(self):
        bad = json.loads((R / "tests/invalid-part.json").read_text())
        self.assertIn(bad["component_type"], json.loads((R / "research/identity.json").read_text())["forbidden_component_types"])


if __name__ == "__main__":
    unittest.main()
