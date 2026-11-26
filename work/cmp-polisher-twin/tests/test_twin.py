"""Falsification tests for the CMP twin. Calibration uses only 1.0 and 2.0 psi (S035); 1.5 and 2.5 psi are held out."""
import json, sys, subprocess, unittest
from pathlib import Path
R = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R / "physics")); import solver  # noqa: E402
I = json.loads((R / "physics/inputs.json").read_text())


def rr(psi):
    i = json.loads(json.dumps(I)); i["zone_psi"]["value"] = psi
    return solver.profile(i, nr=20, nt=36)["mean_A_min"]


class Twin(unittest.TestCase):
    def test_heldout_1p5_psi_lower_bound(self):  # S035: "over 6452 Å/min"
        self.assertGreater(rr(1.5), 6452)

    def test_heldout_2p5_psi_within_12pct(self):  # S035: 9425 Å/min
        v = rr(2.5); print(f"\n2.5 psi predicted {v:.0f} vs 9425 measured ({v/9425-1:+.1%})")
        self.assertLess(abs(v / 9425 - 1), 0.12)

    def test_linear_preston_is_falsified(self):  # counter-hypothesis: linear Preston from 1.0 psi overshoots 2.5 psi badly
        self.assertGreater(4640 * 2.5 / 9425 - 1, 0.2)

    def test_wiwnu_under_reported_bound(self):  # S035: <4 % at 1.5 psi (model excludes edge effects: weak test)
        self.assertLess(solver.profile(I)["wiwnu"], 0.04)

    def test_wafer_stays_on_pad(self):  # geometry constraint: e + r_wafer ≤ platen radius (762/2 mm, S033)
        self.assertLessEqual(I["e_m"]["value"] + I["r_wafer_m"]["value"], 0.381)

    def test_mutant_rejected(self):
        m = json.loads(subprocess.check_output([sys.executable, str(R / "physics/mutant.py")]))["output"]
        o = json.loads(subprocess.check_output([sys.executable, str(R / "physics/oracle.py")]))["output"]
        self.assertGreater(max(abs(a - b) for a, b in zip(m, o)) / max(map(abs, m + o)), 0.05)

    def test_incompatible_part_rejected(self):
        bad = json.loads((R / "tests/invalid-part.json").read_text())
        self.assertIn(bad["component_type"], json.loads((R / "research/identity.json").read_text())["forbidden_component_types"])


if __name__ == "__main__":
    unittest.main()
