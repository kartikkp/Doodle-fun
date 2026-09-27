# Audio and older-child difficulty QA

Updated September 26, 2026. Final candidate runtime: **`cf73382cbd44d40f`**. The catalog remains **21 families / 34 modes**, retaining all 30 original exercises and four listening games. Final checks passed: **95 unit, 702 browser and 289 native cases**, with no final failures, skips or flaky browser results. Earlier evidence remains separately recorded.

## What changed

| Area | Implemented change and actual age 10 example |
|---|---|
| Audio (`audio.js`, `adventures.js`) | Longer sound envelopes, stronger digital output and more midrange content. Picture-practice Clap, Tap and Stomp now have distinct feedback; Rest remains silent. Listen can play the pattern without answering it. Mute, dialogs, navigation and inactivity cancel playback. Game sound/volume remain separate from Read aloud. |
| Addition / equal groups (`learning-data.js`, `learning.js`) | Ages 9–10 use compact numbers and optional place-value strategies instead of hundreds of tappable dots. Examples: `126 + 57 + 38 = ?`; `3 × 12`, with a tens/ones decomposition. Answer alternatives include matching ones digits, so the last digit alone cannot identify the answer. |
| Number challenges (`challenges.js`) | Age 8 provides a two-digit bridge; ages 9/10 use ranges bounded by 499/999. Compare then find the difference; order six numbers with varying gaps/directions; solve different missing operands. Examples: `412 − ? = 255`, `168 + ? = 413`, descending `245, 238, 231, 224, 217, 210`. |
| Patterns (`discovery.js`) | Ages 9–10 infer numeric rules, including alternating operations and growing increments, with a missing internal or final term. Age 10: `4, 9, ?, 12, 10, 15, 13`. Hints explain the rule. |
| Memory / maze (`discovery.js`) | Age 9 matches products to multiplication expressions; age 10 matches equivalent fractions such as `2/3` and `8/12`. Cards retain generous touch targets. Older mazes require one/two ordered checkpoints before the goal, including backtracking; Undo reverses checkpoint progress. |
| Guidance (`app.js`, `coaching.js`) | Older home ordering prioritizes reasoning activities. The visible Coach bar reports a different effective practice step when saved support settings lower it. Foundation activities remain available, with guidance toward deeper challenges. |

The new reasoning branches preserve the younger learning rules. They add cognitive work rather than faster timers or tighter tracing tolerance. Age is a starting preference, not an assessment: saved level/per-mode support still affects the effective challenge. Ages 9–10 are **not uniformly grade-level work**: tracing, counting to 20, letter pairing, basic recognition and small word banks remain foundation practice. Fair shares still uses 19 cookies / four friends / three leftovers at age 10. This change is not a complete literacy or mathematics curriculum.

Design references include [grade 4 patterns and operations](https://www.thecorestandards.org/Math/Content/4/OA/), [grade 4 place value and operations](https://www.thecorestandards.org/Math/Content/4/NBT/) and [grade 4 fraction equivalence](https://www.thecorestandards.org/Math/Content/4/NF/). These inform task selection; they do not establish curriculum coverage or validated suitability for every child.

## Digital audio evidence

At default volume 0.55, 0.3-second effects and 48 kHz rendering, the 350–5000 Hz filtered RMS changed as follows in Chromium; WebKit produced matching rounded values:

| Sound | Previous RMS | Revised RMS |
|---|---:|---:|
| Drum | 0.00257 | 0.04606 |
| Bell | 0.00986 | 0.08661 |
| Shaker | 0.00260 | 0.06235 |

These are normalized **digital signal amplitudes, not SPL, device-volume percentages or measured iPhone speaker response**. The retained before/after sweep covers minimum/default/maximum app volume and three durations; its largest revised sample peak is 0.50571, below digital full scale 1.0, and all measured post-release tails are zero. Eight focused Chromium/WebKit signal checks passed, covering effect separation, useful output, volume scaling, pitch preservation, headroom and silent rests. Physical speaker/headphone audibility still requires listening on the intended devices.

## Verification status

| Check | Result / provenance |
|---|---|
| Node suite | **95/95 passed**, `all-unit-release-verified.log`. |
| Discovery regression | **162/162** broad browser cases passed before final visual polish. **12/12** focused Chromium/WebKit cases passed on final `cf73382cbd44d40f`, including early-goal rejection, equivalent-value matching, retry/hint/replay, 48 px controls and non-overlapping fraction/tick geometry. |
| Visual review | Final WebKit captures inspected at 375×812 and 820×1180 for age 10 patterns/memory/maze, plus 320 px memory. No horizontal clipping; phone maze scrolls vertically. |
| Preliminary native | Runtime `40c84302956cab62`: XCTest console reports **284 passed, zero failures**. Xcode hung during teardown and was interrupted; retain this as preliminary assertion evidence, not a successfully completed native run. |
| Final full browser | **702/702 passed** in Chromium/WebKit (13.2 minutes), zero failures/skips/flaky results, runtime `cf73382cbd44d40f`. Report: `audio-output-2026-09-26/release-browser.json`. |
| Final native | **289/289 passed**, zero failures/skips, runtime `cf73382cbd44d40f`, iPhone 17 Pro / iOS 26.5 simulator. Includes 284 integration/bridge/parental-gate cases and five trusted audio UI cases. Xcode completed successfully; `release-summary.json` and `run-2026-09-26T22-04-17-464Z.xcresult` retain the result. |

Earlier browser attempts are retained: a nondefault server port exposed hard-coded test URLs; two old quantity expectations needed updates for revised age defaults; intermediate runs were interrupted to freeze the final bundle. The separate final run above used the standard port and completed without retries.

Evidence is outside Git, under workspace `work/`: `audio-output-2026-09-26/` contains signal measurements, focused reports, unit logs and full-run reports; `audio-difficulty-native-2026-09-26/` contains versioned provenance/results, preliminary `native.log` and final `native-release.log`; `older-discovery-qa/` contains `final-cf73382-browser.log` and `visual-final/manifest.json` with the inspected captures.

Native gameplay fixtures exercise the shipped HTML through WKWebView DOM interactions. Trusted simulator UI cases are separate evidence; neither is physical-device interaction. Automated checks do not establish child enjoyment, learning outcomes, physical audibility or VoiceOver usability. Supervised child playtesting and physical iPhone/iPad listening remain outstanding product checks.
