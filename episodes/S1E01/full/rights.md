# S1E01 full-r3 asset, voice and software register

Date: 2026-11-17. This addendum covers the full-length continuation of PR #4.
The [r1 register](../rights.md) remains a historical record of the earlier
six-second scene and narration draft, not the inventory for this revision.
This register documents provenance and disclosure; it is not release approval.

## Revision history

- **r1:** the earlier six-second scene and narration draft, preserved in the
  linked historical register.
- **full-r2:** the first full-length script, narration and procedural picture
  inventory. Its measured audio results apply only to its own script hash.
- **full-r3:** thirteen utterances were revised to strengthen the customer
  story, including a paraphrase of Huang's 2007 account of Chang's customer
  visits. No historical interview recording, speaker imitation or invented
  dialogue was added. Narration hashes, timing and rendered evidence must match
  this revision; r2 results are not approval of the revised film.

## Authored picture and text

| Item | Origin and scope | Limits |
| --- | --- | --- |
| Design, archive, business-boundary and return scenes | New procedural geometry, materials, camera paths and canvas label textures in `worlds.mjs`, coordinated by `film.mjs` | The L-shaped layout is fictional, not a real customer's circuit. Source-dossier sheets are authored summaries, not archival scans. |
| Layer, probing and capacity scenes | New procedural models and animation in `mechanisms.mjs` | Exaggerated dimensions and explanatory states, not a process recipe, measured yield, actual capacity allocation or proprietary equipment model. |
| Modern fab and wafer handoff | The authored PR #4 scene, recovered as `scene.glb` from the existing review HTML by `recover-assets.mjs`; original modeling source is `../hero.py` | Reused from the same production, not downloaded as a commercial model. It is not actual TSMC footage or a reconstruction of the 1987 factory. Full-length renderer/material adjustments do not turn it into a validated equipment twin. |
| English script and Korean subtitle text | Authored documentary paraphrases, interpretation and translation in `script.json` | No invented historical dialogue. Korean text is a translation track, not recovered human Korean performance. |
| Historical source material | Public primary records and attributed retrospective accounts listed in `sources.json`, mapped in `claims.json` | Reading a source does not confer permission to reproduce its pages, photographs, audio or video. No full source pages or recorded interview clips are incorporated in this edit. |
| Names and documentary identifiers | TSMC, ITRI, Philips, Cirrus Logic and Nvidia identify the institutions and companies discussed | No sponsorship, endorsement, official-production status or access to private facilities is claimed. |

No stock footage, stock music, commercial 3D asset pack, customer design data or
non-public company material was added to the full-length picture source.

## Sound

- **Narration:** locally generated Kokoro ONNX v1.0, voice `bm_george`, continuing
  the voice choice of PR #4. It is a bundled synthetic voice; no impersonation of
  Morris Chang or another named human narrator is intended or claimed.
- **Provenance:** implementation source is
  [thewh1teagle/kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx)
  under MIT; the upstream
  [Kokoro-82M model card](https://huggingface.co/hexgrad/Kokoro-82M)
  identifies Apache-2.0 weights. Download URLs, model-file hashes, actual
  utterance sample bounds and generated-audio hashes are recorded in
  [audio-env.md](audio-env.md). Weight licensing is not a claim that every
  possible use of a generated voice has been legally assessed.
- **Effects:** `film.mjs` authors 13 short, seeded PCM cues in three families:
  paper, contact and relay. They use oscillator/noise synthesis and ordered
  Float32 summation, not third-party audio recordings. The r1 statement that
  the draft had no synthetic impact sounds does not apply to the full-length film.
- **Music:** no stock or generated background music is included.
- **Delivery boundary:** the standalone contains the synthesized narration and
  procedural effect code. It does not redistribute Kokoro model weights,
  the voices database, ONNX Runtime or Python packages. Reproduction requires
  acquiring those dependencies under their applicable licenses and notices.
- Signal measurements, hash agreement and ASR comparisons are not listening,
  pronunciation or final-mix approval. No such approval is claimed here.

## Software and typography

- **Three.js r170 and examples:** `three.module.js`, `RoomEnvironment`,
  `GLTFLoader`, `BufferGeometryUtils` and their recovered module dependencies
  are used under MIT. The complete official r170 notice is retained in
  [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt), including copyright and
  permission text. Keep it in every distributed source package and embedded
  standalone copy. The source build embeds notices; the final generated file
  must still be checked before handoff.
- **Fonts:** the original fab contains text geometry made with Blender's
  bundled Bfont. New canvas labels use installed system fonts such as Georgia
  and Arial; the player uses system font fallbacks for English and Korean.
  No third-party font files are bundled. Appearance can vary by the viewer's
  installed fonts; cross-device typography has not been established here.
- **Technique references:** the documented motion studies informed rendering
  and hierarchical separation principles. The full-length source does not claim
  ownership of those general techniques or redistribute the reference demos.

## Remaining release checks

The final bundle needs its own hash-locked check that this inventory and the
complete software notices are present, that source links and statement-level
limits remain reachable, and that no raw source material was inadvertently
embedded. Full-film visual, listening, pronunciation and independent release QA
remain separate from this register. A populated rights register does not by
itself establish video `READY` or permission to publish.
