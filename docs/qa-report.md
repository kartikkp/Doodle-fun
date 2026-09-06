# Doodle Fun — QA report

Verified September 6, 2026. Implementation branch: `codex/kid-friendly-activities`.

## Result

- Syntax checks: passed.
- Unit suite: **23 passed**.
- Combined browser suite: **48 passed**, split equally between Chromium and WebKit.
- Final age-default change: **14 learning browser checks passed** in a separate targeted recheck in both engines.
- Independent review findings were reproduced, fixed, and rechecked.
- No production deployment or main-branch merge is part of this change.

## Device-size coverage

Every one of the four activity entry points opened at each age preset (3, 6, and 9), in both engines, at all five sizes below. The tests assert successful rendering, navigation, and no horizontal document overflow.

| Size | Viewport |
| --- | --- |
| Small iPhone portrait | 375 × 667 |
| iPhone portrait | 390 × 844 |
| iPhone landscape | 844 × 390 |
| iPad portrait | 820 × 1180 |
| iPad landscape | 1180 × 820 |

Dedicated touch contexts test genuine browser touch taps. Chromium additionally tests simultaneous fingers. Visual inspection covered the home screen, drawing workspace, tracing, and number activities. Phone landscape tracing is sized to fit its shorter viewport.

## Activity coverage

| Activity | Checks and improvements |
| --- | --- |
| Doodle studio | Pen, eraser, fill, stamp, clear/new, exact single-action undo/redo; pointer capture and cancellation; second-pointer rejection; brush/color support presets; paper preserved through rotation, navigation, and reload; actual white-background 1536 × 1536 PNG decoded and inspected. |
| Color & create | All **9 original templates** rendered and filled; page replacement confirmation, cancellation, and undo; same drawing recovery/export coverage. |
| Letter adventures | **76 tracing items**: 26 uppercase, 26 lowercase, 10 digits, 8 prewriting paths, 6 words. Each item’s valid paths tested at all three support levels (**228 valid-path assessments**). Browser pointer tests exercise A, g, 0, and cat; incomplete strokes, blank taps, and scribbling reject completion. Numbered starts, demo cancellation, rotation, progress restoration, descenders, and word guide alignment checked. |
| Number explorers | Zero is actually empty; displayed dots match quantities; incorrect answers allow retries; correct answers persist; tap order stays stable between panels; counting covers each value from 0 through 20; addition operands vary; equal-group quantities and answers agree. |

## Age and difficulty decisions

| Starting point | Drawing / coloring | Letter practice | Number practice |
| --- | --- | --- | --- |
| Ages 2–4 | Broad brushes, fewer colors, simple prompts and first-page suggestions | Prewriting paths by default; generous spatial support | Small quantities from 0–5, tap-to-count help |
| Ages 5–7 | More tools/detail and pattern prompts | Uppercase by default; lowercase, words, numbers and paths available | Counting through 10 with addition and groups available |
| Ages 8–10 | Fine details, storytelling, symmetry and design prompts | Short words by default; more precise tracing | Equal groups starting at 3 groups of 3; optional counting through 20 and varied addition |

Age is an editable starting point. Grown-up settings can choose more support or more challenge independently of age. No letter case or number set is locked. Stars mean a practice item was completed, not that a child has mastered a skill. Stroke order is demonstrated, but completion validates coverage/continuity/precision rather than enforcing a single order.

## Bugs fixed

- Global gesture prevention and zoom restriction blocked normal mobile scrolling.
- Undo skipped or lost the most recent drawing action.
- Canvas resizing cropped/lost drawings; hidden views could have zero dimensions.
- Whole-background trace scoring did not evaluate real glyph paths.
- Scattered taps plus localized scribbling could imitate full trace coverage.
- Overlapping starting points hid earlier stroke numbers.
- Word guide rules did not align with scaled letters.
- Count labels changed from tap order to spatial order after switching panels.
- Numbers were age-locked until eight, and examples included “nine planets” and mismatched quantities/pictures.
- Malformed local settings could throw; failed saves could return stale stored data.
- Hidden mobile button captions left unnamed controls.
- Phone landscape tracing exceeded the visible viewport height.

## Practical limits and next device checks

These are browser and code checks, **not physical iPhone/iPad certification**. Before wider release, try Safari on an actual iPhone and iPad, including Apple Pencil pressure/palm behavior, screen rotation, native share/save sheets, VoiceOver, larger text settings, and safe-area insets. Stroke-order learning and age appropriateness benefit from short observed play sessions with children in each band.

Drafts and practice stars are local to this browser; they do not sync across devices. Blocked or full storage preserves current-session play, but important artwork should be exported. Detailed drafts above 2.5MB request PNG saving. Undo is bounded to 30 actions and a memory budget. The app is a practice/play tool, not a curriculum or ability assessment.

## Reproduce

```sh
npm ci
npm run check
npm test
npx playwright install chromium webkit
npm run test:browser
```

The GitHub Actions workflow runs the same checks for pull requests. The app itself has no runtime dependency or build step.
