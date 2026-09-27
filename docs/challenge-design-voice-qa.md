# Activity, design and coaching revision

Review started September 26, 2026. This revision keeps 21 activity families and all 34 modes, with starting ages 2–10. It is implemented on `codex/audible-effects-older-challenges` for PR #8. It has not been uploaded to TestFlight.

## Changes

- Answer models and worked strategies start hidden. Incorrect responses allow retry without revealing the answer. Hear is an explicit instruction control; hints and completion do not narrate.
- Older tasks now include geometric property combinations with same-side distractors, classification by common multiples and fraction benchmarks, equivalent-value memory, measured length/area/perimeter, causal stories with distractors, transformed directions, reversed/substituted sequences, and remainder interpretation.
- Numbers progress through unit grouping and regrouping, missing operands, two-digit multiplication, decimal arithmetic, and unlike-denominator fractions with filled/empty interpretation. Decimal scoring uses integer hundredths to avoid floating-point equality errors.
- Literacy progresses through case recognition, rhymes, prefixes, suffixes, roots and vocabulary clues. Tracing adds age-specific paths, words and labels. Tracing completion measures motor practice, not independent spelling or comprehension.
- The shared interface has an original illustrated library, distinct activity boards and preschool/early-reader/older-child visual treatments. Age appearance stays tied to the chosen age when practice is made easier. Controls use at least 48 CSS pixels in the tested layouts.
- 116 bundled synthetic coaching clips cover every mode/age combination. They work offline and stop on request, navigation or backgrounding. Dynamic question text still uses local device speech after Hear. There is no game mute or volume slider; device media volume controls output.

The educator-role agent reviewed every mode against individual-year targets and implemented discovery/adventure changes. The design-role agent inspected every mode at ages 3, 6 and 10 on phone and tablet and checked compact and landscape layouts. These are AI reviews, not credentialed human educator assessment or supervised child playtests. See [educational review](educator-activity-review.md), [design review](age-adaptive-design.md), and [voice provenance](voice-provenance.md).

## Defects caught during verification

1. Older shape questions still allowed side-count shortcuts. Added property combinations, irregular same-side alternatives and independent geometry checks.
2. Long word choices overlapped, and five-letter tracing models broke after four letters. Added larger word selectors and kept words up to six letters together.
3. Safari pointer rounding could reject a correctly traced i-dot. Corrected SVG coordinate mapping and kept tiny strokes large enough to draw. Blank ink, isolated taps, excessive scribbles and missed strokes remain rejected.
4. Navigation retained a coloring instruction over unrelated games. Route changes now cancel and clear the old notice.
5. Reversed directions marked the wrong source arrow as complete. Markers now follow the actual reversed source order.
6. Home and Coach copy still called advanced games foundation exercises; measurement instructions still referred to flowers after the diagram changed. Updated descriptions to the active task.
7. Speech tests exposed Hear controls inside closed hint panels. Moved them into activity headers so instruction access never requires revealing a strategy.
8. The first complete native run finished 284 cases with 29 failed cases (58 assertions). The harness selected retained hidden learning controls while testing number challenges, counted hidden controls in duplicate-credit assertions, and rejected two correct short unit-model hints by string length. Scoped the challenge harness to its actual view and replaced the length threshold with independent displayed-unit arithmetic. The original failing result is retained; the corrected rerun is recorded below.

## Versioned evidence

Early visual baseline `459f39bcf082bf48` and later `73ea73424d517853` exposed the issues above. Preserve their reports as preliminary evidence. The `73ea` root run passed 259/260; its Safari tiny-stroke failure is the actual defect described above. The same tracing case passed after correction on `ee3d20f68d428e38`.

On `ee3d20f68d428e38`, all 300 root browser cases and all 274 discovery/adventure cases passed in Chromium and WebKit. The 408 layout checks passed with no horizontal overflow, sub-48px controls or stale activity notices. Subsequent changes are bounded to tracing word layout, decimal count regrouping, age-aware home descriptions, and one measurement instruction. Final-candidate results are recorded below after their execution.

Native source is compiled in an isolated project copy. The owner's Xcode project, signing edits and personal simulator are preserved. Existing App Store screenshots describe an earlier build and need refreshing before a public submission.

## Direct acceptance still separate

Physical iPhone speaker/headphone loudness, subjective voice preference, VoiceOver, Apple Pencil and supervised children’s engagement are direct device/user checks. Successful digital audio playback or an animated listening control does not prove a remote tester heard it. No such claim is made by this report.


## Main gameplay and audio candidate

Runtime **`2c7d4518986f0cef`**, standalone/native HTML SHA256 **`fad176d8c60d5a8272d738ca5280a7c9573fa438d062bf321f1e70a0cfb30f98`**, production source head **`aeec503`**; native fixture corrections **`284af1b`**. All 116 clips match the manifest; the standalone page is 13,278 KiB and includes every recording. The owner's PBX SHA256 remains `2e791a5bd2c9db4081f91afc6115669507c014b30fee9161ca0fcbd6e7c2acbd` and is excluded from commits.

- **133/133 Node checks pass**, including transcript coverage, file hashes, arithmetic/geometry semantics and phone-rounded trace strokes.
- The local browser inventory now contains **750 distinct checks** across Chromium and WebKit. Versioned passing evidence covers 300 root cases, 274 discovery/adventure cases, 148 audio cases, 26 drawing cases and two new compact-home cases. These were executed in staged runs, not one claimed final-build run. Root gameplay was rerun after final reasoning/writing changes; its last run crossed the catalog-only CSS change from `350c552bb56fb62c` to the main candidate. Native CI independently checks a frozen checkout.
- On `350c552bb56fb62c`, **16/16 final speech/clip checks** pass; every AAC payload and speech-source hash matches the audio baseline. All 116 clips decode offline in both engines to finite, non-silent mono 24 kHz PCM, peak 0.786–0.871 and RMS 0.082–0.149. No output clipping was detected.
- Final compact-home correction: **18/18 catalog views** (ages 3/6/10 × widths 320/375/820 × two engines) and **4/4 compact/navigation regressions** pass on `2c7d4518986f0cef`. Measurements use configured viewport and document client width, so mobile layout-viewport expansion cannot mask overflow.
- **13/13 native bridge/gate tests** pass on `350c552bb56fb62c`. The earlier CI share-presentation timeout prompted scene-backed test windows and an exact-call-site 10-second bounded wait; real UIKit predicates remain required.
- **6/6 trusted native sound tests pass on `2c7d4518986f0cef`**: Beat Studio, Coach, Melody Echo, Picture practice, Higher or lower and Sound Detective. These use actual simulator taps and require playback/score/cancellation behavior, including real coaching completion rather than accepting device-speech fallback.

Local iPhone: dedicated iPhone 17 Pro / iOS 26.5 simulator, Xcode 27; copied project and app-only test data. **284/284 native integration cases pass** on runtime `2c7d4518986f0cef` after the fixture correction (270 gameplay cases: 30 modes × nine ages, nine bridge checks, four parental-gate checks and one layout regression; zero failures). The successful result is `run-2026-09-27T01-18-07-757Z.xcresult` (full path retained in the native log). Separate trusted audio cases cover the four listening modes. The compact native results and independent CI status are recorded below. No release upload has been attempted for this new candidate.

Evidence directories outside Git: `work/phase7-visual-qa`, `work/educator-review-qa-2026-09-26`, `work/ondemand-voice-qa-2026-09-26`, `work/phase7-native-qa-2026-09-26`, and the `work/phase7-*-browser.json` / native logs. The temporary 509 MB generation environment and model downloads were removed after recording/hash verification; reproducible scripts, clip manifest, generated assets and logs remain.

## Compact iPhone and CI follow-up

All **six distinct compact native UI cases pass** on the main candidate, through retained targeted runs: age-10 shape clue/Hint, drawing undo/redo/rotation/relaunch, clear/cancel/undo, age-2 and age-10 actual finger tracing, and all nine coloring pages (including both cloud boundary regressions). The device is the dedicated iPhone SE3 / iOS18.6 simulator. These are actual XCTest gestures and pixel checks, not only injected click events.

The first compact pass exposed test assumptions. A test edit incorrectly removed the emoji suffix from expected coloring labels and was reverted. Tracing required an unnecessary 8pt margin below the safe top and did not account for scrolling rails; its corrected helper requires the whole 48pt control in the measured safe viewport/rail and uses actual swipes. Native WebKit adds “, navigation” to the accessible rail name; the test now accepts that observed label. The old cloud sample overlapped an outline after screenshot resampling (white fraction 0.88). A point farther inside the same connected region yields 1.00 and still catches the original boundary-leak defect when that old white overpaint is reintroduced. None of the fill/outline/background/undo thresholds were relaxed.

Compact passing results: `run-2026-09-27T01-23-02-741Z.xcresult` retains the three initially passing cases and the original failures; `run-2026-09-27T01-39-34-509Z.xcresult` passes both tracing cases; `run-2026-09-27T01-41-48-448Z.xcresult` passes every coloring page. Failed intermediate results and exports remain in the evidence directory. Post-test broad system diagnostics are disabled for future runs; explicit test logs, screenshots and accessibility attachments remain.

The frozen main-candidate browser CI at `aeec503` finished **747/748**. Its only failure was Linux WebKit PNG-decoding rounding: one pixel changed from [254,240,241,255] to [253,239,241,255], crossing the test's ink threshold. Bounds and alpha were identical, and 101 pixels had a maximum one-level RGB change. The corrected assertion accounts only for 239↔240 threshold crossings; it retains exact bounds/alpha, per-channel delta≤1, sparse changes and original saved-PNG equality. New negative controls reject erasure, moved strokes, expanded geometry, stronger color changes and changed alpha. **26/26 focused drawing checks pass** in both engines, and the exact captured CI PNG pair passes the corrected predicate. The two new cases bring the full inventory to 750. The superseded run was cancelled after preserving completed browser evidence; a fresh full run covers the corrected tests.


## Landscape refinement and independent CI

Landscape runtime **`358caca3455a2afa`**, standalone/native HTML SHA256 **`e325c7e511fc64b97e07dc05d2ec39c50b74b15605c8d4f4989a5146efa5d9d3`**, synchronized production head **`be43f17`**. Its only production change after the main candidate is a two-pixel cushion inside landscape navigation safe areas. Game logic, voice payloads and all age progressions are unchanged.

The real landscape touch sweep found that WebKit's rounded accessible Coach rectangle extended one point past the safe edge even though the painted border fit. The final CSS provides the additional cushion. Native UIKit/CSS checks now measure Coach as well as the lower activity controls: on an 874×402 viewport with 62-point left/right safe insets, navigation padding is 64 and Coach ends at 810, inside the 812 safe edge. The strict layout regression passes on the final bundle (`run-2026-09-27T01-48-48-876Z.xcresult`). The combined action subsequently failed its UI-rotation precondition; this is retained as a harness isolation failure, not a successful whole action.

A separate trusted XCTest action then **passed the complete 21-family landscape sweep** on the final bundle, with actual navigation, Coach, requested Hint, return controls and screenshots (`run-2026-09-27T01-50-48-583Z.xcresult`, 372.396 seconds; zero failures). A design-agent shadow-source check also passed **48/48 focused browser layout checks** across six routes, four viewports and two engines before synchronization. The local native evidence now covers **297 distinct passing cases**: 284 integration, six trusted audio, six compact-touch cases and one complete landscape catalog case. The repeated final layout case is not counted twice. These passed in the versioned runs described above, not a single combined action.

Independent CI at `284af1b` confirms **284/284 native integration cases passed**. Its browser job repeats the known 747/748 PNG-rounding failure already corrected in `383152c`; its separate audio step was cancelled by the native job's 30-minute budget, not counted as a pass. The job allowance is now 45 minutes while existing per-test and audio-step limits remain. The corrected frozen browser run at `259c725` passed **750/750 checks** in 23.1 minutes, plus 133 unit checks and committed-bundle verification ([CI 36286328165](https://github.com/kartikkp/Doodle-fun/actions/runs/36286328165)). The same frozen CI run also passed **284/284 native integration checks and all six trusted native audio cases**, zero failures. This is a completed successful main-candidate run; it is distinct from the final small display follow-up below.

This revision has not been archived or uploaded to TestFlight. Physical listening, subjective voice preference and observed child challenge/engagement remain direct acceptance checks.


## Final sorting display correction

The independent design review examined all 23 retained native landscape screenshots: 21 family openings, one requested shape-hint view and one tracing-control view. No Coach-modal screenshots were retained, so this review does not claim visual coverage of those dialogs. The review caught duplicated numeric sorting labels (large 5 beside small 5), which could read as 55 despite correct scoring. Numeric/fraction cards now show their value once; picture/shape cards retain their descriptive label and every card retains its accessible name. The sorting instructions and progress caption now say “item” because older tasks include numbers and fractions. Lower boards sometimes require scrolling in compact landscape; that remains a discoverability observation, not clipping in the successful native sweep.

The final synchronized runtime is **`4df4c6c112b64140`**, standalone/native HTML SHA256 **`b78e9432bc909113cc9a2e05b2772fccb0ff2507cdaa36a2ade59dad6373860e`**. Relative to the 750-check CI candidate, production changes are only the two-pixel landscape navigation cushion and the sorting display/copy correction. The voice payloads and all game/scoring/age logic are unchanged. The browser inventory is now **770** after adding 20 sorting-label/layout cases.


On the final runtime, **133/133 unit checks, 22/22 focused browser checks and 9/9 native sorting age cases pass**. The browser checks cover ages 2/4/6/9/10 on 375-point portrait and 874-point landscape in both engines, plus the existing wrong-basket/recovery/persistence case. They require single visible numeric/fraction values, descriptive picture labels, preserved accessible names, 48px cards, no horizontal overflow, correct/incorrect scoring, restart/next behavior and progress credit. Native sorting passes at every age 2–10 in `run-2026-09-27T02-08-08-955Z.xcresult`. The source fix is `a1e3aea`, synchronized bundles `f5bc9b1`. The earlier nine-case native result on `2a6fd4917e897193` is retained separately; that runtime differed only in its last progress-caption wording.

Together, the versioned evidence covers all **770 distinct browser checks and 297 distinct native cases**; these totals describe coverage across the specified runs, not one final-head execution. Final display evidence is in `work/phase7-sorting-label-qa`; original native contact sheets and the independent review are in `work/phase7-native-landscape-final-review`. The production bundle and native resource are byte-identical, syntax/diff checks pass, and the owner's protected Xcode project hash is unchanged. A fresh full CI run is triggered by the final push; its status must be read separately rather than inferred from the completed `259c725` run.


## TestFlight release verification — September 27

The exact final source CI 36287813484 completed with **133 unit, 770 browser and 284 native integration checks passing**. Its audio step hit its separate 10-minute limit: build/install consumed approximately six minutes, Beat Studio and Coach passed, and Melody Echo was interrupted. No XCTest assertion failure was recorded; the unfinished cases are not counted as passes. Commit `79d9413` increases only this audio-step allowance to 20 minutes and retains the 45-minute job budget.

The complete six-case trusted native audio suite was then run locally on final runtime `4df4c6c112b64140`: **6/6 passed, zero failures, 221.740 seconds, exit 0**. It covers Beat Studio, requested bundled Coach completion/background cancellation, Melody Echo, Picture practice, Pitch Path and Sound Detective. Evidence: `work/testflight-build4-2026-09-26/native-audio/run-2026-09-27T06-04-01-461Z.xcresult` and adjacent native-audio.log. Owner signing edits and all production resources remain unchanged.

Merged source `6a7b13a` is archived as 2.1.0 (4) and passes archive identity/content/signature/privacy checks. App Store distribution export still reports No Accounts/no distribution signing certificate, including after the user unlocked the Mac. The GUI showed Minoli’s developer team before the Mac relocked; a new unlock is needed to inspect account/Organizer signing. **No upload or group assignment has occurred.**


September 27 distribution follow-up: user Xcode reauthentication resolved signing. The App Store IPA passed independent signature/profile/content/privacy checks and build **2.1.0 (4) uploaded successfully at 15:27:13 UTC**. Apple reported processing. Processing completion and existing-group assignment remain unverified pending Safari sign-in; this upload is separate from public App Store review.
