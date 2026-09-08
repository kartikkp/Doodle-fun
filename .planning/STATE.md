# Current state

Phase 4 is implemented and verified on `codex/pages-built-app`, in [PR #3](https://github.com/kartikkp/Doodle-fun/pull/3). Final runtime fingerprint: `ee99aaf12c5dbcac`.

- 30 activities, exact ages 2–10, a shared Coach, contextual in-game hints, per-activity challenge adjustment and optional native/browser read-aloud.
- Every activity exercised at all nine starting ages in Chromium and WebKit. All 508 browser scenarios passed across the complete baseline run and two unchanged timeout rechecks; 63 unit tests passed. The dialog correction passed another 38 affected browser scenarios. Independent CI then exposed a draft-save/share-feedback race; the corrected final build passed all 42 drawing/coaching scenarios, including four new regression cases. The full suite now has 512 scenarios.
- Offline SwiftUI/WKWebView iPhone/iPad app with persistent local data and native PNG sharing. Full native baseline passed eight tests per device; the dialog correction passed three affected tests per device and the final sharing correction passed two per device. No failures or skips in those native runs.
- Generated Pages root HTML/worker and native HTML are committed and synchronized. GitHub Actions checks source/build identity, all web tests and an unsigned iPhone build.
- Game-by-game age/challenge review and exact software QA evidence are in docs/coached-play-review.md, docs/qa-report.md and docs/iphone-app.md. No children participated; enjoyment and age-fit remain design judgments.

## Delivery and next state

PR #3 requires the owner's merge. The existing public Pages site remains the previously merged 24-activity release until then. After merge, verify the public build fingerprint, worker response and an offline reload before claiming production delivery.

The iPhone project is ready for Xcode simulator use. Physical-device installation requires the owner's Apple signing team; no signing account, App Store submission or production merge was performed. Device-specific Pencil/VoiceOver/share destinations and observed child playtesting remain follow-up validation.
