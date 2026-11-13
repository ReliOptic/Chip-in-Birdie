"""Regression checks for the provisional S1–S4 programming index.

These checks validate structure and lineage, not historical truth or release QA.
"""

import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


class SeasonProgramTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan = read_json("editorial/season-program-s1-s4.proposal.json")
        cls.proposals = {r["p_id"]: r for r in read_json("editorial/proposals.json")}
        cls.original = {r["h_id"] for r in read_json("editorial/catalog.json")}

    def test_four_seasons_and_unique_24_candidates(self):
        seasons = self.plan["seasons"]
        self.assertEqual([s["season_id"] for s in seasons], ["S1", "S2", "S3", "S4"])
        self.assertTrue(all(len(s["episode_candidates"]) == 6 for s in seasons))
        ids = [e["p_id"] for s in seasons for e in s["episode_candidates"]]
        self.assertEqual(len(ids), 24)
        self.assertEqual(len(set(ids)), 24)
        self.assertEqual(set(ids) - self.proposals.keys(), set())
        for s in seasons:
            self.assertEqual([e["order"] for e in s["episode_candidates"]], list(range(1, 7)))

    def test_original_lineage_remains_available(self):
        for s in self.plan["seasons"]:
            for candidate in s["episode_candidates"]:
                p = self.proposals[candidate["p_id"]]
                self.assertTrue(set(p["source_h_ids"]) <= self.original)
                self.assertEqual(p["audience_ref"], "channel/audience.json")

    def test_claude_report_is_not_treated_as_verified_media(self):
        reported = set(self.plan["authority"]["reported_claude_voice_ids"])
        included = {e["p_id"] for s in self.plan["seasons"] for e in s["episode_candidates"] if e["claude_voice_reported"]}
        self.assertEqual(included, reported)
        self.assertEqual({e["p_id"] for e in self.plan["seasons"][0]["episode_candidates"]} & reported, reported)
        self.assertFalse(self.plan["authority"]["claude_source_html_available"])
        self.assertFalse(self.plan["authority"]["original_other_19_ids_verified"])
        self.assertNotEqual(self.plan["status"], "RELEASE_APPROVED")
        self.assertFalse(self.plan["rules"]["candidate_order_is_release_slot"])
        self.assertFalse(self.plan["rules"]["readiness_is_verified"])

    def test_no_approved_release_slots_are_implied(self):
        self.assertEqual(self.plan["rules"]["audience_ref"], "channel/audience.json")
        for s in self.plan["seasons"]:
            for e in s["episode_candidates"]:
                self.assertNotIn("release_slot", e)
                self.assertNotIn("primary_audience", e)
                self.assertIsNone(self.proposals[e["p_id"]]["release_slot"])
                self.assertEqual(self.proposals[e["p_id"]]["source_evidence_status"], "SOURCE_PENDING")


if __name__ == "__main__":
    unittest.main()
