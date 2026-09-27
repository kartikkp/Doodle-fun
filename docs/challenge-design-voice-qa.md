# Activity, design and coaching revision

Review started September 26, 2026. This revision keeps 21 activity families and all 34 modes, with starting ages 2–10. It is being prepared on `codex/audible-effects-older-challenges` for PR #8. It has not been uploaded to TestFlight.

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

## Versioned evidence

Early visual baseline `459f39bcf082bf48` and later `73ea73424d517853` exposed the issues above. Preserve their reports as preliminary evidence. The `73ea` root run passed 259/260; its Safari tiny-stroke failure is the actual defect described above. The same tracing case passed after correction on `ee3d20f68d428e38`.

On `ee3d20f68d428e38`, all 300 root browser cases and all 274 discovery/adventure cases passed in Chromium and WebKit. The 408 layout checks passed with no horizontal overflow, sub-48px controls or stale activity notices. Subsequent changes are bounded to tracing word layout, decimal count regrouping, age-aware home descriptions, and one measurement instruction. Final-candidate results are recorded below after their execution.

Native source is compiled in an isolated project copy. The owner's Xcode project, signing edits and personal simulator are preserved. Existing App Store screenshots describe an earlier build and need refreshing before a public submission.

## Direct acceptance still separate

Physical iPhone speaker/headphone loudness, subjective voice preference, VoiceOver, Apple Pencil and supervised children’s engagement are direct device/user checks. Successful digital audio playback or an animated listening control does not prove a remote tester heard it. No such claim is made by this report.
