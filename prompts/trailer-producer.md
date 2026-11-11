# Trailer producer (Codex)

`production/TRAILERS.md`가 계약이다. [종합 검진](codex-capability-check.md)을 먼저 돌리고, 그 결과로 계약을 조정한 뒤 쓴다. 아래를 Codex에 그대로 붙여 넣고 `PHASE`와 `EPISODES`만 바꾼다. 이 프롬프트는 PR #1이 main에 병합된 뒤에만 동작한다.

```text
You are the trailer producer for this repository. Read AGENTS.md, FORMULA.md,
channel/CHANNEL.md, editorial/PLAYBOOK.md section 1, and production/TRAILERS.md
before anything else. production/TRAILERS.md is the contract; if this prompt and
that file disagree, the file wins. If production/TRAILERS.md or episodes/<P>/brief.md
is missing from your checkout, stop and report that; do not improvise.

PHASE = 1                         # 0 kit | 1 pilot | 2 batch
EPISODES = P004 P061 P073 P066 P137 P070
LOOKS = clay-diorama-tiltshift x4, flat-isometric-2.5D x1, two-colour-print x1   # phase 1 only
REFERENCE = https://claude.ai/artifact/8K7FzQ6tWSwsx17kf2xMhq  (rated 7/10 by the director; you must beat it)

Work on a branch named trailers/<phase>-<first-episode>. Do not edit files outside
trailers/, and do not edit trailers/_kit/ unless PHASE = 0. Do not ask questions;
decide, and record the decision in trailer.json.

PHASE 0 — build trailers/_kit/
- harness.js: stage sizing with dpr, W/H/UW=min(W,H/1.5), 16:9 <-> 9:16 toggle that
  re-runs setup(W,H); clock with tap-to-pause and a 2px scrub bar; seeded rand/hash,
  spring, ease; word-timed caption engine driven by one SPEECH table; SHOTS=[{t0,t1,
  setup,frame,cut}] with two-shot compositing only inside transitions; audio baked
  with OfflineAudioContext, one context per cue, summed in fixed order in JS;
  window.__seek, window.__meta, window.__ready; #headless hides UI.
- verify.mjs: headless Chrome (playwright if resolvable, otherwise puppeteer);
  performs every check listed under "검증" in production/TRAILERS.md and writes the
  numbers into <episode>/trailer.json. It must exit non-zero on any failure.
- gallery.html + a generator that writes trailers/index.html: a grid of every
  trailer, each cell plays on hover/tap, shows P_ID and verify status by shape and
  position only (no explanatory text, no loading screens).
- An empty example episode that passes verify. Stop after this phase.

PHASE 1 and 2 — for each episode, in this order, without skipping:
1. Inputs. Read episodes/<P>/brief.md, channel/CORE.md and channel/READER.md. The
   trailer IS the brief's "첫 30초" expanded to 30 seconds and ending on its "중심 질문";
   do not invent a different hook. The on-screen title is title A from the brief. The
   thumbnail line in the brief is the composition of your hero shot. Use only tier A
   and B words from READER.md in narration and captions; a tier C word from the
   brief's vocabulary list may appear once, attached to the object it names.
1b. Reference. Read the "기준작" section of production/TRAILERS.md. Keep its look grammar
   (clay-toy diorama, depth-buffer tilt-shift blur as the last pass, props stepped at
   15 Hz while the camera moves in continuous time, cuts locked to spoken words, the
   shortest cut and an audio dropout right before the hit). Do NOT copy its omnibus
   structure or its subjects: one trailer is one event with one protagonist object.
2. Five-line spine, written into trailer.json before any code: the one question;
   the opening promise and the closing line; the protagonist object that stays in
   every shot; the one state change the viewer will see; the sound motif.
2b. Narration. Write 60-75 English words in 4-6 sentences, for the ear: one idea per
   sentence, concrete nouns, no jargon, the last sentence is the question. Synthesize
   each sentence with a free local TTS (kokoro-onnx or equivalent; no paid API), save
   vo/<n>.ogg, and write vo/timeline.json with word-level start/end times. Transcribe
   the audio back (faster-whisper or equivalent) and compare with the script; fix
   mispronounced words by respelling. timeline.json is the single source of timing for
   shots, captions, hit-stops and sound cues. If no TTS can be installed, stop and
   report that; do not ship a silent trailer.
3. Shot list: 5-8 shots, each {start, length, shot size, camera move, cut type,
   reason for the cut, sound cue}. Shortest cut right before the peak.
4. Technique. Pick one hero technique and at most two supporting ones from
   https://github.com/kstost/cokacmotion (read skills/aimotion/demos/<id>/NOTES.md
   raw). Write each as one sentence with the demo's subject removed. Borrow how it is
   built; never its subject, layout, text, colours or framing. If you have a motion
   skill installed, use its technique index instead of browsing.
5. Hero shot first (<= 6 s). Render stills at full size plus a zoomed crop, look at
   them, fix, at least twice. Only then build the remaining shots.
6. Text on screen is English. The briefs are not fact-checked yet. You may use the
   years, names and events written in the brief's "첫 30초", and nothing else. List
   every such factual token in trailer.json under unverified_claims and set status to
   DRAFT_UNVERIFIED. Do not add figures, quotes or causes of your own.
7. Run verify.mjs. If it fails, fix and re-run at most twice. If it still fails,
   leave status FAILED with the reason. Never mark a failed trailer as passed and
   never loosen verify.mjs.
7b. Sound. 8-14 synthesized effects tied to visible events (contact, ignition, cut,
   stop), at most 6 kinds, same frame as the event. One motif stated, varied, resolved.
   Silence for 0.3-0.5 s before the peak. Duck music under narration.
8. Append one line to trailers/ledger.json: look, hero id, palette, transition,
   sound motif, verify numbers. Before choosing for the next episode, read the
   ledger: within one look, do not repeat the same hero technique or transition in
   consecutive episodes.

Hard rules
- Every frame is a pure function of t. No Math.random, Date, timers, CSS transitions,
  requestAnimationFrame-driven state. Simulations are baked in setup() with a fixed
  seed and fixed dt.
- Single self-contained index.html per episode (kit inlined at build). No network
  requests at runtime except three.js from cdnjs when the look is 3D.
- 3D budget: <= 200k triangles, raymarching <= 32 steps at half resolution, no
  per-frame geometry rebuild, soft shadows and shallow depth of field required.
- No MP4, GIF or WebM. PNG snapshots only, <= 12 per episode, in shots/.
- You cannot hear audio. Report cue count, positions and peak level; do not describe
  how it sounds.
- Do not judge your own work as good. Report what is on screen at each snapshot time,
  numbered in the order it should be fixed.

Report (one block per episode, nothing else)
1. Spine (5 lines) and look.
2. Table: shot | hero id (+support) | technique in one sentence | how it was used.
3. Narration script, word count, transcription match rate. Sound: cue count and kinds.
4. verify.mjs output verbatim.
5. What you did not verify.
Then regenerate trailers/index.html, commit, push the branch and open a pull request
against main. One pull request per phase or per batch of ten.
```

## 시즌 1–4 배치

| 순서 | PHASE | LOOKS | EPISODES |
|---|---|---|---|
| 파일럿 = 시즌 1 | 1 | 기준작 룩 4편 + 대안 룩 2편 | P004 P061 P073 P066 P137 P070 |
| 시즌 2 | 2 | 파일럿에서 고른 룩 하나 | P055 P011 P058 P091 P060 P057 |
| 시즌 3 | 2 | 같은 룩 | P046 P041 P120 P025 P045 P147 |
| 시즌 4 | 2 | 같은 룩 | P089 P022 P083 P101 P068 P067 |

- 한 번에 한 시즌, PR 하나. 앞 시즌의 PR을 감독이 본 뒤 다음 시즌을 돌린다.
- 시즌 안에서는 주인공 물체와 소리 모티프를 편마다 다르게, 팔레트와 자막 방식은 같게 한다. 시즌이 재생목록 하나로 보여야 한다.
- 24편 모두 `DRAFT_UNVERIFIED`로 나온다. 게시(Shorts 포함)는 그 편의 G1 뒤에 한다.

## 쓰는 법

- 0단계는 Astra로 한 번. 끝나면 PR을 병합한다.
- 1단계는 위 값 그대로. 갤러리에서 룩 하나를 고른 뒤 `production/TRAILERS.md`에 적는다.
- 2단계는 `PHASE = 2`, `LOOKS`는 고른 룩 하나, `EPISODES`는 위 표의 한 시즌.
- 리뷰는 다른 세션에 `prompts/viewer-reviewer.md`와 갤러리만 준다.
