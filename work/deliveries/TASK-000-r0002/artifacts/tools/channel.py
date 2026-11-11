#!/usr/bin/env python3
"""Local, file-backed channel operations. No network, model calls, or uploads.

A task DONE is a research/document delivery, never a video READY assertion.
The advisory lock and lease coordinate this checkout only, not Git branches.
Actor, session and model labels are caller declarations, not authentication.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import sys
import tempfile
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

try:
    import fcntl
except ImportError:  # Fail closed for mutations when local locking is unavailable.
    fcntl = None


STATES = {"OPEN", "CLAIMED", "BLOCKED", "IN_REVIEW", "CHANGES_REQUESTED", "DONE", "CANCELLED"}
REVIEW_ROLES = {"evidence", "editorial", "viewer"}
METRIC_FIELDS = ["observed_at", "video_id", "metric", "value", "unit", "source", "source_ref"]
CHANNEL_METRICS = {"monthly_audience", "new_viewers", "casual_viewers", "regular_viewers"}
COUNT_METRICS = {"views", "impressions", "likes", "comments", "unique_viewers", "returning_viewers", "subscribers_gained", "subscribers_lost"} | CHANNEL_METRICS
PERCENT_METRICS = {"intro_retention", "end_screen_click_rate"}
METRIC_UNITS = {**{name: {"count"} for name in COUNT_METRICS},
                **{name: {"percent"} for name in PERCENT_METRICS},
                "ctr": {"percent", "fraction"},
                "average_view_duration_seconds": {"seconds"}, "watch_time_hours": {"hours"}}
IDENTIFIER = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


class ChannelError(ValueError):
    pass


def canonical_bytes(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(value):
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def stamp(value):
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_time(value, label="timestamp"):
    if not isinstance(value, str) or not value.strip():
        raise ChannelError(f"{label} must be an ISO timestamp with timezone")
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ChannelError(f"Invalid {label}: {value}") from exc
    if result.tzinfo is None:
        raise ChannelError(f"{label} must include a timezone")
    return result.astimezone(timezone.utc)


def require_text(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ChannelError(f"{label} is required")
    return value.strip()


def identifier(value, label="identifier"):
    value = require_text(value, label)
    if not IDENTIFIER.fullmatch(value):
        raise ChannelError(f"Invalid {label}: {value}")
    return value


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".channel-", dir=str(path.parent))
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def immutable_write(path, data):
    """Never replace a prior artifact; exact bytes may be reused after a crash."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if path.read_bytes() != data:
            raise ChannelError(f"Immutable output already exists with different bytes: {path.name}")
        return
    fd, temporary = tempfile.mkstemp(prefix=".channel-", dir=str(path.parent))
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        try:
            os.link(temporary, path)
        except FileExistsError:
            if path.read_bytes() != data:
                raise ChannelError(f"Concurrent immutable output conflict: {path.name}")
    finally:
        os.unlink(temporary)


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n").encode("utf-8")


def sealed(value, key):
    result = dict(value)
    result[key] = digest(value)
    return result


def check_seal(value, key):
    copy = dict(value)
    claimed = copy.pop(key, None)
    if claimed != digest(copy):
        raise ChannelError(f"Record integrity mismatch: {key}")


class ChannelRepo:
    def __init__(self, root, now=None):
        self.root = Path(root).resolve()
        self._now = now or (lambda: datetime.now(timezone.utc))

    def now(self):
        value = self._now()
        if value.tzinfo is None:
            raise ChannelError("Clock must be timezone-aware")
        return value.astimezone(timezone.utc)

    def read_json(self, path):
        try:
            return json.loads(path.read_text(encoding="utf-8"), parse_constant=lambda x: (_ for _ in ()).throw(ChannelError(f"Non-finite JSON number: {x}")))
        except (OSError, json.JSONDecodeError) as exc:
            raise ChannelError(f"Cannot read JSON {path.relative_to(self.root)}: {exc}") from exc

    @contextmanager
    def lock(self):
        if fcntl is None:
            raise ChannelError("Local advisory locking is unavailable; mutations are disabled")
        work = self.output_path("work")
        lock_path = self.output_path("work/.channel.lock")
        work.mkdir(parents=True, exist_ok=True)
        with lock_path.open("a+b") as handle:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)

    def output_path(self, relative):
        """Preflight every output before writing; ledger destinations cannot be symlinks.

        This local check is not a security boundary against an adversary changing
        directories concurrently. Repository actors must honour the local lock.
        """
        raw = Path(relative)
        if raw.is_absolute() or ".." in raw.parts or not raw.parts:
            raise ChannelError("Output paths must be repository-relative without '..'")
        cursor = self.root
        for part in raw.parts:
            cursor = cursor / part
            if cursor.is_symlink():
                raise ChannelError(f"Output path contains a symlink: {relative}")
        try:
            cursor.resolve().relative_to(self.root)
        except ValueError as exc:
            raise ChannelError("Output path escapes the repository") from exc
        return cursor

    def relative_file(self, value, *, must_exist=True):
        raw = Path(value)
        if raw.is_absolute() or ".." in raw.parts or not raw.parts:
            raise ChannelError("Artifact paths must be repository-relative without '..'")
        path = (self.root / raw).resolve()
        try:
            rel = path.relative_to(self.root)
        except ValueError as exc:
            raise ChannelError("Artifact path escapes the repository") from exc
        if rel.parts and rel.parts[0] == ".git":
            raise ChannelError("Git internals cannot be artifacts")
        if must_exist and not path.is_file():
            raise ChannelError(f"Artifact file does not exist: {value}")
        return path, rel.as_posix()

    def task_path(self, task_id):
        task_id = identifier(task_id, "task_id")
        if not task_id.startswith("TASK-") or len(task_id) == 5:
            raise ChannelError("task_id must begin with TASK- and include a suffix")
        return self.output_path("work/tasks/" + task_id + ".json")

    def task_paths(self):
        # Read every JSON ledger; malformed filenames must fail, not disappear.
        return sorted((self.root / "work/tasks").glob("*.json"))

    def task(self, task_id):
        value = self.read_json(self.task_path(task_id))
        if value.get("task_id") != task_id:
            raise ChannelError("Task filename and task_id disagree")
        if value.get("status") not in STATES:
            raise ChannelError("Unknown task state")
        revision = value.get("revision", 0)
        if isinstance(revision, bool) or not isinstance(revision, int) or revision < 0:
            raise ChannelError("Task revision must be a non-negative integer")
        roles = value.get("required_review_roles", value.get("required_reviews", []))
        if not isinstance(roles, list) or any(not isinstance(r, str) or r not in REVIEW_ROLES for r in roles) or len(set(roles)) != len(roles):
            raise ChannelError("Invalid required_review_roles")
        scope = value.get("scope", "episode")
        if not isinstance(scope, str) or scope not in {"channel", "episode"}:
            raise ChannelError("Task scope must be channel or episode")
        if scope == "channel":
            if value.get("episode_id") is not None:
                raise ChannelError("Channel-scoped task requires episode_id=null")
        else:
            catalog = self.read_json(self.root / "editorial/catalog.json")
            if not isinstance(value.get("episode_id"), str) or value["episode_id"] not in {row.get("h_id") for row in catalog}:
                raise ChannelError("Episode-scoped task requires a known H episode_id")
        value.setdefault("scope", "episode")
        value.setdefault("revision", 0)
        value.setdefault("claim", None)
        value.setdefault("current_delivery_id", None)
        value.setdefault("history", [])
        return value

    def event(self, task, kind, actor, **detail):
        task["history"].append({"event": kind, "at": stamp(self.now()), "actor": require_text(actor, "actor"), **detail})
        task["updated_at"] = stamp(self.now())

    def write_task(self, task):
        atomic_write(self.task_path(task["task_id"]), json_bytes(task))

    def active_claim(self, task, actor, session):
        claim = task.get("claim")
        if not claim:
            raise ChannelError("Task has no claim")
        if parse_time(claim.get("lease_expires_at"), "lease_expires_at") <= self.now():
            raise ChannelError("Task lease has expired; claim it again before submitting")
        if claim.get("actor") != actor:
            raise ChannelError("Task is claimed by another actor")
        if claim.get("session_id") != session:
            raise ChannelError("Task is claimed by another session")
        return claim

    def claim(self, task_id, actor, model, lease_hours=4, session=None):
        actor = require_text(actor, "actor")
        model = require_text(model, "model (use 'unknown' if not observable)")
        session_id = require_text(actor if session is None else session, "session_id")
        if not math.isfinite(lease_hours) or lease_hours <= 0:
            raise ChannelError("lease-hours must be a positive finite number")
        with self.lock():
            task = self.task(task_id)
            if task["status"] not in {"OPEN", "CLAIMED", "CHANGES_REQUESTED"}:
                raise ChannelError(f"Cannot claim task in {task['status']}")
            old = task.get("claim")
            if old and parse_time(old["lease_expires_at"]) > self.now():
                if old.get("actor") != actor or old.get("session_id") != session_id:
                    raise ChannelError("An unexpired local lease belongs to another actor/session")
            elif old:
                self.event(task, "LEASE_EXPIRED", actor, previous_claim=old)
            task["claim"] = {"actor": actor, "model": model, "session_id": session_id,
                             "session_id_source": "explicit" if session is not None else "actor_identifier",
                             "claimed_at": stamp(self.now()), "lease_expires_at": stamp(self.now() + timedelta(hours=lease_hours))}
            task["status"] = "CLAIMED"
            self.event(task, "CLAIMED", actor, claim=task["claim"])
            self.write_task(task)
            return task

    def delivery_path(self, delivery_id):
        return self.output_path("work/deliveries/" + identifier(delivery_id, "delivery_id") + ".json")

    def delivery(self, task):
        did = task.get("current_delivery_id")
        if not did:
            raise ChannelError("Task has no submitted delivery")
        value = self.read_json(self.delivery_path(did))
        check_seal(value, "manifest_sha256")
        if value.get("task_id") != task["task_id"] or value.get("revision") != task["revision"]:
            raise ChannelError("Delivery revision does not match the task")
        if value.get("scope", "episode") != task["scope"] or value.get("episode_id") != task.get("episode_id"):
            raise ChannelError("Delivery scope or episode does not match the task")
        expected = digest({"task_id": value["task_id"], "revision": value["revision"], "artifacts": value["artifacts"]})
        if value.get("bundle_sha256") != expected:
            raise ChannelError("Delivery bundle hash mismatch")
        return value

    def check_artifacts(self, delivery, check_live=True):
        if not delivery.get("artifacts"):
            raise ChannelError("A delivery must contain at least one artifact")
        for artifact in delivery["artifacts"]:
            paths = [artifact["snapshot_path"]]
            if check_live:
                paths.append(artifact["path"])
            for relative in paths:
                path, _ = self.relative_file(relative)
                data = path.read_bytes()
                if sha256_bytes(data) != artifact["sha256"] or len(data) != artifact["size_bytes"]:
                    raise ChannelError(f"Stale artifact hash: {relative}; submit a new revision")

    def submit(self, task_id, artifacts, actor, session=None):
        actor = require_text(actor, "actor")
        session_id = require_text(actor if session is None else session, "session_id")
        if not artifacts:
            raise ChannelError("At least one --artifact is required")
        with self.lock():
            task = self.task(task_id)
            if task["status"] != "CLAIMED":
                raise ChannelError("Only a CLAIMED task can be submitted")
            claim = self.active_claim(task, actor, session_id)
            revision = task["revision"] + 1
            did = f"{task_id}-r{revision:04d}"
            entries, contents, seen = [], [], set()
            for name in artifacts:
                path, relative = self.relative_file(name)
                if relative.startswith(("work/tasks/", "work/reviews/", "work/deliveries/")):
                    raise ChannelError("Task/review/delivery ledgers cannot be submitted as their own artifacts")
                if relative in seen:
                    raise ChannelError("Duplicate artifact path")
                seen.add(relative)
                data = path.read_bytes()
                snapshot = f"work/deliveries/{did}/artifacts/{relative}"
                entries.append({"path": relative, "snapshot_path": snapshot, "sha256": sha256_bytes(data), "size_bytes": len(data)})
                contents.append((snapshot, data))
            entries.sort(key=lambda x: x["path"])
            body = {"schema_version": "1.0", "delivery_id": did, "task_id": task_id,
                    "scope": task["scope"], "episode_id": task.get("episode_id"), "revision": revision,
                    "previous_delivery_id": task.get("current_delivery_id"), "submitted_at": stamp(self.now()),
                    "producer": {k: claim[k] for k in ("actor", "model", "session_id")}, "artifacts": entries}
            body["bundle_sha256"] = digest({"task_id": task_id, "revision": revision, "artifacts": entries})
            manifest = sealed(body, "manifest_sha256")
            if self.delivery_path(did).exists():
                previous = self.read_json(self.delivery_path(did))
                check_seal(previous, "manifest_sha256")
                input_keys = ("delivery_id", "task_id", "revision", "episode_id", "previous_delivery_id", "producer", "artifacts", "bundle_sha256")
                if (previous.get("scope", "episode") != body["scope"]
                        or any(previous.get(key) != body[key] for key in input_keys)):
                    raise ChannelError("An orphaned revision exists with different inputs; inspect it before retrying")
                manifest = previous
            # Preflight the whole destination set before creating any artifact.
            destination_manifest = self.delivery_path(did)
            destinations = [(self.output_path(name), data) for name, data in contents]
            for destination, data in destinations:
                immutable_write(destination, data)
            immutable_write(destination_manifest, json_bytes(manifest))
            task["revision"] = revision
            task["current_delivery_id"] = did
            task["status"] = "IN_REVIEW"
            self.event(task, "SUBMITTED", actor, delivery_id=did, revision=revision, bundle_sha256=manifest["bundle_sha256"])
            self.write_task(task)
            return manifest

    def reviews(self, delivery):
        results = []
        for path in sorted((self.root / "work/reviews").glob("*.json")):
            value = self.read_json(path)
            if value.get("task_id") != delivery["task_id"] or value.get("delivery_id") != delivery["delivery_id"]:
                continue
            check_seal(value, "record_sha256")
            if value.get("revision") != delivery["revision"] or value.get("bundle_sha256") != delivery["bundle_sha256"]:
                raise ChannelError("Review targets a stale revision or bundle hash")
            if value.get("role") not in REVIEW_ROLES or value.get("verdict") not in {"pass", "changes_requested"}:
                raise ChannelError("Invalid stored review role or verdict")
            if not isinstance(value.get("blocking"), bool):
                raise ChannelError("Stored review blocking must be boolean")
            require_text(value.get("notes"), "Stored review evidence notes")
            if value.get("notes_sha256") != sha256_bytes(value.get("notes", "").encode("utf-8")):
                raise ChannelError("Review notes hash mismatch")
            reviewer = value.get("reviewer", {})
            if not isinstance(reviewer, dict):
                raise ChannelError("Stored reviewer identity must be an object")
            for key in ("actor", "model", "session_id"):
                require_text(reviewer.get(key), "reviewer." + key)
            producer = delivery["producer"]
            if reviewer.get("actor") == producer.get("actor") or reviewer.get("session_id") == producer.get("session_id"):
                raise ChannelError("Self-review is not an independent review")
            if value.get("role") == "viewer" and not value.get("fresh_context_declared"):
                raise ChannelError("Viewer review requires a declared fresh context")
            results.append(value)
        viewer_sessions = {r["reviewer"]["session_id"] for r in results if r["role"] == "viewer"}
        if any(r["role"] != "viewer" and r["reviewer"]["session_id"] in viewer_sessions for r in results):
            raise ChannelError("Viewer context was reused for a non-viewer review role")
        return results

    def add_review(self, task_id, role, reviewer, model, verdict, notes_file, *, session=None, fresh_context=False, blocking=False):
        reviewer = require_text(reviewer, "reviewer")
        model = require_text(model, "model (use 'unknown' if not observable)")
        session_id = require_text(reviewer if session is None else session, "session_id")
        if role not in REVIEW_ROLES or verdict not in {"pass", "changes_requested"}:
            raise ChannelError("Invalid review role or verdict")
        if role == "viewer" and not fresh_context:
            raise ChannelError("Viewer review needs --fresh-context from an actually separate context")
        if verdict == "pass" and blocking:
            raise ChannelError("A passing review cannot contain blocking findings")
        note_path = Path(notes_file)
        if not note_path.is_absolute():
            note_path = self.root / note_path
        try:
            note_bytes = note_path.read_bytes()
            notes = note_bytes.decode("utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            raise ChannelError("notes-file must be an existing UTF-8 evidence memo") from exc
        require_text(notes.lstrip("\ufeff"), "Review evidence notes")
        with self.lock():
            task = self.task(task_id)
            if task["status"] not in {"IN_REVIEW", "CHANGES_REQUESTED", "DONE"}:
                raise ChannelError("A review requires a submitted task revision")
            delivery = self.delivery(task)
            self.check_artifacts(delivery)
            producer = delivery["producer"]
            if reviewer == producer["actor"] or session_id == producer["session_id"]:
                raise ChannelError("Self-review is forbidden: reviewer actor and session must differ from producer")
            previous_reviews = self.reviews(delivery)
            if any(r["reviewer"]["session_id"] == session_id and r["role"] != role and (role == "viewer" or r["role"] == "viewer") for r in previous_reviews):
                raise ChannelError("Viewer review needs a session not used for other review roles")
            rid = f"{task_id}-r{task['revision']:04d}-{role}-{uuid.uuid4().hex[:12]}"
            body = {"schema_version": "1.0", "review_id": rid, "task_id": task_id,
                    "delivery_id": delivery["delivery_id"], "revision": task["revision"],
                    "bundle_sha256": delivery["bundle_sha256"], "role": role, "verdict": verdict,
                    "blocking": verdict == "changes_requested" or blocking,
                    "reviewer": {"actor": reviewer, "model": model, "session_id": session_id},
                    "cross_model": model != producer["model"], "fresh_context_declared": bool(fresh_context),
                    "context_verification": "caller_declaration_not_runtime_attestation",
                    "notes_source_name": note_path.name, "notes": notes,
                    "notes_sha256": sha256_bytes(note_bytes), "created_at": stamp(self.now())}
            value = sealed(body, "record_sha256")
            immutable_write(self.output_path("work/reviews/" + rid + ".json"), json_bytes(value))
            if value["blocking"]:
                task["status"] = "CHANGES_REQUESTED"
            self.event(task, "REVIEW_RECORDED", reviewer, review_id=rid, verdict=verdict, blocking=value["blocking"], role=role)
            self.write_task(task)
            return value

    def completion_checks(self, task, *, check_live=True):
        delivery = self.delivery(task)
        self.check_artifacts(delivery, check_live=check_live)
        required = task.get("required_review_roles", task.get("required_reviews", []))
        if not required:
            raise ChannelError("No required review roles have been configured")
        reviews = self.reviews(delivery)
        if any(r.get("blocking") or r.get("verdict") == "changes_requested" for r in reviews):
            raise ChannelError("Unresolved blocking review; preserve it and submit a corrected new revision")
        passed = {r["role"] for r in reviews if r.get("verdict") == "pass"}
        missing = sorted(set(required) - passed)
        if missing:
            raise ChannelError("Missing passing current-revision reviews: " + ", ".join(missing))
        return delivery, reviews

    def complete(self, task_id, actor):
        with self.lock():
            task = self.task(task_id)
            if task["status"] not in {"IN_REVIEW", "CHANGES_REQUESTED"}:
                raise ChannelError("Only a submitted revision can be completed")
            delivery, reviews = self.completion_checks(task)
            task["status"] = "DONE"
            task["completed_at"] = stamp(self.now())
            self.event(task, "COMPLETED", actor, delivery_id=delivery["delivery_id"], review_ids=[r["review_id"] for r in reviews], scope="TASK_DELIVERY_ONLY_NOT_VIDEO_READY")
            task["claim"] = None
            self.write_task(task)
            return {"task_id": task_id, "status": "DONE", "revision": task["revision"], "delivery_id": delivery["delivery_id"], "video_ready": None, "scope": "Task delivery completed; no media readiness or publication asserted."}

    def change_state(self, task_id, action, actor, reason):
        actor, reason = require_text(actor, "actor"), require_text(reason, "reason")
        if action not in {"block", "cancel", "retry"}:
            raise ChannelError("Unknown task action")
        with self.lock():
            task = self.task(task_id)
            old = task["status"]
            if action == "retry":
                if old not in {"BLOCKED", "CANCELLED", "CHANGES_REQUESTED", "DONE"}:
                    raise ChannelError("Retry requires a blocked, cancelled, changes-requested, or completed task")
                task["status"] = "OPEN"
                task["attempt"] = task.get("attempt", 1) + 1
                task["claim"] = None
                task.pop("completed_at", None)
                task["blocked_reason"] = None
            elif action == "block":
                if old in {"DONE", "CANCELLED", "BLOCKED"}:
                    raise ChannelError(f"Cannot block a task in {old}")
                task["status"] = "BLOCKED"
                task["blocked_reason"] = reason
                task["claim"] = None
            else:
                if old in {"DONE", "CANCELLED"}:
                    raise ChannelError(f"Cannot cancel a task in {old}")
                task["status"] = "CANCELLED"
                task["claim"] = None
            self.event(task, action.upper(), actor, reason=reason, previous_state=old,
                       preserved_delivery_id=task.get("current_delivery_id"), revision=task["revision"])
            self.write_task(task)
            return task

    def channel(self):
        charter = self.read_json(self.root / "channel/charter.json")
        ref = charter.get("audience_ref")
        if ref != "channel/audience.json":
            raise ChannelError("The channel must have one shared channel/audience.json reference")
        audience = self.read_json(self.root / ref)
        if audience.get("scope") != "channel":
            raise ChannelError("Audience scope must be channel")
        return charter, audience

    def brief(self, hid):
        charter, audience = self.channel()
        catalog = self.read_json(self.root / "editorial/catalog.json")
        episode = next((x for x in catalog if x.get("h_id") == hid), None)
        if episode is None:
            raise ChannelError(f"Unknown episode: {hid}")
        if episode.get("audience_ref") != charter["audience_ref"]:
            raise ChannelError("Episode must inherit the channel audience reference")
        fields = ["h_id", "source_working_title", "source_review_title", "source_day", "editorial_review_status", "story_question", "physical_anchor", "technical_mechanism", "industry_choice", "economic_social_context", "viewer_payoff", "proposed_p_ids", "current_media_status", "release_slot"]
        return {"audience_ref": charter["audience_ref"], "channel_audience": audience,
                "episode": {key: episode.get(key) for key in fields},
                "legacy_classification_note": "Historical per-episode interest tags are provenance, not separate video audiences; they are omitted from the active brief."}

    def metric_rows(self, path):
        try:
            raw = path.read_text(encoding="utf-8-sig")
        except OSError as exc:
            raise ChannelError(f"Cannot read metrics CSV: {path.name}") from exc
        reader = csv.DictReader(io.StringIO(raw))
        if reader.fieldnames != METRIC_FIELDS:
            raise ChannelError("Metrics CSV header must be: " + ",".join(METRIC_FIELDS))
        rows, placeholders = [], 0
        for line_number, row in enumerate(reader, 2):
            if None in row or any(v is None for v in row.values()):
                raise ChannelError(f"Malformed CSV row {line_number}")
            row = {k: v.strip() for k, v in row.items()}
            if not row["value"] and not any(row[k] for k in ["observed_at", "video_id", "source", "source_ref"]):
                placeholders += 1
                continue
            if row["observed_at"]:
                parse_time(row["observed_at"], f"row {line_number} observed_at")
            if row["metric"] not in METRIC_UNITS:
                raise ChannelError(f"Unknown metric on row {line_number}: {row['metric']}")
            if row["unit"] not in METRIC_UNITS[row["metric"]]:
                raise ChannelError(f"Invalid unit for {row['metric']} on row {line_number}")
            if row["video_id"] and row["metric"] in CHANNEL_METRICS:
                if not row["video_id"].startswith("channel:") or not row["video_id"][8:].strip():
                    raise ChannelError("Channel metrics require video_id=channel:<actual-channel-id>")
            if row["metric"] in PERCENT_METRICS and row["video_id"].startswith("channel:"):
                raise ChannelError("Video retention/click metrics require an actual video_id")
            if row["value"]:
                for k in METRIC_FIELDS:
                    require_text(row[k], f"row {line_number} {k}")
                try:
                    number = float(row["value"])
                except ValueError as exc:
                    raise ChannelError(f"Invalid metric value on row {line_number}") from exc
                if not math.isfinite(number):
                    raise ChannelError(f"Non-finite metric value on row {line_number}")
                metric = row["metric"]
                if metric in COUNT_METRICS and (number < 0 or not number.is_integer() or row["unit"] != "count"):
                    raise ChannelError(f"{metric} must be a non-negative integer with unit=count")
                if metric == "ctr":
                    limits = {"percent": 100, "fraction": 1}
                    if row["unit"] not in limits or not 0 <= number <= limits[row["unit"]]:
                        raise ChannelError("ctr needs unit=percent (0..100) or fraction (0..1)")
                if metric in PERCENT_METRICS and not 0 <= number <= 100:
                    raise ChannelError(f"{metric} needs unit=percent (0..100)")
                if metric in {"average_view_duration_seconds", "watch_time_hours"} and number < 0:
                    raise ChannelError("Duration metrics cannot be negative")
                row["value"] = int(number) if number.is_integer() else number
            else:
                row["value"] = None
            rows.append(row)
        return rows, placeholders

    def import_metrics(self, csv_file):
        incoming, placeholders = self.metric_rows(Path(csv_file).resolve())
        with self.lock():
            destination = self.output_path("analytics/observations.csv")
            existing, _ = self.metric_rows(destination) if destination.exists() else ([], 0)
            keys = {canonical_bytes(row) for row in existing}
            additions = []
            for row in incoming:
                key = canonical_bytes(row)
                if key not in keys:
                    keys.add(key)
                    additions.append(row)
            if additions or not destination.exists():
                buffer = io.StringIO(newline="")
                writer = csv.DictWriter(buffer, fieldnames=METRIC_FIELDS, lineterminator="\n")
                writer.writeheader()
                writer.writerows(existing + additions)
                atomic_write(destination, buffer.getvalue().encode("utf-8"))
            return {"imported_rows": len(additions), "ignored_template_rows": placeholders,
                    "null_values": sum(x["value"] is None for x in additions),
                    "measured_values": sum(x["value"] is not None for x in existing + additions),
                    "youtube_connection": None, "analysis": "Imported observations only; no causal inference or fabricated measurements."}

    def status(self):
        charter, _ = self.channel()
        tasks, counts = [], {s: 0 for s in sorted(STATES)}
        for path in self.task_paths():
            task = self.task(path.stem)
            counts[task["status"]] += 1
            claim = task.get("claim")
            tasks.append({"task_id": task["task_id"], "scope": task["scope"], "episode_id": task.get("episode_id"), "status": task["status"],
                          "revision": task["revision"], "owner": claim.get("actor") if claim else None,
                          "lease_expired": parse_time(claim["lease_expires_at"]) <= self.now() if claim else None})
        metrics_path = self.root / "analytics/observations.csv"
        rows, _ = self.metric_rows(metrics_path) if metrics_path.exists() else ([], 0)
        return {"channel": charter.get("channel_name"), "audience_ref": charter["audience_ref"], "tasks": tasks,
                "task_counts": counts, "video_ready_count": None, "youtube_connection": None,
                "analytics": {"rows": len(rows), "measured_values": sum(x["value"] is not None for x in rows),
                              "null_values": sum(x["value"] is None for x in rows)},
                "scope": "Local repository observations; task DONE is not video READY."}

    def validate(self):
        charter, _ = self.channel()
        catalog = self.read_json(self.root / "editorial/catalog.json")
        proposals_path = self.root / "editorial/proposals.json"
        proposals = self.read_json(proposals_path) if proposals_path.exists() else []
        if not isinstance(catalog, list) or not isinstance(proposals, list):
            raise ChannelError("Catalog and proposals must be arrays")
        hids = [x.get("h_id") for x in catalog]
        if any(not x for x in hids) or len(set(hids)) != len(hids):
            raise ChannelError("Catalog H IDs must be unique and non-empty")
        pids = [x.get("p_id") for x in proposals]
        if any(not x for x in pids) or len(set(pids)) != len(pids):
            raise ChannelError("Proposal P IDs must be unique and non-empty")
        forbidden = {"target_audience", "primary_audience", "secondary_audience", "target_reader"}
        for row in catalog + proposals:
            if row.get("audience_ref") != charter["audience_ref"]:
                raise ChannelError("All episodes and proposals must reference the shared channel audience")
            if forbidden.intersection(row):
                raise ChannelError("Per-video target audience fields are forbidden in operational records")
        for row in proposals:
            if any(h not in hids for h in row.get("source_h_ids", [])):
                raise ChannelError("Proposal contains an unknown H lineage")
        task_count = 0
        for path in self.task_paths():
            task = self.task(path.stem)
            task_count += 1
            if task["status"] == "CLAIMED" and not task.get("claim"):
                raise ChannelError("CLAIMED task is missing its lease")
            if task.get("claim"):
                claim = task["claim"]
                for key in ("actor", "model", "session_id"):
                    require_text(claim.get(key), "claim." + key)
                if parse_time(claim["lease_expires_at"]) <= parse_time(claim["claimed_at"]):
                    raise ChannelError("Lease expiry must be after claim time")
            if task["status"] in {"IN_REVIEW", "CHANGES_REQUESTED", "DONE"}:
                delivery = self.delivery(task)
                self.check_artifacts(delivery, check_live=task["status"] != "DONE")
                self.reviews(delivery)
            if task["status"] == "DONE":
                self.completion_checks(task, check_live=False)
        metrics = self.root / "analytics/observations.csv"
        if metrics.exists():
            self.metric_rows(metrics)
        return {"status": "PASS", "catalog_count": len(catalog), "proposal_count": len(proposals), "task_count": task_count,
                "scope": "Local schema, references, current artifact hashes and declared review separation.",
                "not_verified": ["model/runtime identity", "actual fresh-context isolation", "truth of review notes", "video readiness", "Git branch concurrency", "YouTube connection"]}


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=str(Path(__file__).resolve().parents[1]))
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("status")
    commands.add_parser("validate")
    brief = commands.add_parser("brief")
    brief.add_argument("episode")
    task = commands.add_parser("task").add_subparsers(dest="action", required=True)
    claim = task.add_parser("claim")
    claim.add_argument("task_id")
    claim.add_argument("--actor", required=True)
    claim.add_argument("--model", required=True)
    claim.add_argument("--session")
    claim.add_argument("--lease-hours", type=float, default=4)
    submit = task.add_parser("submit")
    submit.add_argument("task_id")
    submit.add_argument("--artifact", action="append", required=True)
    submit.add_argument("--actor", required=True)
    submit.add_argument("--session")
    for action in ("block", "cancel", "retry"):
        cmd = task.add_parser(action)
        cmd.add_argument("task_id")
        cmd.add_argument("--actor", required=True)
        cmd.add_argument("--reason", required=True)
    complete = task.add_parser("complete")
    complete.add_argument("task_id")
    complete.add_argument("--actor", required=True)
    review = commands.add_parser("review").add_subparsers(dest="action", required=True).add_parser("add")
    review.add_argument("--task", required=True)
    review.add_argument("--role", choices=sorted(REVIEW_ROLES), required=True)
    review.add_argument("--reviewer", required=True)
    review.add_argument("--model", required=True)
    review.add_argument("--session")
    review.add_argument("--verdict", choices=["pass", "changes_requested"], required=True)
    review.add_argument("--notes-file", required=True)
    review.add_argument("--fresh-context", action="store_true")
    review.add_argument("--blocking", action="store_true")
    metrics = commands.add_parser("metrics").add_subparsers(dest="action", required=True).add_parser("import")
    metrics.add_argument("csv_file", nargs="?")
    metrics.add_argument("--file", dest="file_option")
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    repo = ChannelRepo(args.repo)
    try:
        if args.command == "status":
            result = repo.status()
        elif args.command == "validate":
            result = repo.validate()
        elif args.command == "brief":
            result = repo.brief(args.episode)
        elif args.command == "task":
            if args.action == "claim":
                result = repo.claim(args.task_id, args.actor, args.model, args.lease_hours, args.session)
            elif args.action == "submit":
                result = repo.submit(args.task_id, args.artifact, args.actor, args.session)
            elif args.action == "complete":
                result = repo.complete(args.task_id, args.actor)
            else:
                result = repo.change_state(args.task_id, args.action, args.actor, args.reason)
        elif args.command == "review":
            result = repo.add_review(args.task, args.role, args.reviewer, args.model, args.verdict, args.notes_file,
                                     session=args.session, fresh_context=args.fresh_context, blocking=args.blocking)
        else:
            if bool(args.csv_file) == bool(args.file_option):
                raise ChannelError("Provide exactly one metrics CSV path")
            result = repo.import_metrics(args.csv_file or args.file_option)
        print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))
        return 0
    except (ChannelError, OSError) as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
