# Full native iPhone QA — completed

The planned simulator matrix passed on iPhone 17 Pro/iOS 26.5 and iPhone SE 3/iOS 18.6. All 30 activities completed native WKWebView gameplay at every exact age from 2 through 10: 540 unique flows. Both final gameplay/drawing runs passed 279/279. Across completed runs and relevant fix rechecks, all 580 planned case/device combinations have passing evidence: 552 native cases and 28 UI cases. Historical failing or interrupted cases receive no passing credit.

Trusted simulator gestures separately cover 240 full catalog visits, Coach/hint/Back, real tracing and artwork input, all nine bounded coloring fills, undo/redo, rotation/relaunch, saved settings and PNG sharing. Two complete full-screen archives add 60 opening captures; all 30 activity types were visually reviewed in landscape, complementing portrait review. Some compact layouts require vertical scrolling; follow-ups are in ISSUES.md.

## Changes

- Added an isolated `npm run test:iphone` runner, 270 explicit gameplay cases, catalog sweeps, drawing/tracing recovery tests, native safe-area assertions, source manifests and per-case reports. Complete target/class/method validation prevents ignored filters from becoming false coverage.
- Fixed native status-bar overlap, missing landscape side insets, a conflicting decorative shape clue and a dinosaur coloring boundary leak. Final synchronized runtime: `c492e0448081570e`, HTML SHA-256 `81f51b5e64a394cc97dba4e573afc179bec287003e943113ac2c5b549af2d14d`.
- Corrected test accessibility targeting, distance-aware gestures, partly visible element queries, image orientation handling and incomplete landscape screenshot capture without weakening touch or pixel assertions.

## Verification and delivery

Final-app CI passed 70 unit tests, 516 Chromium/WebKit scenarios, the unsigned iPhone Release build and 276 native tests. Later screenshot-helper changes passed both native archive runs and the 70 local unit tests; PR CI also reruns. Detailed counts, exact result paths and version boundaries are in docs/iphone-qa-report.md and workspace work/iphone-qa-coverage-index.json.

Changes are reviewable in PR #4. The owner's signing project, existing simulator and saved artwork were untouched. Full expanded tests run from copied projects, keeping test fixtures out of the shipped application.

No physical phone or children participated. VoiceOver, audible output, Pencil and destination sharing apps were not validated. These are software QA results, not evidence of child enjoyment.
