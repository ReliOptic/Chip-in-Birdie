"""Workflow invariants using isolated temporary repositories, no network."""
import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from datetime import datetime, timedelta, timezone


SPEC = importlib.util.spec_from_file_location("channel_ops", Path(__file__).resolve().parents[1] / "tools/channel.py")
channel = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(channel)


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.time = datetime(2026, 11, 11, 12, tzinfo=timezone.utc)
        self.repo = channel.ChannelRepo(self.root, now=lambda: self.time)
        self.put_json("channel/charter.json", {"channel_name": "Chip in Birdie", "audience_ref": "channel/audience.json"})
        self.put_json("channel/audience.json", {"scope": "channel", "shared_viewer_reward": "Understand semiconductor choices", "measurement_status": "NO_CHANNEL_ANALYTICS_CONNECTED"})
        self.put_json("editorial/catalog.json", [{"h_id": "H095", "audience_ref": "channel/audience.json", "source_working_title": "Source working title", "legacy_tags": {"topic_interest_primary": "archive only"}, "current_media_status": None}])
        self.put_json("editorial/proposals.json", [{"p_id": "P005", "source_h_ids": ["H095"], "audience_ref": "channel/audience.json"}])
        self.put_json("work/tasks/TASK-001.json", {"task_id": "TASK-001", "episode_id": "H095", "title": "Research delivery", "status": "OPEN", "required_review_roles": ["evidence", "editorial", "viewer"], "claim": None, "revision": 0, "current_delivery_id": None, "history": []})
        self.put("drafts/research.md", "# Research draft\nEvidence scope is explicitly limited.\n")
        self.put("notes/review.md", "Checked the submitted text against its stated sources. Missing claims are explicitly identified.\n")

    def put(self, relative, text):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def put_json(self, relative, value):
        return self.put(relative, json.dumps(value, ensure_ascii=False))

    def submit(self, actor="producer", session="producer-run", model="model-a"):
        self.repo.claim("TASK-001", actor, model, session=session)
        return self.repo.submit("TASK-001", ["drafts/research.md"], actor, session=session)

    def review(self, role, verdict="pass", actor=None, model="model-a", session=None, fresh=None):
        actor = actor or "reviewer-" + role
        return self.repo.add_review("TASK-001", role, actor, model, verdict, "notes/review.md",
                                    session=session or actor + "-run", fresh_context=(role == "viewer") if fresh is None else fresh)

    def all_pass(self):
        for role in ("evidence", "editorial", "viewer"):
            self.review(role)

    def metrics_file(self, rows):
        path = self.root / "incoming.csv"
        with path.open("w", newline="", encoding="utf-8") as stream:
            writer = csv.DictWriter(stream, fieldnames=channel.METRIC_FIELDS)
            writer.writeheader()
            writer.writerows(rows)
        return path

    def metric(self, value="", metric="views", unit="count"):
        return {"observed_at": "2026-11-11T00:00:00Z", "video_id": "example-video", "metric": metric,
                "value": value, "unit": unit, "source": "test-fixture", "source_ref": "fixtures/measured.csv"}

    def test_brief_uses_one_channel_audience_and_omits_legacy_target(self):
        brief = self.repo.brief("H095")
        self.assertEqual(brief["audience_ref"], "channel/audience.json")
        self.assertNotIn("legacy_tags", brief["episode"])
        self.assertNotIn("primary_audience", brief["episode"])
        self.assertIsNone(brief["episode"]["current_media_status"])
        self.assertEqual(self.repo.validate()["status"], "PASS")
        data = self.repo.read_json(self.root / "editorial/catalog.json")
        data[0]["target_audience"] = "per-video audience"
        self.put_json("editorial/catalog.json", data)
        with self.assertRaisesRegex(channel.ChannelError, "Per-video"):
            self.repo.validate()

    def test_unexpired_local_lease_rejects_competing_actor_and_session(self):
        self.repo.claim("TASK-001", "producer", "model-a", session="run-1")
        with self.assertRaisesRegex(channel.ChannelError, "unexpired"):
            self.repo.claim("TASK-001", "other", "model-b", session="run-2")
        with self.assertRaisesRegex(channel.ChannelError, "unexpired"):
            self.repo.claim("TASK-001", "producer", "model-a", session="run-2")

    def test_expired_lease_cannot_submit_and_can_be_reclaimed(self):
        self.repo.claim("TASK-001", "producer", "model-a", lease_hours=1, session="run-1")
        self.time += timedelta(hours=2)
        with self.assertRaisesRegex(channel.ChannelError, "expired"):
            self.repo.submit("TASK-001", ["drafts/research.md"], "producer")
        task = self.repo.claim("TASK-001", "replacement", "model-a", session="run-2")
        self.assertEqual(task["claim"]["actor"], "replacement")
        self.assertIn("LEASE_EXPIRED", [x["event"] for x in task["history"]])
        with self.assertRaisesRegex(channel.ChannelError, "another actor"):
            self.repo.submit("TASK-001", ["drafts/research.md"], "producer")

    def test_explicit_claim_session_cannot_be_omitted_at_submit(self):
        self.repo.claim("TASK-001", "producer", "model-a", session="run-1")
        for session in (None, "different-run"):
            with self.subTest(session=session), self.assertRaisesRegex(channel.ChannelError, "another session"):
                self.repo.submit("TASK-001", ["drafts/research.md"], "producer", session=session)
        self.assertEqual(self.repo.task("TASK-001")["status"], "CLAIMED")
        self.assertFalse((self.root / "work/deliveries").exists())
        self.repo.submit("TASK-001", ["drafts/research.md"], "producer", session="run-1")

    def test_default_actor_session_is_consistent_across_claim_and_submit(self):
        self.repo.claim("TASK-001", "producer", "model-a")
        delivery = self.repo.submit("TASK-001", ["drafts/research.md"], "producer")
        self.assertEqual(delivery["producer"]["session_id"], "producer")

    def test_self_review_rejected_for_actor_or_session(self):
        self.submit()
        with self.assertRaisesRegex(channel.ChannelError, "Self-review"):
            self.review("evidence", actor="producer", session="different-session")
        with self.assertRaisesRegex(channel.ChannelError, "Self-review"):
            self.review("evidence", actor="different-actor", session="producer-run")

    def test_same_model_separate_actor_and_context_is_allowed(self):
        self.submit(model="same-model")
        for role in ("evidence", "editorial", "viewer"):
            review = self.review(role, model="same-model")
            self.assertFalse(review["cross_model"])
        result = self.repo.complete("TASK-001", "operator")
        self.assertEqual(result["status"], "DONE")
        self.assertIsNone(result["video_ready"])
        catalog = self.repo.read_json(self.root / "editorial/catalog.json")
        self.assertIsNone(catalog[0]["current_media_status"])

    def test_viewer_review_requires_fresh_context_declaration(self):
        self.submit()
        with self.assertRaisesRegex(channel.ChannelError, "fresh-context"):
            self.review("viewer", fresh=False)

    def test_viewer_context_cannot_reuse_an_evidence_review_session(self):
        self.submit()
        self.review("evidence", actor="critic", session="critic-run")
        with self.assertRaisesRegex(channel.ChannelError, "not used for other review roles"):
            self.review("viewer", actor="fresh-looking-name", session="critic-run")

    def test_blank_explicit_session_is_rejected_before_writing_review(self):
        self.submit()
        for session in ("", "  "):
            with self.subTest(session=session), self.assertRaisesRegex(channel.ChannelError, "session_id"):
                self.repo.add_review("TASK-001", "evidence", "critic", "model-a", "pass", "notes/review.md", session=session)
        self.assertFalse(list((self.root / "work/reviews").glob("*.json")))
        self.assertEqual(self.repo.validate()["status"], "PASS")

    def test_resealed_review_with_missing_identity_is_still_invalid(self):
        self.submit()
        review = self.review("evidence")
        review.pop("record_sha256")
        review["reviewer"]["session_id"] = None
        review = channel.sealed(review, "record_sha256")
        self.put_json("work/reviews/" + review["review_id"] + ".json", review)
        with self.assertRaisesRegex(channel.ChannelError, "session_id"):
            self.repo.validate()

    def test_all_required_roles_must_review_current_revision(self):
        self.submit()
        self.review("evidence")
        with self.assertRaisesRegex(channel.ChannelError, "Missing"):
            self.repo.complete("TASK-001", "operator")
        self.review("editorial")
        self.review("viewer")
        self.assertEqual(self.repo.complete("TASK-001", "operator")["status"], "DONE")

    def test_changed_live_artifact_rejects_completion_after_reviews(self):
        delivery = self.submit()
        self.all_pass()
        self.put("drafts/research.md", "Different claims after review.\n")
        with self.assertRaisesRegex(channel.ChannelError, "Stale artifact hash"):
            self.repo.complete("TASK-001", "operator")
        snapshot = self.root / delivery["artifacts"][0]["snapshot_path"]
        self.assertIn("Evidence scope", snapshot.read_text())

    def test_completed_delivery_uses_immutable_snapshot_after_later_live_edit(self):
        delivery = self.submit()
        self.all_pass()
        self.repo.complete("TASK-001", "operator")
        self.put("drafts/research.md", "A later task can revise this working document.\n")
        self.assertEqual(self.repo.validate()["status"], "PASS")
        self.assertEqual(self.repo.task("TASK-001")["status"], "DONE")
        with self.assertRaisesRegex(channel.ChannelError, "Stale artifact hash"):
            self.review("evidence")
        self.put(delivery["artifacts"][0]["snapshot_path"], "Tampered approved snapshot.\n")
        with self.assertRaisesRegex(channel.ChannelError, "Stale artifact hash"):
            self.repo.validate()

    def test_blocking_review_cannot_be_hidden_by_later_pass(self):
        self.submit()
        self.review("evidence", verdict="changes_requested")
        self.all_pass()
        with self.assertRaisesRegex(channel.ChannelError, "blocking"):
            self.repo.complete("TASK-001", "operator")
        self.assertEqual(self.repo.task("TASK-001")["status"], "CHANGES_REQUESTED")

    def test_retry_preserves_revisions_and_does_not_reuse_old_reviews(self):
        first = self.submit()
        self.review("evidence", verdict="changes_requested")
        old_reviews = list((self.root / "work/reviews").glob("*.json"))
        self.repo.change_state("TASK-001", "retry", "operator", "Address the source mismatch")
        self.put("drafts/research.md", "# Corrected draft\nNarrowed to the evidence actually available.\n")
        second = self.submit()
        self.assertEqual(second["revision"], 2)
        self.assertEqual(second["previous_delivery_id"], first["delivery_id"])
        self.assertNotEqual(second["bundle_sha256"], first["bundle_sha256"])
        self.assertIn("Evidence scope", (self.root / first["artifacts"][0]["snapshot_path"]).read_text())
        self.assertTrue(all(x.exists() for x in old_reviews))
        with self.assertRaisesRegex(channel.ChannelError, "Missing"):
            self.repo.complete("TASK-001", "operator")
        self.all_pass()
        self.assertEqual(self.repo.complete("TASK-001", "operator")["revision"], 2)

    def test_block_cancel_retry_state_transitions_preserve_history(self):
        with self.assertRaisesRegex(channel.ChannelError, "CLAIMED"):
            self.repo.submit("TASK-001", ["drafts/research.md"], "producer")
        self.repo.claim("TASK-001", "producer", "model-a")
        task = self.repo.change_state("TASK-001", "block", "producer", "Source file unavailable")
        self.assertEqual(task["status"], "BLOCKED")
        with self.assertRaises(channel.ChannelError):
            self.repo.claim("TASK-001", "producer", "model-a")
        self.repo.change_state("TASK-001", "cancel", "operator", "Pause this attempt")
        self.repo.change_state("TASK-001", "retry", "operator", "Source recovered")
        task = self.repo.task("TASK-001")
        self.assertEqual(task["status"], "OPEN")
        self.assertEqual([x["event"] for x in task["history"]], ["CLAIMED", "BLOCK", "CANCEL", "RETRY"])

    def test_review_note_snapshot_is_hashed_and_tampering_fails(self):
        self.submit()
        review = self.review("evidence")
        self.put("notes/review.md", "A later, unrelated memo.\n")
        stored = self.repo.reviews(self.repo.delivery(self.repo.task("TASK-001")))[0]
        self.assertEqual(stored["notes_sha256"], review["notes_sha256"])
        path = self.root / "work/reviews" / (review["review_id"] + ".json")
        stored["notes"] = "Tampered review."
        self.put_json(str(path.relative_to(self.root)), stored)
        with self.assertRaisesRegex(channel.ChannelError, "integrity"):
            self.repo.validate()

    def test_snapshot_and_manifest_cannot_be_silently_overwritten(self):
        self.repo.claim("TASK-001", "producer", "model-a", session="run-1")
        claimed = self.repo.task("TASK-001")
        first = self.repo.submit("TASK-001", ["drafts/research.md"], "producer", session="run-1")
        # Simulate a crash after immutable output but before the mutable task write.
        self.put_json("work/tasks/TASK-001.json", claimed)
        recovered = self.repo.submit("TASK-001", ["drafts/research.md"], "producer", session="run-1")
        self.assertEqual(recovered, first)
        self.put_json("work/tasks/TASK-001.json", claimed)
        self.put("drafts/research.md", "Conflicting content after an interrupted submit.\n")
        with self.assertRaisesRegex(channel.ChannelError, "orphaned"):
            self.repo.submit("TASK-001", ["drafts/research.md"], "producer", session="run-1")

    def test_orphaned_delivery_cannot_recover_into_a_changed_task_scope(self):
        self.repo.claim("TASK-001", "producer", "model-a", session="run-1")
        claimed = self.repo.task("TASK-001")
        first = self.repo.submit("TASK-001", ["drafts/research.md"], "producer", session="run-1")
        manifest_path = self.repo.delivery_path(first["delivery_id"])
        original_manifest = manifest_path.read_bytes()
        # Interrupted submission recovery must not change its original target.
        claimed.update(scope="channel", episode_id=None)
        self.put_json("work/tasks/TASK-001.json", claimed)
        with self.assertRaisesRegex(channel.ChannelError, "orphaned"):
            self.repo.submit("TASK-001", ["drafts/research.md"], "producer", session="run-1")
        self.assertEqual(self.repo.task("TASK-001")["status"], "CLAIMED")
        self.assertEqual(self.repo.task("TASK-001")["revision"], 0)
        self.assertEqual(manifest_path.read_bytes(), original_manifest)

    def test_artifact_path_must_stay_inside_repository(self):
        self.repo.claim("TASK-001", "producer", "model-a")
        with self.assertRaisesRegex(channel.ChannelError, "repository-relative"):
            self.repo.submit("TASK-001", ["../outside.md"], "producer")
        outside = Path(self.directory.name).parent / (self.root.name + "-outside.txt")
        outside.write_text("outside")
        self.addCleanup(lambda: outside.unlink(missing_ok=True))
        (self.root / "drafts/external-link.md").symlink_to(outside)
        with self.assertRaisesRegex(channel.ChannelError, "escapes"):
            self.repo.submit("TASK-001", ["drafts/external-link.md"], "producer")

    def test_symlinked_delivery_output_is_rejected_before_any_external_write(self):
        self.repo.claim("TASK-001", "producer", "model-a")
        with tempfile.TemporaryDirectory() as elsewhere:
            outside = Path(elsewhere)
            (self.root / "work/deliveries").symlink_to(outside, target_is_directory=True)
            with self.assertRaisesRegex(channel.ChannelError, "symlink"):
                self.repo.submit("TASK-001", ["drafts/research.md"], "producer")
            self.assertEqual(list(outside.iterdir()), [])
            self.assertEqual(self.repo.task("TASK-001")["status"], "CLAIMED")

    def test_all_artifact_destinations_are_preflighted_before_snapshot_writes(self):
        self.repo.claim("TASK-001", "producer", "model-a")
        self.put("later/second.md", "Second artifact.\n")
        parent = self.root / "work/deliveries/TASK-001-r0001/artifacts"
        parent.mkdir(parents=True)
        with tempfile.TemporaryDirectory() as elsewhere:
            (parent / "later").symlink_to(Path(elsewhere), target_is_directory=True)
            with self.assertRaisesRegex(channel.ChannelError, "symlink"):
                self.repo.submit("TASK-001", ["drafts/research.md", "later/second.md"], "producer")
            self.assertFalse((parent / "drafts/research.md").exists())
            self.assertEqual(list(Path(elsewhere).iterdir()), [])

    def test_task_id_rules_and_ledger_enumeration_cannot_disagree(self):
        task = self.repo.task("TASK-001")
        task["task_id"] = "RESEARCH-001"
        self.put_json("work/tasks/RESEARCH-001.json", task)
        with self.assertRaisesRegex(channel.ChannelError, "TASK-"):
            self.repo.claim("RESEARCH-001", "producer", "model-a")
        with self.assertRaisesRegex(channel.ChannelError, "TASK-"):
            self.repo.status()
        with self.assertRaisesRegex(channel.ChannelError, "TASK-"):
            self.repo.validate()

    def test_channel_task_can_complete_without_episode_and_preserves_review_gates(self):
        task = self.repo.task("TASK-001")
        task.update(task_id="TASK-000", scope="channel", episode_id=None)
        self.put_json("work/tasks/TASK-000.json", task)
        self.assertEqual(self.repo.validate()["task_count"], 2)
        self.repo.claim("TASK-000", "ops-worker", "model-a", session="ops-run")
        delivery = self.repo.submit("TASK-000", ["drafts/research.md"], "ops-worker", session="ops-run")
        self.assertEqual(delivery["scope"], "channel")
        self.assertIsNone(delivery["episode_id"])
        with self.assertRaisesRegex(channel.ChannelError, "Missing"):
            self.repo.complete("TASK-000", "operator")
        for role in ("evidence", "editorial", "viewer"):
            self.repo.add_review("TASK-000", role, role + "-worker", "model-a", "pass", "notes/review.md",
                                 session=role + "-run", fresh_context=role == "viewer")
        self.assertEqual(self.repo.complete("TASK-000", "operator")["status"], "DONE")
        self.assertEqual(self.repo.validate()["status"], "PASS")
        item = next(x for x in self.repo.status()["tasks"] if x["task_id"] == "TASK-000")
        self.assertEqual(item["scope"], "channel")

    def test_task_scope_rejects_inconsistent_or_unknown_episode_combinations(self):
        initial = self.repo.task("TASK-001")
        invalid = [{"scope": "channel", "episode_id": "H095"}, {"scope": "episode", "episode_id": None},
                   {"scope": "episode", "episode_id": "H999"}, {"scope": "invalid", "episode_id": None},
                   {"scope": [], "episode_id": None}, {"scope": "episode", "episode_id": []}]
        for fields in invalid:
            self.put_json("work/tasks/TASK-001.json", {**initial, **fields})
            with self.subTest(fields=fields), self.assertRaises(channel.ChannelError):
                self.repo.claim("TASK-001", "producer", "model-a")
            with self.subTest(fields=fields), self.assertRaises(channel.ChannelError):
                self.repo.validate()

    def test_submitted_delivery_cannot_be_reassigned_to_another_task_scope(self):
        self.submit()
        task = self.repo.task("TASK-001")
        task.update(scope="channel", episode_id=None)
        self.put_json("work/tasks/TASK-001.json", task)
        with self.assertRaisesRegex(channel.ChannelError, "Delivery scope"):
            self.repo.validate()

    def test_blank_metrics_are_null_and_templates_are_not_measurements(self):
        path = self.metrics_file([self.metric(""), {k: "" for k in channel.METRIC_FIELDS}, {**{k: "" for k in channel.METRIC_FIELDS}, "metric": "ctr", "unit": "percent"}])
        result = self.repo.import_metrics(path)
        self.assertEqual(result["imported_rows"], 1)
        self.assertEqual(result["ignored_template_rows"], 2)
        self.assertEqual(result["measured_values"], 0)
        rows, _ = self.repo.metric_rows(self.root / "analytics/observations.csv")
        self.assertIsNone(rows[0]["value"])
        self.assertIsNone(self.repo.status()["youtube_connection"])
        self.assertEqual(self.repo.import_metrics(path)["imported_rows"], 0)

    def test_invalid_or_unsourced_metrics_are_rejected_before_write(self):
        invalid = [self.metric("NaN"), self.metric("-2"), self.metric("2.5"),
                   self.metric("101", "ctr", "percent"), self.metric("1.2", "ctr", "fraction"),
                   {**self.metric("12"), "source_ref": ""}, {**self.metric("12"), "observed_at": "not-a-date"}]
        for row in invalid:
            with self.subTest(row=row):
                path = self.metrics_file([row])
                with self.assertRaises(channel.ChannelError):
                    self.repo.import_metrics(path)
        self.assertFalse((self.root / "analytics/observations.csv").exists())

    def test_metric_units_and_unknown_names_are_rejected_before_write(self):
        invalid = [self.metric("60", "average_view_duration_seconds", "percent"),
                   self.metric("4", "watch_time_hours", "seconds"), self.metric("-20", "ctrr", "count"),
                   self.metric("", "unknown_metric", "count")]
        for row in invalid:
            with self.subTest(row=row), self.assertRaises(channel.ChannelError):
                self.repo.import_metrics(self.metrics_file([row]))
        self.assertFalse((self.root / "analytics/observations.csv").exists())
        result = self.repo.import_metrics(self.metrics_file([
            self.metric("60.5", "average_view_duration_seconds", "seconds"),
            self.metric("4.2", "watch_time_hours", "hours")]))
        self.assertEqual(result["measured_values"], 2)

    def test_channel_metrics_use_explicit_channel_target_and_video_rates_use_percent(self):
        rows = [{**self.metric("12", name, "count"), "video_id": "channel:actual-channel-fixture"}
                for name in sorted(channel.CHANNEL_METRICS)]
        rows += [self.metric("42.5", name, "percent") for name in sorted(channel.PERCENT_METRICS)]
        result = self.repo.import_metrics(self.metrics_file(rows))
        self.assertEqual(result["measured_values"], 6)
        self.assertIsNone(result["youtube_connection"])
        invalid = [self.metric("12", "monthly_audience", "count"),
                   {**self.metric("12", "new_viewers", "count"), "video_id": "channel:"},
                   self.metric("101", "intro_retention", "percent"),
                   self.metric("-1", "end_screen_click_rate", "percent"),
                   self.metric("0.5", "intro_retention", "fraction"),
                   {**self.metric("50", "end_screen_click_rate", "percent"), "video_id": "channel:actual-channel-fixture"}]
        before = (self.root / "analytics/observations.csv").read_bytes()
        for row in invalid:
            with self.subTest(row=row), self.assertRaises(channel.ChannelError):
                self.repo.import_metrics(self.metrics_file([row]))
        self.assertEqual((self.root / "analytics/observations.csv").read_bytes(), before)

    def test_valid_metrics_report_observations_not_inferred_success(self):
        result = self.repo.import_metrics(self.metrics_file([self.metric("12"), self.metric("3.5", "ctr", "percent")]))
        self.assertEqual(result["measured_values"], 2)
        self.assertIsNone(result["youtube_connection"])
        self.assertNotIn("success_score", result)

    def test_cli_errors_and_read_only_status(self):
        output, errors = io.StringIO(), io.StringIO()
        with redirect_stdout(output), redirect_stderr(errors):
            code = channel.main(["--repo", str(self.root), "status"])
        self.assertEqual(code, 0)
        self.assertIsNone(json.loads(output.getvalue())["video_ready_count"])
        self.assertFalse((self.root / "work/.channel.lock").exists())
        with redirect_stdout(io.StringIO()), redirect_stderr(errors):
            code = channel.main(["--repo", str(self.root), "task", "complete", "TASK-001", "--actor", "operator"])
        self.assertEqual(code, 2)


if __name__ == "__main__":
    unittest.main()
