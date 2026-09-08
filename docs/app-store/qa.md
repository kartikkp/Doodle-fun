# App Store preparation QA

This increment adds offline privacy/help screens, public privacy/support pages, and per-action parental approval for native and browser exports and external links. It does not replace the earlier complete age/activity QA report or claim physical-device or child playtesting.

## Runtime under test

- Fingerprint: `05facec229a9211d`.
- Native/root HTML SHA-256: `f37041e2d7d6925ca75c8e5246d3031db5f22712091c977361164603f8565ee9`.
- Root, dist and native HTML are synchronized. The delivery fingerprint also includes both public pages so policy/support edits invalidate offline copies.
- Owner's Xcode project/signing SHA-256 remains `bd176defe8efbb0185dc1f6a46249abc36317269bc03e885c9daffd54b56a445`; that local file is excluded from these commits.

## Browser and source checks

- All 70 Node unit tests and JavaScript syntax checks passed.
- The full Chromium/WebKit run before the modal-scroll correction covered 532 cases. It passed 529; the three failures were a selector matching the new policy actions as well as the intended support action, and a size measurement taken during touch feedback scaling.
- The selector is now scoped to the support dialog. Target-size checks wait for resting dimensions while retaining the 47.5px minimum. The 18 affected/adjacent cases passed after these corrections, including all 16 new privacy/gate scenarios.
- After the modal-scroll correction, all 18 privacy/gate cases passed in Chromium and WebKit. The final complete run then passed **534/534 scenarios in 7.8 minutes**, with no failures or skips. Its log is retained at the workspace’s `work/app-store-browser-release.log`; independent CI results accompany [PR #5](https://github.com/kartikkp/Doodle-fun/pull/5).
- Public pages were rendered in WebKit at phone sizes and checked for overflow. The in-app policy matches the public policy's complete text and opens while offline. It returns focus to settings correctly.

## Controls and independent review

- A native bridge message cannot approve its own share. The native UI retains one exact payload while the grown-up solves a fresh challenge.
- Wrong answers, Cancel, dismissal, navigation, backgrounding and content-process recovery cannot open a destination; previous approval cannot authorize another request. PNG temp files are created only after approval and cleaned up after sharing.
- Browser shares preserve the correct-answer submit gesture for Safari. Native exports delegate to the native check, avoiding two questions.
- External destinations are restricted to the project's privacy/support pages, GitHub issues and GitHub's privacy statement.
- Independent review found that live policy hrefs allowed browser alternate activation. Embedded links are now buttons, with a regression covering auxiliary click/context menu. The standalone public policy retains normal links.
- Review also found support-only edits did not invalidate the cache; both public pages now contribute to its version.
- Native screenshot capture found the fixed mobile header height clipped content under large notches. The header now sizes to its content and safe-area padding. The final iPhone screenshot confirms the correction.
- Compact-iPhone testing exposed touch scrolling escaping long dialogs and moving the page underneath. Open dialogs now lock root scrolling and contain overscroll. Browser regression covers nested policy/settings panels and restored page scrolling; the native UI test deliberately overscrolls before closing settings and requires the home controls to remain visible.
- The native helper now uses actual visible viewport bounds, avoiding repeated swipes past a fully visible control near the SE screen bottom. This test correction retains the behavior assertions.

## Native checks and store images

Both final native runs passed **15/15**: seven bridge tests, four native parental-gate tests and four trusted UI flows per phone, with no failures or skips.

| Device | OS | Retained result under workspace `work/` |
| --- | --- | --- |
| iPhone 17 Pro | iOS 26.5 | `app-store-qa-iphone/run-2026-09-08T22-50-54-711Z.xcresult` |
| iPhone SE (3rd generation) | iOS 18.6 | `app-store-qa-se/run-2026-09-08T22-50-53-420Z.xcresult` |

The UI flows cover offline launch/Coach/navigation, offline privacy/help and native external-link cancellation, settings/progress across relaunch, and share cancellation/wrong-answer/correct-answer behavior with artwork preservation. These are additional release-preparation checks; the earlier complete 30-activity × nine-age native playthrough evidence is in `docs/iphone-qa-report.md`.

Ten store screenshots show real native activity flows at accepted iPhone/iPad dimensions, without resizing or compositing. See `screenshots/README.md` and each family's manifest for capture devices, exact runtime identity, original image hashes and retained native capture results.

## Limits

No signed App Store archive was uploaded or submitted. Physical-device sharing destinations, VoiceOver, audible speech, and supervised child playtesting still require their separate checks. App Store account fields and final listing decisions are identified in `metadata.md`. Public support uses GitHub issues; no private contact details are guessed.
