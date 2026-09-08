# Full iPhone simulator QA

September 8, 2026 · Xcode 26.6 · Final runtime `c492e0448081570e`
HTML SHA-256: `81f51b5e64a394cc97dba4e573afc179bec287003e943113ac2c5b549af2d14d`

**The planned iPhone simulator QA is complete and passed.** All 30 activities completed meaningful native gameplay at every exact age from 2 through 10 on both phones. Four app defects were corrected. Failed or interrupted cases were diagnosed and rechecked; those failed cases receive no passing credit.

## Devices and results

| Check | iPhone 17 Pro / iOS 26.5 | iPhone SE 3 / iOS 18.6 |
| --- | --- | --- |
| Portrait viewport / top, bottom insets | 402 × 874 / 62, 34 pt | 375 × 667 / 20, 0 pt |
| Landscape viewport / left, right, bottom insets | 874 × 402 / 62, 62, 20 pt | 667 × 375 / 0, 0, 0 pt |
| Final-bundle gameplay: 30 activities × 9 ages | 270 passed | 270 passed |
| Final-bundle native bridge + landscape checks | 6 passed | 6 passed |
| Final-bundle drawing/coloring recovery UI | 3 passed | 3 passed |
| Other focused native UI checks | 6 passed | 6 passed |
| Full catalog sweeps | 4 passed / 120 activity visits | 4 passed / 120 activity visits |
| Full-screen landscape archive | 1 passed / 30 openings | 1 passed / 30 openings |

The complete suite has **290 checks per phone**: 270 gameplay cases, five bridge checks, one native landscape case, and fourteen UI cases. All 580 planned case/device combinations have passing evidence using passing cases from completed runs and relevant fix rechecks; this is not a single 290-test run on each phone. The final-bundle gameplay/drawing runs each passed 279/279 with zero failures or skips. The catalog and other focused UI evidence is versioned separately below. Five earlier portrait catalog cases passed individually within baseline runs that also had failures; only those passing cases are credited.

Dedicated QA simulators and copied Xcode projects protected the owner's existing simulator, saved artwork and signing settings. The source project file's hash remained unchanged throughout QA. No test helpers were added to the shipped HTML or application target.

## What was exercised

**Gameplay — 540 unique age/activity flows.** The tests load the packaged app through its actual `DoodleViewController` and `WKWebView`. Test-only DOM actions select the requested age/card, open Coach, attempt incorrect work, use contextual support, complete a round, check continued play or retained practice, and return home. Arithmetic questions are checked against their displayed quantities. Tracing rejects empty/unrelated/cancelled input and accepts completed paths. Creative flows compare artwork pixels, undo/redo, replacement cancellation and recovery, and persisted PNG contents. Scoped synthetic pointers exercise production canvas/tracing handlers; they are distinct from trusted finger input.

Each final phone run contains 270 unique JSON reports and 1,440 recorded stages, with 30 activities and 160 stages at each age. Helper/poll assertion executions are not presented as distinct requirements. One generated round and representative tracing items per case are covered, not every possible puzzle.

**Trusted native UI — 240 complete catalog visits plus focused tests.** Four full sweeps per phone open every card at ages 2, 6 and 10 in portrait, and age 6 in landscape. Each checks the requested practice, a primary activity control, Coach, the in-game hint and Back. Selected activity/navigation/coaching targets must be enabled, hittable, at least 44 pt in each dimension and inside measured safe boundaries. A separate native layout case measures 15 lower controls across five engines against actual UIKit and CSS safe-area values.

Separate real simulator gestures verify stationary-tap rejection and complete line/cross tracing at ages 2 and 10; drawing, undo/redo, rotation both ways and recovery after app termination/relaunch; new-picture cancel/clear/undo/redo; saved sound settings; and repeated actual PNG share-sheet open/cancel/reopen cycles.

All nine coloring pages receive a touch in a known enclosed region. The checks require the intended region to become coral, an exterior sample to stay white, more than 99% of dark outline pixels to remain, and Undo to restore the picture. All nine corrected fills were visually inspected on the compact phone. This covers one meaningful region per template, not every enclosed region.

**Visual review.** All 30 activity types were inspected in native portrait screenshots at ages 2 and 10. Corrected shape-clue and scrolled word-tracing images confirm the hint and status-bar fixes. All 30 activity types were also visually reviewed in complete age-6 landscape screenshots: thirteen discovery/adventure openings on the primary phone and seventeen drawing/tracing/math openings on the compact phone. Both phones retain all thirty full-screen opening captures. Headings and instructions were readable, and no blocking clipping or overlap was found. Lower boards and choices often require vertical scrolling; the separate landscape touch/geometry checks verify their reachability. The original app-element screenshot API produced incomplete rasters, so those images were replaced for this review.

## App defects fixed

- **Status-bar overlap:** scrolled learning controls appeared behind the compact phone's clock/carrier text. The native shell now masks the top safe area with its background without changing canvas dimensions. Scrolled-word screenshots confirm the unobscured 20 pt status area; rotation measurements confirm the correct landscape inset.
- **Landscape margins:** discovery/adventure controls ignored the notched phone's side insets. Their containers now include safe-area padding. For example, Shape detective's old New round edge at x854 exceeded the safe right edge x812; corrected controls end at x792. Native measurements and full touch sweeps pass on both phones.
- **Conflicting shape clue:** an older-child clue showed a decorative diamond beside a different named shape. It now uses a neutral question marker, replaced by the correct model after a hint. Younger visible models remain. Native and browser checks cover hint/reset behavior.
- **Dinosaur fill leak:** white neck/tail under-strokes cut gaps through the body outline, allowing paint to reach the background. Removing those strokes closes the contour. Stronger tests failed on the original dinosaur in both browser engines, then passed all nine pages after the correction. Both phones passed the stronger native test.

## Test failures investigated

Native accessibility exposed pressed buttons as switches and both aggregate and exact-title card links. Helpers now use observed roles/targets. Short, distance-aware drags replaced long gestures that timed out or overshot compact landscape cards. Full title frames must be visible before querying native hittability, avoiding an XCUITest exception on partly clipped links. Touch-size and safe-boundary assertions remain.

Drawing image comparison now honors landscape orientation metadata; the original 97% ink-coverage tolerance was retained. Separately, Xcode's app-element landscape screenshots omitted part of the image and added a black strip. Capture now uses `XCUIScreen.main.screenshot()` and a dedicated all-30-screen archive. Missing pixels in the old attachments were not classified as app clipping.

One run requested a deleted prior installation's HTML even though the current installed bundle existed and matched its manifest. It failed before game code ran. Restarting only that QA simulator and using a fresh output copy restored the full matrix; no speculative app-code change was made.

The runner also rejects unknown target/class/method combinations, including omitted gameplay tests under `--without-gameplay`. Seven regression tests prevent silently ignored selections from being mistaken for coverage. Actual xcresult test trees, not requested filters, determine the reported counts.

## Evidence and reproduction

The workspace's `work/iphone-qa-coverage-index.json` maps selected passing cases to actual xcresult nodes, bundle manifests, test-source hashes and run metadata. Each output directory retains an `.xcresult`, exact command and timestamped run JSON. Final gameplay folders contain all 270 individual reports and uniqueness summaries.

| Evidence | Workspace output / xcresult timestamp |
| --- | --- |
| Final primary gameplay + drawing, 279 passed | `iphone-full-qa-color-final/run-2026-09-08T15-35-19-286Z.xcresult` |
| Final compact gameplay + drawing, 279 passed | `iphone-compact-qa-color-final/run-2026-09-08T15-11-44-649Z.xcresult` |
| Primary age-10 portrait + age-6 landscape catalogs | `iphone-full-qa-catalog/run-2026-09-08T15-06-24-297Z.xcresult` |
| Compact age-6 landscape catalog | `iphone-compact-qa-catalog-final/run-2026-09-08T15-21-21-382Z.xcresult` |
| Other primary focused UI checks | `iphone-full-qa-restarted/run-2026-09-08T14-56-31-438Z.xcresult` |
| Other compact focused UI checks | `iphone-compact-qa/run-2026-09-08T14-31-44-986Z.xcresult` |
| Earlier passing portrait catalogs | `iphone-full-qa/run-2026-09-08T13-34-29-920Z.xcresult`; `iphone-compact-qa/run-2026-09-08T13-34-30-768Z.xcresult` |
| Primary full-screen landscape archive | `iphone-full-qa-landscape-archive/run-2026-09-08T15-44-38-105Z.xcresult` |
| Compact full-screen landscape archive | `iphone-compact-qa-landscape-archive/run-2026-09-08T15-42-59-568Z.xcresult` |

The final gameplay/drawing runs, compact final landscape sweep and both complete screenshot archives use `c492e0448081570e`. Other focused UI checks and the primary catalog recheck use the prior `4428120389b8a892` baseline; the only subsequent app change was the dinosaur contour, covered by both final drawing runs. The earlier portrait catalog passes use `ee99aaf12c5dbcac` with the native status-bar correction, supplemented by the later shape-clue and landscape rechecks.

Independent [CI for the final app bundle](https://github.com/kartikkp/Doodle-fun/actions/runs/34243939891) passed **70 unit tests, 516 Chromium/WebKit scenarios, an unsigned iPhone Release build, and 276 native iPhone tests**. The later screenshot-capture helper and its inventory update passed both local native archive runs and all 70 local unit tests. CI for those final test-source changes is also running; the linked completed run covers the final app code.

See [full iPhone QA commands](iphone-app.md#full-iphone-qa). Use a dedicated simulator because the suite resets its test app's local data. The regular Xcode Test action remains the original smaller suite; `npm run test:iphone` prepares the expanded isolated suite.

## Limits and follow-ups

No physical iPhone, Apple Pencil, VoiceOver session, audible voice assessment, destination share app or child playtest was used. The process-recovery check invokes WebKit's public termination callback; drawing persistence also survives actual app termination/relaunch. These results do not establish child enjoyment or developmental norms.

Some math/sequence answers require vertical scrolling. On the compact phone, the selected number tab can be partly outside its horizontal tab strip. Both are usable in the verified flows; shorter headers, clearer scroll cues and automatic active-tab reveal are recorded as usability follow-ups in `.planning/ISSUES.md`. iPad validation from the earlier release is separate from this full iPhone run.
