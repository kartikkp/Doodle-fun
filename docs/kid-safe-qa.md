# Optional kid-safe setup: verification

Base: `ffea0366b06556eae155037b7aaea9ba7349fe4d` (main). Prepared 2026-10-02.

## Behavior

- Optional, nonblocking first-use home card: set up kid-safe play or Not now. Grown-ups retains the option. Existing PIN users are not automatically opted in.
- Existing 4–6 digit salted PBKDF2 PIN and recovery code are reused; no new account, backend, analytics, child data collection, or native entitlement.
- Kid-safe mode requires a fresh PIN for returning from an activity to the menu and enforces PIN-gated age/difficulty changes. The route check covers normal Back controls and hashes/history resolving to home. Cancelling does not close the activity controller or discard artwork.
- Sharing and external links are unavailable while kid-safe play is on. Guards run before both browser and native bridge paths, including after asynchronous PNG creation. After a grown-up turns the mode off, existing independent math checks are unchanged.
- PIN cancellation, backgrounding, native inactivity, and newer navigation invalidate pending verification. Recovery/removal also clears kid-safe mode. A queued dialog close cannot cancel a newly opened PIN prompt.
- Offline Guided Access help clearly separates the Doodle Fun PIN from Apple's device-level passcode and explains setup, ending a session, Touch/Software Keyboard settings, and emergency-service limitations. No claim of enabling or detecting device-level protection is made.

## Checks completed locally

- `npm run check`: passed
- `npm test`: 204/204 passed
- `npm run ios:sync`: passed; root, dist, and iOS resource HTML regenerated together, with updated service-worker fingerprint and BundleManifest
- `git diff --check`: passed
- Independent source review: no production findings; a Forward-history test gap was corrected before handoff
- Supplemental Node/Happy DOM smoke test (temporary test dependency, not a project dependency): eight parent-control scenarios passed: setup, cancel, wrong/correct PIN, one-action approval, native background cancellation, in-flight crypto cancellation, settings enforcement, disable/recovery. This is simulated DOM evidence, not browser or device validation.

## Added browser regressions

`tests/kid-safe.browser.spec.js` adds 19 scenarios (38 test instances across Chromium and WebKit) and covers first-use skip/reload, later enable, setup cancellation/mismatch/storage failure, seven engines' Back controls, wrong/correct PIN, repeated exits, browser history and empty/invalid hashes, drawing/undo preservation, allowed drawing-mode changes, blocked web/native export and website paths, settings/disable/recovery, interrupted validation, and offline small-screen help/focus.

Existing parent controls, parent gate, drawing, learning, and native bridge suites remain relevant. CI discovers the new browser test automatically.

## Not yet verified

No browser suite has passed for this patch in this workspace. Playwright browser downloads returned unusable archives. System Chromium failed before test execution because local IPC socket creation is not permitted; a permitted execution retry encountered the same limitation. The cloud browser rejected the local preview URL. The 19 attempted existing browser cases therefore failed at browser launch, not at assertions.

Xcode, iOS simulator, physical iPhone/iPad, VoiceOver, keyboard/layout rendering, Guided Access itself, and Apple Pencil tests have not run. Do not infer these passed from the source build or simulated DOM checks. Before merge, run the normal Chromium/WebKit and macOS CI and test actual Guided Access on an iPhone/iPad. Confirm cancelling Back keeps interactive tracing/challenge controls usable, drawings survive, Home/app-switch gestures are blocked only by a started Guided Access session, and ending it uses the device passcode.

## References

- https://support.apple.com/en-us/111795
- https://developer.apple.com/documentation/uikit/uiaccessibility/requestguidedaccesssession(enabled:completionhandler:)

Apple's programmatic Single App Mode API requires MDM supervision, so it is not used for this consumer app.
