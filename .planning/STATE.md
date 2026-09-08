# Current state

Phase 4 is delivered in merged [PR #3](https://github.com/kartikkp/Doodle-fun/pull/3). The owner's Xcode project and signing team are configured. Full native iPhone QA and four corrective fixes were merged in [PR #4](https://github.com/kartikkp/Doodle-fun/pull/4). Its final tested runtime was `c492e0448081570e`. App Store privacy, parent controls and listing preparation are in [PR #5](https://github.com/kartikkp/Doodle-fun/pull/5), branch `codex/app-store-preparation`, runtime `05facec229a9211d`.

- 30 activities, exact ages 2–10, shared Coach, contextual hints, per-activity challenge adjustment, and optional native/browser read-aloud.
- Full iPhone QA completed on dedicated iPhone 17 Pro/iOS 26.5 and iPhone SE 3/iOS 18.6 simulators. All 540 unique age/activity gameplay flows passed on the final packaged app. Both final gameplay/drawing runs passed 279/279 without failures or skips.
- All 580 planned case/device combinations have passing evidence across completed runs and relevant fix rechecks: 552 native gameplay/bridge/layout cases plus 28 native UI cases. Trusted UI coverage includes 240 full catalog visits, drawing and tracing gestures, sharing, saved settings, rotation and relaunch, nine bounded coloring fills, and 60 additional landscape archive openings. This is not a claim of one 290-test run per phone.
- Native screenshot review covers all activity types in portrait and landscape. Fixed status-bar overlap, landscape safe-area margins, conflicting shape clues and a dinosaur coloring fill leak. Remaining scroll/discoverability refinements are in ISSUES.md.
- Independent CI for the final app bundle passed 70 unit tests, 516 Chromium/WebKit scenarios, an unsigned iPhone Release build and 276 native tests. Subsequent screenshot helper changes also passed final PR CI before merge.
- Generated web and native HTML remain synchronized. Expanded native QA runs through `npm run test:iphone` using copied projects; test helpers are not shipped in the application. The regular Xcode Test action remains the original smaller suite.
- The owner's source project file, signing changes, existing simulator and saved artwork were preserved. Detailed versioned evidence and limits are in docs/iphone-qa-report.md; raw xcresults, screenshots and per-game reports remain in the workspace's work directory.

## Delivery and next state

The owner authorized release-preparation items 1–3: public/offline privacy policy, per-action parental approval, and App Store listing materials. The implementation uses the existing GitHub Pages site for privacy/support, native and browser gates before sharing/external links, and actual native iPhone/iPad screenshots. The store kit is in docs/app-store. Defaults are free, Education, Kids 6–8, U.S. availability and manual release; none have been entered into App Store Connect. GitHub issues is the public support channel.

This increment passed 70 Node tests, all 534 Chromium/WebKit scenarios, and 15 native bridge/gate/UI checks on each of the two dedicated iPhones. Ten native store screenshots carry the final bundle identity. The owner's Xcode signing file and personal simulator remain untouched. Rebuild/run Xcode to use the updated bundled app. A signed upload, physical-device TestFlight checks, owner review-contact/account fields, final category/price/territory decisions and App Store submission remain separate steps. See docs/app-store/qa.md for this increment's validation and its limits.

Physical iPhone, Pencil, VoiceOver, audible speech, real sharing destinations and observed child playtesting remain separate validation. Software playthroughs establish the tested behavior, not child enjoyment or developmental outcomes.
