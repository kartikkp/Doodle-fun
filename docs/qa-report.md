# Doodle Fun — QA report

Verified September 6, 2026. Branch: `codex/activity-library-recovery`. Tested standalone build fingerprint: **387b68987e207d18** (the `doodle-build` HTML meta tag).

## Result

- **40 unit tests passed.**
- **122 browser tests passed** in one combined run: 61 Chromium, 61 WebKit, no skipped cases (2.6 minutes locally).
- **24 cards × 3 age presets × 5 viewport sizes × 2 engines = 720 activity launches** in the responsive launch matrix. Tests check rendered activity content, back navigation, horizontal overflow, page errors, and console errors.
- All 14 new games have browser completion/retry coverage. The seven number/letter challenges complete at each of the three age presets in both engines; discovery coverage includes each game's full touch loop and all three board-size presets.
- **Actual delivered browser:** the user's existing in-app tab reloaded with its real preview server stopped, then all 24 cards were clicked, their game headings read, and home navigation verified. No activity import was needed. The server was then restored as a detached process.
- Independent content/code review found no unresolved gameplay issue. Screenshot review covered home, sorting, patterns, memory, maze, and word building at phone/tablet sizes.
- Changes remain in a draft PR; main/production has not been replaced.

## The failure the previous QA missed

The previous preview left its home page visible after the local server stopped. Clicking a card then fetched `draw.js` or `learning.js` through a dynamic import. The user's browser logged `Failed to fetch dynamically imported module` and displayed the reported activity-open error. The earlier green tests ran while the server was alive and did not validate the delivered page after server shutdown.

Every game's JavaScript, CSS, and icon now ship inside **one standalone HTML file**. Activities require no further network fetch. A versioned service worker caches the complete app after first installation for offline reloads. The downloadable HTML also runs from a file URL, independently of any server or service worker.

Dedicated regressions now cover:

1. Load home without opening any game, disconnect the browser network, then click every card.
2. Load from a private test server, wait for the offline cache, **actually stop that server**, reload home, enter the maze, and reload the activity again.
3. Open the generated HTML directly from disk and click all 24 cards with service workers blocked.
4. Exercise category filters and return focus to the activity card after navigating home.

The initial WebKit test using simulated offline mode produced an internal automation reload error. It was replaced with actual isolated-server shutdown, which passed in both engines and directly tests the reported failure. Playwright documents limitations to its [service-worker automation support](https://playwright.dev/docs/service-workers). No failed run was counted as a pass.

## Device coverage

| Matrix size | Viewport |
| --- | --- |
| Small iPhone portrait | 375 × 667 |
| iPhone portrait | 390 × 844 |
| iPhone landscape | 844 × 390 |
| iPad portrait | 820 × 1180 |
| iPad landscape | 1180 × 820 |

The full matrix uses ages 3, 6, and 9. Unit tests check age-band boundaries and support overrides. Additional **320 × 568** browser checks cover twenty-frame, subtraction, word-building, and letter-matching layouts and minimum 48 × 48 controls. Real browser touch taps cover drawing and discovery games; Chromium additionally exercises simultaneous fingers. These are browser checks, not certification on physical iPhones/iPads.

## Activity results

Every entry below passed its launch check in both engines and in the user's server-offline tab. Internal checks are described precisely; generator/path checks cover more content than representative pointer interactions.

| Activity | Verified behavior |
| --- | --- |
| Doodle studio | Pen, eraser, fill, stamps, exact undo/redo, new-paper confirmation, pointer cancellation, second-pointer rejection, rotation/navigation/reload recovery, decoded 1536 × 1536 PNG export. |
| Color & create | All nine original pages render, accept fill, and undo; replacement confirmation/cancellation and export remain functional. |
| Line & shape trails | Direct card selects prewriting; all eight paths pass geometric validation at all support levels; real line tracing and guide cancellation work. |
| Big letter trails | Direct card selects capitals; every capital passes valid-path checks; real A completion, incomplete paths/taps rejection, persistence, and start-marker separation work. |
| Little letter trails | Direct card selects lowercase; all 26 forms validate; real g tracing completes; all glyphs stay in bounds. |
| Word trails | Direct card selects words; six word paths validate; actual cat tracing completes and survives the shared tracing workflow. |
| Number trails | Direct card selects digits; all 0–9 paths validate; real 0 tracing completes. |
| Count with me | Direct counting mode, empty zero, correct visible quantities, retries, tap-order preservation, and every count through 20. |
| Add together | Direct adding mode, visible operands and totals, varied decompositions, zero operands, wrong/correct answer flow. |
| Equal groups | Direct group mode, equal group sizes/total, maker 3 × 3 starting puzzle, stable cross-panel dot ordinals. |
| Shape detective | Unique target, matching/clue support, wrong/correct/next/restart, no double credit on replay. |
| Color buddies | Unique named swatch match, retry/completion/new round, support-scaled choices. |
| Pattern parade | Correct AB/AAB/ABC/AABB/ABBC continuations by profile, wrong answer retry, completed/new round. |
| Sort it out | Every item sorted into its valid category, wrong-basket recovery, completed items retained through navigation. |
| Spot the difference | One exception to the stated color/shape/quantity property, retry and correct selection. |
| Memory garden | Exact pairs, no self-pair/third-card interference, mismatch waits for child, complete board, restart/new board. |
| Little pathfinder | 120 generated connected mazes; walls and invalid moves blocked; actual touch/keyboard route completion, undo, and no duplicate credit. |
| More, less, same | Greater/fewer/equal quantities agree; wrong answer retry and correct relation at each age preset. |
| Number stepping stones | Whole ascending sequence required, wrong choice preserves sequence, tiles used once, older skip-counting generation. |
| Take away | Crossed-out objects match subtraction; correct remaining quantities including zero; retry at all age presets. |
| Missing number | Whole/part arithmetic and visual hints agree; wrong answer retry and correct missing part at each preset. |
| Fill the frame | 5/10/20 structured cells, full quantity cycles including endpoints, toggle/edit, overfill correction, exact-target completion. |
| Letter buddies | Every uppercase/lowercase pair required, mismatch recovery, disabled completed pairs, age-scaled pair count. |
| Build a word | Visible/optional model, incorrect letter help, complete spelling, repeated letters handled as separate tiles, no tile reuse. |

Tracing includes **76 practice items** (26 capitals, 26 lowercase letters, 10 digits, eight paths, six words), each assessed at three support levels: **228 valid-path assessments**. Individual glyphs are not counted as separate games. Geometric completion checks coverage, continuous travel, precision, and excessive ink; they demonstrate but do not enforce a particular stroke order.

Drawing restoration keeps byte-exact saved backing artwork. The displayed PNG check compares decoded dimensions, alpha, ink count/bounds, and a tightly bounded one-color-level rendering tolerance for WebKit decode rounding.

For all educational objectives, actual support settings, and the broader independent acceptance checklist, see [the 24-activity catalog](activity-catalog.md). That checklist is distinct from the completed results recorded here.

## Remaining practical limits

Physical Safari, Apple Pencil pressure/palm behavior, native share sheets, VoiceOver, enlarged text, and observed child play remain device/playtesting checks. Age settings are adjustable support defaults, not validated assessments of an individual child. Youngest word/arithmetic activities may need shared play with an adult.

Drawings and progress stay in the current browser; no cross-device sync. Full/blocked storage preserves current-session play but cannot guarantee persistence. Detailed drawings above 2.5MB request PNG saving; undo is bounded by 30 actions and memory. Offline cache requires a completed first installation over HTTPS/localhost and can be evicted by the browser. The standalone HTML does not depend on that cache.

## Reproduce

```sh
npm ci
npm run check
npm test
npx playwright install chromium webkit
npm run test:browser
```

`npm run test:browser` builds the app before testing. `npm start` builds and serves it. `npm run build` generates `dist/index.html` and `dist/sw.js`; publish those two files for static hosting, or open `dist/index.html` directly for standalone play. GitHub Actions runs the same suite for the draft PR.
