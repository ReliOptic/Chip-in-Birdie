# Independent slate review

Reviewer: `/root/slate_review`, model `gpt-6.1-sol`, separate agent session `slate_review` (actual inherited model; not a separate model family). Date: 2026-11-14 Asia/Seoul. Scope: editorial selection, lineage and structure, not historical fact verification, audience testing or video QA.

Submitted revision: `0d722c7bf3f8034cf883703c5820ca8348e91359` on `production/four-seasons-20261114`.

Verdict: **CHANGES_REQUESTED** for the explicit next-episode discovery-link requirement. This does not block research or scene production; it blocks calling the slate fully complete against the user specification.

## Verified

Read AGENTS.md and current channel/README/DECISIONS/workflow instructions. Independently compared the slate to PR #1 head `3c66e4b97f8c4bafefd80f8b099ad297bfd7610b`, not merely main.

- Four seasons, eight unique episodes each, 32 unique source P IDs; all 24 recovered core choices retained in their user-specified order.
- Added P109/P078, P010/P099, P042/P044, P074/P076 are actual PR candidates, with explicit new-production-judgment reasons.
- All original source titles, source H arrays and selected PR record snapshots match the PR branch exactly.
- P101/P109/P120/P137/P147 correctly have null main P IDs rather than invented P100 equivalents. Every asserted H ID exists in main catalog.
- Every episode initially NOT_STARTED/NOT_READY; no manuscript, historical work status or slate inclusion upgraded media readiness.
- E01 production queue matches P004 → P055 → P046 → P089, followed by E02 cycle.
- Main catalog/proposals left unchanged. Audience remains channel-level.
- Independently ran `tools/channel.py validate`, `tools/check_catalog.py`, and unit tests: PASS, PASS, 33 tests OK. These existing checks do not themselves validate the newly introduced season JSON; direct assertions above did.

## Blocking finding

Location: `editorial/seasons.json:100` and every subsequent `next_connection`; corresponding Next entries in SEASONS.md.

Problem: all 28 in-season transitions repeat “The next episode tests another consequence of this season question; each stands alone.” Four finales repeat a similarly generic resolution. The user explicitly requested each episode's ending reward/next-episode connection to be actually filled. The separate payoff fields are concrete, but the links do not state what curiosity carries into the next story.

Consequence: there is no reviewable editorial connection for the series beyond source ordering, and duplicate scope can drift during scripting.

Correction: replace each next_connection with an episode-specific discovery bridge. Proposed text is in `/workspace/work/slate-transition-suggestions.json`. These are editorial suggestions, not factual claims or approved narration. Mirror the changed text into SEASONS.md. Existing next_episode identifiers can stay.

## Recommended scope refinements before script lock

Location: generic `duplicate_boundary` values throughout seasons.json. Concrete boundaries exist only for GPU-market versus AlexNet episodes. Replace the generic values for these closest pairs:

- S1E01 establishes the pure-play foundry/customer conflict; S1E04 is the RCA/ITRI capability-building process before TSMC; S1E05 concerns the later claimed IBM/process-independence decision and must not repeat the founding story. P137 remains a source-pending premise; its script must not enact a rejected offer as verified history.
- S3E01 concerns Intel capacity allocation and DRAM exit; S3E03 concerns later Japanese product/customer/cost conditions and must not assert “quality caused decline”; S3E05 concerns Samsung's entry and process-learning commitments rather than retelling Intel's exit.
- S3E02 concerns ferrite-core assembly/manufacturing; S3E07 concerns DRAM cell operation, refresh and density economics. Do not repeat the entire core-to-DRAM transition in both.
- S4E05 concerns SEMATECH's US precompetitive manufacturing cooperation; S4E06 concerns Japan's VLSI program and company boundaries. Compare only after establishing differences; the two were not one shared historical program.

Working titles P061 (“Silicon Valley Started…”), P060 (“Nobody Owns”), P045 (“Was Told It Would Fail”) and P068 (“Shared Their Secrets”) remain broad or dependent on a specific unverified claim. They are labelled drafts and may remain lineage, but narrow public titles when evidence is assembled. S4E07's displayed NASA-retest title is narrower than its question/choice about procurement creating a market; decide the emphasis at script lock.

## Submitted artifact hashes

- `editorial/seasons.json`: `d92300da530434ced73b00bc70195164af5f5b5756134a80d2244a1d969d36e0`
- `editorial/SEASONS.md`: `dfce2e6acdcda4d7d34cef949384b2376108e1f67767ec63fb1bcb6af27cfb1c`
- `editorial/provenance/pr1-selected.json`: `30d798948260704fa1c34d829178a869f8741dfd824350e7b972fb2b109b3468`

No direct access to Claude sessions was claimed or attempted in this review. No sources, historical premises, rights, VO listening or rendered playback have been verified. No video readiness approval is provided. Revision changes invalidate this review for changed fields and require a focused recheck.
