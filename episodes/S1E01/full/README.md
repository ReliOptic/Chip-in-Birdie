# 261117 · S1E01 — full-length 3D documentary, review build

**TSMC — The Factory That Chose Not to Compete** continues [PR #4](https://github.com/ReliOptic/Chip-in-Birdie/pull/4). This is the full `S1E01-full-r3` picture edit, not the earlier six-second excerpt. It is **IN_PRODUCTION / NOT RELEASE READY**: the compiled artifact exists, but actual full-browser playback and independent listening remain unverified.

The English narration is **540.1766666666666 seconds (9:00.177)**: 61 utterances and 1,121 words, timed from 12,964,240 actual PCM samples at 24 kHz. The picture has ten chapters, eight 3D world families, 41 named shots and 44 phase beats. English and Korean captions are included; Korean is translated text, not a human Korean performance.

## What this episode makes

A fictional L-shaped customer layout is the through-object. The film follows Chang's attributed 1985 proposal, the resources behind the 1987 company, the documented competition boundary, the engineering needed to make another company's design, and the relationship revealed by a Cirrus supply agreement and Huang's 2007 recollection of customer visits. It returns to the original layout as an illustrated packaged device. Neither that geometry nor the modern factory is a historical reconstruction or an electrically simulated circuit.

| Chapter | Picture / narrative work |
| --- | --- |
| A design needs a factory | A physical design and two ownership alternatives establish the customer's dilemma. |
| Taiwan, 1985 | An authored archival desk distinguishes attributed retrospective evidence from present-day explanation. |
| What a promise needs | Capital, ITRI resources and Philips cooperation make the proposed manufacturer possible. |
| A boundary around competition | The 1994 report's charter account anchors the noncompetition boundary. |
| Not a universal printer | Spacing, layer alignment and design/process interfaces explain why a promise needs engineering. |
| The design becomes physical | The original PR #4 fab is retained alongside new schematic process models. |
| A wafer is not the result | Contacting probes and an explicitly illustrative test map distinguish manufacturing from obtaining usable results. |
| From spare capacity to commitment | Contracts and attributed customer visits give the initial demand question a concrete payoff. |
| The risk changes owners | A physical queue illustrates finite capacity without pretending to show actual allocation data. |
| What the customer buys | The initial layout returns; specialist manufacturing and a customer boundary close the episode. |

## Delivered player

The compiled `S1E01-full-documentary.html` embeds its Three.js runtime, original GLB, narration, scene modules, script, claims and notices. No runtime CDN or font download is required. Source links are the only intentional outward navigation.

- Play/pause, seek, chapter navigation and transcript-to-time navigation.
- Korean / English / off subtitles, in-picture and fullscreen controls.
- Current-passage evidence, source locators and explicit claim limitations.
- Saved time, subtitle and mute state; page visibility pause.
- Cancelled pending playback on seek/pause; bounded retry, natural ending and replay.
- Initialization and audio failures have visible retry paths; WebGL context loss preserves position and requests reload.
- Narration is the media clock. Thirteen authored sound cues are scheduled against it; actual browser cue rendering and final mix listening are not yet verified.

Download links and hashes are in [media-bundle.json](media-bundle.json). Open the HTML in a WebGL2-capable desktop browser and press Play. A local HTTP server is an alternative when file-origin policies prevent opening embedded modules. A phone file preview is not equivalent to an actual WebGL browser, and mobile playback is not claimed as tested.

## Reproduce the current artifact

Source stays in Git; large media stays in the separately delivered review bundle. After extracting that bundle, set `S1E01_MEDIA` to its directory, then run from this repository's root:

```bash
node episodes/S1E01/full/build.mjs \
  --assets "$S1E01_MEDIA/assets" \
  --audio "$S1E01_MEDIA/audio" \
  --out "$S1E01_MEDIA/rebuilt"

node --experimental-vm-modules episodes/S1E01/full/qa-contract.mjs \
  --bundle "$S1E01_MEDIA/rebuilt/S1E01-full-documentary.html"
```

`assets/` contains the recovered PR #4 GLB and exact Three.js r170 modules. `audio/` contains the full-r3 narration, timeline and bounded ASR report. The build refuses a partial smoke test, a stale script/audio hash or inconsistent PCM duration. Do not point it at the old r1/r2 audio folder.

To regenerate narration, follow [audio-env.md](audio-env.md) and `audio-build.py`; model weights and voice databases are not redistributed in the media bundle. `recover-assets.mjs` can recover the original asset dependency set from the original review HTML. [rights.md](rights.md) and [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) must travel with the work.

## Verification boundary

Read [verification.md](verification.md) before using this artifact as approval evidence. The 22 contract tests are static and isolated mock tests, not a browser session. CPU model renders inspect actual geometry/camera exports under a different renderer; they are not WebGL screenshots. The fresh-viewer review covers only the exact r3 script. No full audiovisual approval, MP4 export, YouTube upload or next-episode production is represented by this delivery. **Finished episodes: 0.**
