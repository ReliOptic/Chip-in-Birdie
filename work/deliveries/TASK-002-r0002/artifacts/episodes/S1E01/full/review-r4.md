# 261117 · S1E01 r4 bounded review and corrections

These are scoped production reviews. They are not independent full-film viewing, listening or release approval. The reviewers did not author the specific script/player changes they reviewed; their model family is not asserted to differ from the producer's.

## Reader follow-up

The first reader context received only the common audience contract and the viewer-facing r4 script, without the producer's research, intended answers or implementation. The reader found three comprehension problems. After the revisions, the same reviewer reread only those two files. The follow-up is **not a new first-exposure test**.

| Finding | Implemented correction | Follow-up observation |
| --- | --- | --- |
| Korean names made Chang's identity and the questioner ambiguous | s02 connects 장중머우 to Morris Chang; later references use that name, and s49 explicitly names the questioner. | The identity/questioner ambiguity is resolved in the script. s20 retains a shortened 창 reference, considered minor because identity is established. |
| Founding history and illustrative manufacturing appeared to be one historical sequence | s25 explicitly steps out of the founding story; s45 explicitly returns to TSMC's early years. | The historical/process boundary is comprehensible. This does not assign the illustration an exact contemporary year. |
| Manufacturing services sounded like responsibility for the whole customer product | s43 states the documented service scope; s61 separates ownership of the next chip from the business of preparing to make it. | The overbroad responsibility implication is resolved in the script. |

The reviewer found no additional major text-comprehension blocker in the final script. The boundary metaphor and transport passage still depend on the picture, so actual visual explanation, listening ease and sustained viewing remain unapproved. A model's reading is not an actual nonexpert audience test.

- Audience SHA-256: `17e8d969d252ee0fa2866ab727aa9878107a263815c1b974000929844582f7f9`
- Final script SHA-256: `277e2e129bb4e3f3752a0acdb2829b91e9918fe38e15586110f51cf9d231c42e`

## Runtime/code follow-up

A separate runtime reviewer inspected the player/build/scene files, then rechecked the three findings after correction without modifying the files. It executed selected production functions with mock media/DOM/audio nodes and inspected the actual Three scene state without a renderer.

| Finding | Implemented correction | Recheck |
| --- | --- | --- |
| Effects could keep running while narration buffered | Waiting stops SFX; playing restarts at `narration.currentTime`. | Production-function tests stop on waiting and restart at 43.125 seconds. Duplicate playing and late playing after pause do not restart incorrectly. |
| Unmuting during buffering could start effects alone | The common `startSfx` guard includes `buffering`. | Mock media/audio tests confirm the guard applies to mute/unmute as well as the normal play path. |
| Growth narration used a withdrawal animation | s45 now uses the dedicated `capacity/growth` phase and growth framing. | Actual scene-state checks show customer lots increasing 0 → 1 → 3, with one committed slot at the end. Returning from withdrawal to the same growth time produces the same state. |

All three specific code findings were resolved at the unchanged hashes below. This does not test deployed browser bytes, real network stalls, Safari gesture policies, rendered quality or actual sound output.

| File | SHA-256 |
| --- | --- |
| `film.mjs` | `384e4822ac768822d7ff24b264b4dcca7a5be3ae7e552d97af85cbbeda366077` |
| `script.json` | `277e2e129bb4e3f3752a0acdb2829b91e9918fe38e15586110f51cf9d231c42e` |
| `cinema.mjs` | `40ce293b168a3e77e9fd50479a8d43660775895986449a551d2b5a0041679db0` |
| `mechanisms.mjs` | `26d23ae65e0f6cef9ac17793fd2c8e8d802c68e676f1c43ebfdae6326185817d` |

No review role has been granted a final approval in the task ledger by this document. The exact immutable submission remains subject to the channel's evidence, editorial, viewer and media release gates.
