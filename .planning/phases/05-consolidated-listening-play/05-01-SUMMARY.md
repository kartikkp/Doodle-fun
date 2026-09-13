# Consolidated activities and listening play — implementation and remaining QA

## Result

Draft PR #6 consolidates 30 duplicate-heavy activity cards into 21 families and retains every original exercise as a clearly selected mode. Four actual listening games bring the mode count to 34. Doodle studio now contains Free draw and Coloring pages; related tracing, number, ordering, matching and path exercises share one entry point. Old activity links, saved artwork, progress and per-mode support remain available.

Sound detective tests timbre and sequence position, Higher or lower tests pitch contour, Melody echo tests ordered pitch recall, and Beat studio tests beat counts or relative intervals. Each has age 2–10 defaults, coaching, replay, model hints and a recoverable retry loop. Audio is generated offline with bounded volume, separate from Read aloud. The existing visual rhythm exercise remains explicitly labeled Picture practice inside Melody echo.

Implementation and review are complete; task 3 verification/capture is partial. The phase remains open because native sound/touch QA and current store screenshots need an unlocked Mac.

## Corrections found during QA

- Malformed persisted audio preferences cannot crash an activity.
- Selected legacy tabs update the actual exercise profile and Coach together, including initial routing and mode changes.
- Failed or stalled playback returns to retry without permitting an unheard result; sound previews cannot double as answer submissions.
- Interruption/failure retires the old AudioContext. The next explicit action gets a fresh context, and late callbacks cannot stop or corrupt it.
- Browser and native selectors follow family/mode controls while preserving original gameplay and layout assertions. Compact native sound controls expose the play glyph in their accessible label; tests accept that real label.

## Current evidence and limits

Current web/native fingerprint `9a819bdfd018e8e0`, HTML SHA-256 `7de741f6ab0d4e3144af2629ffa3b16fb6e519410362d4d8cfff8910d293ac9f`. Syntax checks and 79/79 Node tests passed. Earlier full CI on `f5e101b`/`ad3544bbd06a552e` passed 628 browser cases (including all 84 live/failure listening checks without skips), an unsigned iPhone Release build and 282 native gameplay/bridge/layout cases. Current-runtime CI is pending final results in `docs/consolidated-listening-qa.md`.

The two dedicated phones each passed 270 retained age/mode gameplay cases and 11 bridge/gate cases on the earlier feature runtime. Local UI/audio runs experienced severe pauses; the Mac was subsequently confirmed locked. Native AudioContext startup stayed suspended after a trusted tap, so native sound is not yet signed off. The UI correctly prevented scoring and offered retry. The lifecycle correction is independently tested, but is not claimed to resolve this initial locked-host failure.

The store copy, catalog and capture recipe reflect 21 families/34 modes. Ten checked-in PNGs remain labeled as the earlier 30-card app and need replacement. The capture script can record an honest initial listening prompt or require actual playback for a ready state; it never substitutes an animation for audio.

## Resume and delivery

Resume pristine native sound checks after unlock, then serial touch/layout QA on iPhone 17 Pro and SE, followed by ten real native iPhone/iPad captures. Add precise results to the current QA report before marking the phase fully verified. PR #6 remains a draft, with no merge, publication, signed upload or App Store submission.

Owner Xcode signing/project SHA-256 remains `bd176defe8efbb0185dc1f6a46249abc36317269bc03e885c9daffd54b56a445`; its pre-existing changes are excluded. The personal simulator is untouched. Physical audibility, accessibility, device volume behavior and supervised child playtesting remain separate release checks.
