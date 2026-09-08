# Thirty activity acceptance checklist

The current library has 30 visible activity choices. Individual letters, coloring pages and puzzle rounds are practice content within an activity. This checklist describes required behavior; completed results belong in [the QA report](qa-report.md).

The [coached play review](coached-play-review.md) records each activity's age-fit assessment and the nine starting configurations. All activities stay available; literacy and arithmetic at ages 2–4 are shared exploration with visible support.

| Activity | Direct route | Learning purpose | Engine |
| --- | --- | --- | --- |
| Doodle studio | `#draw` | Creative expression | drawing |
| Color & create | `#coloring` | Color & fine motor play | drawing |
| Line & shape trails | `#prewriting` | Control & coordination | learning |
| Big letter trails | `#uppercase` | Uppercase handwriting | learning |
| Little letter trails | `#lowercase` | Lowercase handwriting | learning |
| Word trails | `#word-tracing` | Word handwriting | learning |
| Number trails | `#number-tracing` | Numeral formation | learning |
| Count with me | `#counting` | One-to-one counting | learning |
| Add together | `#addition` | Adding with objects | learning |
| Equal groups | `#equal-groups` | Repeated equal quantities | learning |
| Shape detective | `#shape-match` | Shape recognition | discovery |
| Color buddies | `#color-match` | Color recognition | discovery |
| Pattern parade | `#patterns` | Patterns & prediction | discovery |
| Sort it out | `#sorting` | Classifying & grouping | discovery |
| Spot the difference | `#odd-one-out` | Observe & compare | discovery |
| Memory garden | `#memory` | Visual memory | discovery |
| Little pathfinder | `#maze` | Planning & spatial thinking | discovery |
| More, less, same | `#compare` | Comparing quantities | challenges |
| Number stepping stones | `#number-order` | Number sequences | challenges |
| Take away | `#subtraction` | Subtracting with objects | challenges |
| Missing number | `#number-bonds` | Part–whole relationships | challenges |
| Fill the frame | `#ten-frame` | Five & ten structure | challenges |
| Letter buddies | `#letter-match` | Letter case recognition | challenges |
| Build a word | `#word-build` | Letter order & spelling | challenges |
| Growing garden | `#size-order` | Size & ordering | adventures |
| Story steps | `#picture-sequence` | Sequence & explain | adventures |
| Follow the arrows | `#directions` | Directions & planning | adventures |
| Shape builder | `#make-a-shape` | Geometry & spatial reasoning | adventures |
| Tap the pattern | `#rhythm` | Sequence memory | adventures |
| Fair shares | `#sharing` | Sharing & remainders | adventures |

## Completion and recovery

- Tracing: a full real path must pass; taps, disconnected marks and excessive scribbling must not. Check every separate stroke and all 76 practice items. Rounded guides, demonstrations and validation must use the same geometry.
- Number and word puzzles: require the requested mathematical relationship or complete ordered word, preserve duplicate letter tiles, and keep retries available. A hint must teach the current step. Older inverse questions need matching instructions.
- Discovery: one valid match/exception, accurate categories, complete card pairs, and connected mazes. Mismatches remain visible until the child is ready. Undo must not grant duplicate maze credit.
- Adventures: size labels must not reveal the answer; stories follow the stated order; directions stay on the board; both perimeter directions can build a shape; visual beats are untimed; fair shares require equal amounts and correct leftovers.
- Creative activities: pen, eraser, fill, stamps, all nine coloring pages, bounded undo/redo, reload recovery and full-resolution PNG export remain available. Color is a creative choice, never a pass/fail criterion.
- Coaching: every activity has useful starting, strategy, conversation and real-object prompts. Per-game support persists independently. Sound toggles preserve work and hints.

## Launch and device gate

Click every card from home in the actual release bundle. Verify the named activity, complete a meaningful round, return home and reopen. Cover ages 2 through 10 in the gameplay suites, and phone/tablet portrait/landscape in the layout suite. Check 48-pixel child controls, scrolling, error-free navigation and no page-level horizontal overflow.

Repeat entry with the network disconnected, open the standalone HTML without a server, and stop the actual HTTP server before reloading the cached app. Verify committed Pages files, dist files and native bundled HTML are identical. On iOS, exercise the real Save/share/cancel flow and app relaunch; physical Pencil and VoiceOver checks remain separate from simulator tests.
