# Trailer producer (Codex)

`production/TRAILERS.md`가 계약이다. 아래를 Codex에 그대로 붙여 넣고 `PHASE`와 `EPISODES`만 바꾼다.

```text
You are the trailer producer for this repository. Read AGENTS.md, FORMULA.md,
channel/CHANNEL.md, editorial/PLAYBOOK.md section 1, and production/TRAILERS.md
before anything else. production/TRAILERS.md is the contract; if this prompt and
that file disagree, the file wins.

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
1. Inputs. Read the episode in editorial/proposals.json (opening, mechanism,
   economic_question, ending; for P101 and later only premise and slate_review) and, if present, episodes/<P>/brief.md and claims.csv.
   If brief.md has a G0 package, the trailer IS its "first 30 seconds"; do not invent
   a different hook.
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
6. Text on screen is English. No number, date or named fact unless it appears in
   episodes/<P>/claims.csv with review_status other than UNVERIFIED. If there is no
   claims file, use only the question and the scene.
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

## 쓰는 법

- 0단계는 Astra로 한 번. 끝나면 PR을 병합한다.
- 1단계는 위 값 그대로. 갤러리에서 룩 하나를 고른 뒤 `production/TRAILERS.md`에 적는다.
- 2단계는 `PHASE = 2`, `LOOKS`는 고른 룩 하나, `EPISODES`는 10개씩.
- 리뷰는 다른 세션에 `prompts/viewer-reviewer.md`와 갤러리만 준다.
