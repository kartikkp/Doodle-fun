# Deferred improvements and direct acceptance

- **Observed child playtesting:** verify independent comprehension, enjoyment and challenge with children across the intended ages. The educator-role review and software playthroughs do not measure developmental outcomes.
- **Physical listening and access:** confirm speaker/headphone audibility and coaching-voice preference on the actual TestFlight build. VoiceOver, color-vision usability and Apple Pencil need their relevant direct checks.
- **Compact-screen discoverability:** phase 7 reduces navigation/header repetition and preserves reachable 48px controls. Some boards still require scrolling in compact landscape; observe whether children discover the lower controls without adult help.
- **Content breadth:** phase 7 adds roots/affixes, academic words, causal banks, geometric rules and varied sharing quantities. The banks remain finite, and tracing measures motor practice. Deeper independent composition, explanations and free musical construction remain extensions.
- **Native test action isolation:** run public UIKit geometry checks and trusted landscape UI sweeps in separate xcodebuild actions. Combining them produced a simulator rotation timeout before interaction; the separate actions preserve their real geometry/gesture assertions. The CI workflow already separates integration and trusted UI actions. Investigate simulator orientation-state handoff before using one monolithic native action.

## Addressed in phase 7

- Selected activity tabs scroll into view.
- Older literacy includes age-specific vocabulary, rhymes, affixes and roots; foundational tracing is labeled honestly.
- Shape/color/classification modes use properties, relationships and fraction/number rules; sharing varies totals and requires older-child remainder interpretation.

## Phase 8 follow-ups

- Physical iPad/Pencil feel, palm behavior and VoiceOver remain direct device acceptance checks; observed child engagement is not established by automated tests.
- Consider requested per-round spoken instructions for the new studios, independent of hint policy. Ages 2–4 currently remain supported exploration with a grown-up. Never auto-play a solution.
- Preserve separate free-mosaic and challenge drafts when switching those modes; consider an optional playback-follow page for long beat patterns. These are new creative continuity enhancements, not changes to the preserved Doodle draft.
