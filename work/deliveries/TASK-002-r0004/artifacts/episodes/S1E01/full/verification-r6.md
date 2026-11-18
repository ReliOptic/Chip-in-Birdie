# 261117 · S1E01 R6 verification boundaries

The final standalone HTML is **26,097,838 bytes**, SHA-256
`3a35e544211990f17cd3d49bf21135ca97963cc8431627ee0ea35fcb61ba1395`.
Actual PCM duration is **384.411333 seconds**: 44 utterances, six chapters,
66 gapless authored shots. Sixteen photographic assets appear; seventeen are
packaged and credited. This is the archive-led R6, not approval of R3–R5.

## Actual browser observations

The final build played continuously from 00:00 through its natural 06:24 end
in managed Chromium. No seek, pause, reload or tab change interrupted that
run. Replay returned to 00:00. This is actual player execution, not a human
listening or enjoyment review.

Pause, 11.93-second paused restoration after reload, English/Korean/off
captions, mute state, transcript seek, passage-specific evidence and archive
credits were observed. Native fullscreen was unavailable; the implemented
CSS cinema view worked, with both Escape and Exit returning to the same
paused position. Its caption area was visually separate from picture labels.

The runtime's visible diagnostic UI read actual Canvas pixels at eleven
sample times, then in reverse order: all hashes matched. Two actual
OfflineAudioContext bakes of fourteen cues matched across 9,225,872 samples.
Diagnostic timings include rendering and pixel hashing; they are **not**
playback FPS measurements.

The production URL opened directly, loaded R6 and played forward with Korean
captions. The full-duration run was on the same final asset build in managed
preview, not a second full-duration production run. The page width equaled
the 1363-pixel desktop viewport. Actual mobile/Safari/touch was not tested.

A production Download HTML click did not yield a completed download event
within the browser tool's 20-second wait. The packaged file and its equality
to the standalone build are byte-verified; successful browser download
completion is **not claimed**.

Raw observations: [qa-browser-r6.json](qa-browser-r6.json).

## Other checks

- [qa-r6-runtime.json](qa-r6-runtime.json): 30 bounded production-control/mock
  and actual asset-graph checks passed. These are not a replacement for pixels,
  listening or historical review.
- [audio-r6-report.json](audio-r6-report.json): all 44 rows preserve the locked
  script; WAV/MP3 decode to the same sample count without clipping. ASR is a
  proxy, not human listening. NVIDIA pronunciation around r28–r30 and r35
  remains a listening-review point.
- [shot-index-r6.json](shot-index-r6.json): continuous 0–384.411333 coverage,
  shortest shot 3.0562 seconds, sixteen used photograph IDs.
- [review-r6.md](review-r6.md): separate selected-frame critique, concrete
  historical-image attribution and legibility corrections; no final release
  approval.
- Archive provenance, dates, licenses and crop/overlay modifications travel
  in the distributed credits. Modern portraits and object photos are not
  mislabeled as photographs of the 1980s/1990s events.
- Project workflow/catalog checks are distinct from film quality; the
  repository's existing editorial lineage and unrelated CSV edits are preserved.

## Publication and remaining limits

Sites version 3 succeeded on the existing project and URL, from source commit
`8573b176bec71a6f81e9f6d8be3e6f0a6de02449`. Its pre-existing public
audience (access revision 2) was preserved; this task did not change sharing.
See [media-bundle.json](media-bundle.json) for exact native IDs and hashes.

Independent full audiovisual release QA, actual mobile-device testing and
human full listening remain open. The film is not marked READY/DONE, does not
increase finished-episode count, and has not been uploaded to YouTube.
No MP4 or next episode was produced.
