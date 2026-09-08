# Doodle Fun QA — coached play and iPhone app

Tested September 8, 2026. Final release fingerprint: **ee99aaf12c5dbcac**. The complete local gameplay baseline was **030d813f25b61b2d**; subsequent changes correct dialog safe-area positioning and a native-share feedback race, with affected browser/native rechecks described below. The committed Pages HTML, dist HTML and native bundled HTML are byte-identical. This report describes software verification and adult playthrough judgment, not observed testing with children.

## Results

- **63 JavaScript unit tests passed.** These include every tracing practice item across all nine profiles, malformed input and storage recovery, arithmetic, solvable game generation, bounded values, exactly paired cards, fair sharing, coaching coverage and native bundle sync.
- **All 508 browser scenarios passed across the main run and targeted rechecks**, using Chromium and WebKit. The main run passed 506 and hit two 45-second timeouts reported after 3.4 minutes during a host interruption. The same age-four sorting and memory cases passed independently in 2.2 seconds and 1.3 seconds. No runtime patch or weakened assertion was required for those rechecks.
- **30 activities × 9 ages × 2 engines = 540 age/activity/engine play flows.** Educational activities complete a round; drawing and coloring create and recover artwork. Coverage includes incorrect attempts, visible support, recovery, completion and continued play where applicable.
- **900 responsive card launches:** 30 cards × 3 age presets × 5 viewport sizes × 2 engines. These check actual rendered activity headings, back navigation, no page overflow and no JavaScript/console errors. Additional gameplay checks cover exact ages 2 through 10 and 320px dense layouts.
- **90 final phone screenshots captured** at ages 2, 6 and 10; visible content was checked for invalid numeric values. The visual review covered all 30 activity types and inspected corrections separately.
- **16 native simulator test runs passed, zero failures/skips:** eight tests each on iPhone 17 Pro/iOS 26.5 and iPad Air 11-inch (M4)/iPadOS 26.5, built with Xcode 26.6. Five tests cover local navigation, PNG validation, route bounds, packaged SHA integrity, and real WebKit reload with saved route/data. Three UI tests cover Coach/home navigation, settings after relaunch, and two actual Save→native share→cancel→reopen cycles. An earlier iOS 18.6 run also passed the native integration checks and share flow.
- **Safe-area recheck on 87f8df15e211c1db: 63 unit tests, 38 affected browser scenarios and six native test runs passed.** The browser checks cover coaching and drawing in both engines. Each native device repeated bundle integrity, Coach/navigation, and picture sharing plus the New picture confirmation. Final screenshots show the Coach clear of the iPhone status bar and visible confirmation choices.
- **Final sharing-fix recheck on ee99aaf12c5dbcac: 63 unit tests, all 42 drawing/coaching browser scenarios and four native runs passed.** Both engines passed deterministic failed/completed sharing feedback checks. Both native devices repeated packaged integrity and real share/cancel/reopen/New picture flows. The full browser suite now contains 512 scenarios.
- GitHub Actions also builds the unsigned iPhone app on macOS, verifies generated release integrity and runs the full web suite on Linux. The first independent full run passed 507 of 508 scenarios and exposed the feedback race described below; it was corrected with a deterministic regression. Current independent results are available on [PR #3](https://github.com/kartikkp/Doodle-fun/pull/3/checks).

## Problems found and corrected

1. **Sharing showed an invalid cookie total at age 10.** The remainder configuration was missing an entry. Each age now has a finite, solvable total; age 10 has 19 cookies, four per friend and three left over. Unit and full touch playthrough checks cover every age.
2. **Size labels revealed the ordering answer.** Visible choices now say “Flower”; accessible names refer to shuffled positions, so size remains the deciding feature.
3. **Older math prompts conflicted with supporting text.** Missing-removed subtraction, empty-space frames, descending number paths and three-addend sums now have matching instructions and coaching.
4. **Long words wrapped the last letter onto an isolated row.** Eight-letter answer slots now fit one row on narrow phones; letter-choice buttons keep their touch size.
5. **Some rounded trace guides looked polygonal.** Zero and O/Q/o/C/c/a/g now share dense curved geometry between rendering, demonstration and scoring. Straight corners remain intact. Other older glyph paths retain their prior geometry and are not claimed as a fully revised handwriting font.
6. **Sound changes could disturb current practice or a shown hint.** Controllers update audio controls without rebuilding in-progress boards, counted dots, selected tiles, ink or active hint state. Per-activity difficulty changes remain separate.
7. **The native screen applied notch spacing twice.** The Coach bar now owns the top safe area; activity headers sit directly below it, and drawing accounts for the bar height. Actual simulator screenshots confirm the drawing tools remain visible.
8. **The Coach dialog could sit under the native status bar.** All dialogs now respect each safe-area inset and retain scrollable content. Affected browser and native checks passed on the final bundle.
9. **A delayed draft save overwrote native share failure feedback.** Independent Linux/WebKit CI exposed the race. A clock-controlled test reproduced it in both engines at the 650 ms debounce boundary. Explicit feedback now survives background persistence until the next edit; invalidated export results cannot overwrite feedback after New picture or navigation. The original PNG/error assertion and both new regressions passed in both engines after the fix.
10. **Test selectors assumed desktop-style share UI and incomplete coloring-page names.** Tests now use the actual accessible labels and observed iOS system share process; those were test harness corrections, not evidence of successful product behavior by themselves.

## Offline and persistence checks

The browser suite opens every card after the network is disconnected, opens standalone HTML from disk with service workers blocked, and stops a private HTTP server before reloading the cached app. The Pages-path regression serves only committed release files under `/Doodle-fun/`, stops that server, reloads and opens all 30 cards. Generated output is checked against source in CI.

The native app loads only its bundled file, blocks network resources and retains WebKit's local data store. Tests reload the WebKit content after simulated termination and verify the activity route and previously saved storage. Unsaved gestures or in-memory rounds are not claimed to survive process termination.

Drawing checks include all nine templates, pen/fill/stamp/eraser, exact bounded undo/redo, orientation, pointer cancellation, multiple touches, reload and a 1536×1536 PNG. Native sharing is exercised through the real Save control and the system sheet.

## Age and enjoyment assessment

See the [30-activity coached play review](coached-play-review.md) for individual judgments and the nine-year configuration table. Younger modes emphasize modelling and shared exploration. Middle modes connect symbols, groups and sequences. Older modes add reasoning, longer patterns, inverse questions, spatial distractors and remainders. Recognition and simple tracing remain explicitly useful warm-ups, not advanced curriculum.

No children participated. Passing interaction tests cannot establish enjoyment, educational efficacy, independent comprehension, or an exact developmental age fit. The same synthetic wobbly path was used to verify that supportive tracing settings are more forgiving; it is not a calibrated model of a child's movement. Physical-device Pencil pressure/palm handling, VoiceOver, real speech voices and all share destinations remain hardware follow-up checks. The iPhone app is a buildable project and tested simulator app; personal-device installation requires the owner's signing team, and it has not been submitted to the App Store.
