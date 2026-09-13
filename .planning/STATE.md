# Current state

Phase 5 implements the owner-requested activity consolidation and offline listening games in draft [PR #6](https://github.com/kartikkp/Doodle-fun/pull/6), branch `codex/consolidated-listening-play`. Implementation is reviewable; final native touch/audio QA and new store screenshots are still pending. Do not mark this phase fully verified or the app ready to submit.

## Current behavior and bundle

- 21 distinct home families contain 34 modes: all 30 prior exercises plus Sound detective, Higher or lower, Melody echo and Beat studio.
- Doodle studio contains Free draw and Coloring pages. Tracing, arithmetic, quantity, ordering, matching and navigation variants have shared home cards with explicit mode choices. Old links, saved artwork, progress and separate mode support remain valid.
- Listening games use local generated audio, exact starting ages 2–10, replay, model hints, independent Game sound/volume, and recoverable mistakes. Successful playback is required before a listening result can score. No microphone, remote audio or recording dependency was added.
- Final current runtime `d93e19bf622087d0`, HTML SHA-256 `65542141b0278404fe4948a698141401f412c4a9e52c38f812c4c5ab5381ff6e`. Source, standalone and native bundle are synchronized. Application/test commit `e71fdb7` adds explicit native inactivity/foreground delivery after the audio recovery and capture/control fixes.
- Review found and fixed a real legacy-tab difficulty/Coach mismatch, malformed preference crashes, and an asynchronous audio interruption/retry race. Retired audio contexts cannot affect a replacement.

## Verification and current blocker

Current syntax checks and 79/79 Node tests passed. Complete independent CI on earlier application/test commit `f5e101b`, runtime `ad3544bbd06a552e`, passed 628/628 Chromium/WebKit cases, including all 84 listening cases without skips, an unsigned iPhone Release build, and 282/282 native gameplay/bridge/layout cases. CI run 34782058175 passed the subsequent `9a819bdfd018e8e0` runtime; run 34782519314 also passed 79 Node, 628 browser and 282 native gameplay/bridge/layout cases on that runtime, but its added native audio step failed one of four cases. Three sound games completed through real native playback. Beat studio retained its heard state after Home → activate, exposing a separate lifecycle gap. Current runtime `d93e19bf622087d0` fixes that gap. Final revision `3011df2` passed CI run 34787562004: **79 Node, all 630 browser cases without skips (86 listening), an unsigned iPhone Release build, 283 native gameplay/bridge/layout cases and all four trusted native audio playthroughs.** The native sound flows use age two; the browser cases cover every age 2–10.

Local iPhone 17 Pro/iOS 26.5 and iPhone SE 3/iOS 18.6 each passed all 270 retained age/mode gameplay cases and 11 bridge/gate cases on `ad3544bbd06a552e`. Local trusted touch/audio runs then suffered severe host stalls. A real native Listen tap left the AudioContext suspended with a pending resume and no advancing clock; the app kept answers locked and offered retry. A later host check confirmed the Mac was locked. Speakers are present. The locked host’s playback startup remains a local validation limit; the final independent CI establishes passing native playback and completion on its simulator.

The owner has been asked to unlock the Mac and reply when ready. No further local UI runs while locked. The final audio recovery fix addresses a separately confirmed lifecycle race; it does not prove the initial native playback issue is resolved. Four trusted native audio playthroughs now run in CI. Their Beat studio background-return failure led to explicit native pause delivery and a visible-document regression; the strengthened test also waits for an actual running/suspended background state before returning. The final CI verifies the correction without loosening its heard-before-scoring assertions.

After unlock:

1. Verify pristine current-runtime sound on one dedicated QA phone using temporary `caffeinate -di`. If needed, continue prepared copied-app audio-session diagnostics. Never simulate playback success or weaken the heard-before-scoring guard.
2. Complete the four native sound tests and remaining native touch/layout checks serially on iPhone 17 Pro and SE. One UI driver and one dedicated QA phone at a time.
3. Capture and visually review ten new iPhone/iPad store screenshots. Existing images and manifests remain explicitly labeled as the previous `05facec229a9211d` revision; they cannot represent the new catalog.
4. Update the current QA report with exact runtime-specific evidence, finish PR review, and keep merge/publication separate from unrequested App Store submission.

Raw evidence and copied projects are retained in workspace `work/consolidation-qa*` directories. See `docs/consolidated-listening-qa.md` for versioned results and `docs/consolidated-listening-review.md` for the mode/age design rationale.

## Preserved owner state and release context

The owner’s uncommitted `ios/DoodleFun.xcodeproj/project.pbxproj` is excluded from all commits and remains SHA-256 `bd176defe8efbb0185dc1f6a46249abc36317269bc03e885c9daffd54b56a445`. Signing settings and personal simulator `139E0398-D2DC-4BC2-86D3-C543BADC3C56` remain untouched. Native testing and capture use copied projects and separate simulator IDs.

Earlier coached/native work and full iPhone QA were merged in PRs #3–4. PR #5 added privacy/support, per-action parental approval and App Store listing materials; their historical evidence remains versioned in `docs/iphone-qa-report.md` and `docs/app-store/qa.md`. Main/public Pages still carries that earlier revision until PR #6 is merged.

Store defaults remain drafts: free, Education, Kids 6–8, United States, manual release. No account contact, legal seller, App Store record, signed upload or review submission has been performed. Physical-device TestFlight listening, device volume/Silent-mode/headphone behavior, VoiceOver, Pencil, actual sharing destinations and observed child playtesting remain separate. Automated gameplay and sound-signal checks do not establish child enjoyment or developmental outcomes.
