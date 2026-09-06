# Age, activity, and touch guidance

Research checked 6 September 2026. This document records design recommendations and acceptance criteria, not a claim that every recommendation is implemented or has passed QA.

Age selects a starting point; it does not measure ability. Every activity stays available, and children or adults can change support without losing artwork. The proposed ranges below are product defaults, not validated assessments or universal developmental deadlines. NAEYC calls for learning experiences responsive to each child's development, interests, prior experiences, and abilities. [NAEYC: Teaching to Enhance Each Child's Development and Learning](https://www.naeyc.org/node/3812)

## What should change

- **Remove age locks on numbers and lowercase letters.** Kindergarten standards already include connecting quantities with numerals, writing 0–20, and recognizing and printing uppercase and lowercase letters. Blocking numbers until age eight reverses this learning sequence. Preschool access should offer exploration and support, without requiring mastery. [Kindergarten counting](https://www.thecorestandards.org/Math/Content/K/CC/), [kindergarten print concepts](https://www.thecorestandards.org/ELA-Literacy/RF/K/), [kindergarten language](https://www.thecorestandards.org/ELA-Literacy/L/K/)
- **Start young children with meaningful marks.** CDC suggests exploring dots and finger painting at two; its four-year examples include drawing a person with several body parts. These support broad exploratory drawing defaults, not compulsory alphabet precision for every two-year-old. Finger drawing on a screen is not an assessment of pencil handwriting. [CDC: 2 years](https://www.cdc.gov/act-early/milestones/2-years.html), [CDC: 4 years](https://www.cdc.gov/act-early/milestones/4-years.html)
- **Give older children richer purposes.** Grade-three examples include illustrated narratives and multiplication through groups or arrays. For ages eight to ten, the progression should add ideas, patterns, explanations, and word or number challenges; a thinner tracing line alone adds motor difficulty without comparable conceptual depth. Grade-level standards are reference points, not exact age mappings. [Grade-three writing](https://www.thecorestandards.org/ELA-Literacy/W/3/), [grade-three operations](https://www.thecorestandards.org/Math/Content/3/OA/)
- **Preserve creative choice.** Keep templates and missions optional; do not grade an artwork's colors, realism, completeness, or neatness. Open art supports exploration and expression. [NAEYC: Process-focused art](https://www.naeyc.org/resources/pubs/tyc/feb2014/process-art-experiences)

## Suggested activity matrix

These are design inferences from the references above. Use a small, coherent set in each session, with all activities reachable through explicit choices.

| Activity | Ages 2–4: explore with help | Ages 5–7: practice and connect | Ages 8–10: create and extend |
|---|---|---|---|
| Free draw | Large brush, a few obvious colors, stamps, optional dots/lines/circles; prompt “Make a happy cloud.” Celebrate exploration. | More brush choices; draw a scene, repeat a pattern, add an optional name or label; prompt “Draw a home for a tiny animal.” | Optional comic, map, invention, or symmetry prompts; combine tools and explain a design. Keep the blank page available. |
| Coloring | Broad closed shapes, thick outlines, tap-to-fill and forgiving brush; colors chosen freely. | More regions and an optional visual task such as repeating two colors; allow drawing details beyond the picture. | More detailed scenes, optional palettes, texture/pattern/symmetry ideas; do not require every region to be filled. |
| Uppercase letters | Familiar letters chosen freely; wide path and obvious starting marker; optional prewriting shapes before letters. | Full alphabet, useful start/direction guidance, connection to named objects; optional initial-letter or word challenge. | Optional guide fading, copy or create a short word/name, then use it in an illustrated caption. Retain full assistance on demand. |
| Lowercase letters | Recognition/exploration available alongside uppercase; short attempts and wide guides, with no case unlock. | Pair matching cases; clearly distinguish b/d and p/q; show baseline, body height, dots, and descenders. | Apply case in words/captions; choose guided tracing or independent practice. Do not equate speed or narrowness with literacy. |
| Numbers and counting | Start with small sets, typically 1–5; tap each object once, hear/see its count; include an explicit empty set for zero. Numeral tracing is optional. | Offer 0–20 quantities and numerals, comparisons, and small addition tasks with manipulatives; extend the range when wanted. | Offer skip-count patterns, missing values, addition/subtraction, or equal-group challenges supported by pictures. Keep numeral practice accessible. |

## Support and feedback rules

- Offer named support choices such as “More help,” “Some help,” and “Try myself”; expose them in every age band. Age must not silently override a manually chosen support level.
- Make lessons untimed. Let the child replay instructions, redo, skip, or leave. Use a short specific response such as “You followed the curve” or “Try the next dot.” Do not rank children or label a completion badge as handwriting or academic mastery.
- A tracing completion should require meaningful coverage of the intended path. A tap, one corner, repeated scribbling in one spot, or a disconnected dot must not count as a whole letter. Do not insist on one motor sequence if a reasonable alternative forms the intended letter; guidance and completion measurement serve different purposes.
- Keep answers and guidance separate from motor precision: a child can know that a set has four objects without drawing a perfect 4. Number questions should be answerable through large tap choices as well as tracing practice.
- For an incorrect count, provide another attempt and useful visual feedback. Counted objects must visibly change state and must never be counted twice by repeated taps.

## iPhone and iPad acceptance criteria

Apple recommends comfortable control sizes and spacing, simple interactions, visual equivalents for audio guidance, and alternatives to gestures. WCAG's enhanced target-size criterion uses 44 × 44 CSS pixels for the web. This project's target is **at least 48 × 48 CSS pixels** for standalone child controls, with separation. Apple's point units and web CSS pixels are distinct specifications. [Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced)

| Area | Check and passing behavior |
|---|---|
| Device layout | At 320/375/390 CSS-pixel phone widths, phone landscape, and 768/820/1024 tablet widths, all primary controls remain reachable. No page-level horizontal overflow; safe areas do not cover navigation. Intentional scrolling remains usable outside the drawing surface. |
| Canvas geometry | Draw at corners and center, rotate the device, resize, and return. Artwork and guide alignment persist without stretching, cropping, disappearing, or pointer offset. Check high pixel density and narrow landscape height. |
| Touch | A stationary tap makes a dot/stamp/fill. Dragging continues when a pointer briefly leaves the surface and stops cleanly on release/cancel. A second finger must not create a connecting line or corrupt an active stroke. Test finger and Pencil separately on actual hardware. |
| Discovery | Icons have short visible labels; selected tools, colors, difficulty, and tabs expose state. Nonreaders can recognize examples, while accessible names explain every control. Feedback does not depend on color or sound alone. |
| Accessibility | Keyboard can reach and activate controls with visible focus; dialogs contain and restore focus and close through an explicit button. Text remains usable at 200% zoom. Reduced motion suppresses nonessential celebration animation. Test VoiceOver navigation on iOS. |
| Gesture alternatives | Tool selection, next/previous, support, and brush sizes have tap controls. Restrict custom touch suppression to drawing surfaces. Freehand drawing intrinsically needs a continuous path, but menus and selection do not. [WCAG dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) |
| Recovery | Undo/redo restore pen, eraser, stamp, fill, and clear accurately. A cancelled template replacement or clear leaves the picture unchanged. Save includes the intended picture and background. Return home/reload restores local work where persistence is promised. |

## Activity QA cases

1. **All ages:** open all five activity types at ages 2, 4, 5, 7, 8, and 10; change support; return home and reopen. Verify no hidden age locks, wrong selected preset, unintended reset, or stale progress.
2. **Free draw:** test every tool, color, and size; verify a same-color fill completes promptly; undo/redo mixed actions; clear and recover; save/reload/rotate. Canvas-only gestures must not prevent menu scrolling.
3. **Every coloring template:** inspect each closed region; fill neighboring regions and the background; verify outlines and intended separations survive fill/erase/undo. Make sure older templates differ meaningfully from broad beginner shapes.
4. **All 26 uppercase and 26 lowercase letters:** guide is legible, hero glyph agrees with the taught form, start markers are visible, complete trace succeeds, and unrelated marks do not succeed. Test crossbars, i/j dots, and g/j/p/q/y descenders. Off-canvas path coordinates must be brought inside safe margins.
5. **Numerals 0–9 and every question type:** displayed count, spoken/text label, expected answer, and feedback agree. Zero is visibly empty. Test every possible correct answer and at least one incorrect answer per question type; repeat tapping an object cannot increase its count twice. Answer order and question generation must not make the correct choice predictable.
6. **Content accuracy:** remove the original “Nine planets” example; show actual countable sets for each numeral. Do not depict one heart while teaching “three hearts.” Replace mismatched object illustrations such as a seal labeled narwhal. If x is illustrated by “fox” or “ox,” explicitly frame x as a letter inside the word instead of claiming it begins the word.
7. **Progress integrity:** award completion only once per exercise, keep different activities/support levels coherent, and ensure retry does not create duplicate rewards. Describe tracked progress as practice completed, not tested learning achievement.

Automated browser checks can verify geometry, state, and deterministic input. Actual iPad/iPhone Safari, Apple Pencil, VoiceOver, and observation of children using the activities remain separate validation; desktop emulation must not be reported as physical-device testing.
