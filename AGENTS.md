# Chip in Birdie — shared operating contract

## Start here

Read `README.md`, `channel/AUDIENCE.md`, `channel/CHARTER.md`, `DECISIONS.md`, then `ops/WORKFLOW.md` and the specific task. The user's latest explicit direction takes precedence over an earlier plan or assistant proposal.

## Channel audience is shared

- Audience means the channel's potential inflow and returning-viewer community, not an audience label assigned to each episode.
- Every episode inherits `channel/audience.json`. Do not introduce `primary_audience`, `secondary_audience`, `target_audience` or episode-specific personas into active episode records.
- Existing S1–S5 labels are retained only inside `legacy_tags` as historical topic-interest classifications. They are not measured viewers or current targeting instructions.
- Design for a person who has spent a long day doing work unrelated to semiconductors and watches before bed: no preparation, note-taking or separate terminology lookup should be necessary to follow the story. This is a viewing-context requirement, not a claim about measured demographics.
- The repeatable reward is understanding how semiconductor technology, industrial choices, business, economics and society fit together. Do not reduce the channel to trade training, stock tips, daily headlines or unconnected business anecdotes.
- Platform facts, observed channel data, user decisions and editorial hypotheses must be labelled separately. Do not invent recommendation weights, growth guarantees or audience analytics.

## Editorial and evidence

- Preserve H001–H100 and proposal lineage. A working title, proposed release order, source URL or completed task is not a publication approval.
- Establish a concrete situation and stakes, explain only the mechanism needed for this story, show the actual choices and consequences, and return useful context to the viewer. Vary the form when the story calls for it.
- English remains the content master. Korean performance supplies meaning, emphasis and pauses. The inherited 8–9-minute format is a production default, not an algorithmic optimum; scoped exceptions remain scoped.
- Keep factual conditions, counterevidence and uncertainty. Economics and sociology must explain decisions and institutions in the event, rather than being vocabulary appended to a technology lecture.
- Distinguish archival evidence, interpretation, illustrative models and reconstruction. Asset rights are checked independently of factual accuracy.
- Keep user/source feedback, proposals, decisions, reported artifacts and verified execution distinct. Do not turn historical BACKLOG into a claim that no video exists now.

## Multi-model work

- Any model can take a role. Record the actual actor, model identifier, session and revision; never invent a different model or reviewer.
- Claim a task before shared editing. A local lease becomes a shared claim only after its commit is accepted on the coordination branch. Pull and check the current head before claiming; never force-push a stale claim.
- Use separate branches/worktrees and bounded tasks. Do not rewrite another worker's active files without an explicit handoff.
- Submit exact artifact paths and hashes. Reviewers use the submitted revision, not a similarly named file or an old narrative of completion.
- The producing actor cannot approve its own delivery. A separate reviewer/session is required. Another model family is useful when available, but is not a fabricated or mandatory prerequisite.
- A viewer review uses a fresh context containing only the audience promise and viewer-facing artifact. A model's simulated reader review is labelled as such and does not replace observed human viewing.
- Blocking findings need an artifact location, problem, consequence and correction. Revision changes invalidate old approvals; preserve superseded results and failed/cancelled attempts.
- Task `DONE` means a reviewed work item. Video `READY` additionally needs the media bundle and independent release QA described in `ops/WORKFLOW.md`. Only observed platform state can establish `PUBLISHED`.
- The director supervises charter, representative samples, batch performance, feedback and explicit exceptions. Do not create a routine director approval gate for every shot.

## Repository boundaries

- This repository contains the shared channel contract, editorial index, public research leads, operating tools and review records. Original restricted sources and raw media stay at their authorised locations.
- Do not commit credentials, customer/company non-public material, private Drive URLs, personal transcripts or raw unpublished media. Record a non-sensitive source reference and the verification state instead.
- Do not auto-publish videos, schedule uploads, send notifications, spend money or provision paid model calls as part of a repository task unless separately requested.
- Proceed with authorised repository work and reversible fixes. Do not ask the user to reconfirm the audience correction or this repository implementation.

## Completion evidence

Run `python3 tools/channel.py validate`, `python3 tools/check_catalog.py` and `python3 -m unittest discover -s tests -v`. Include review evidence and distinguish local checks, GitHub checks, media playback and publication. Never treat passing structural tests as proof of historical truth, viewing enjoyment, asset rights or channel growth.
