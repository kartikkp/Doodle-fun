# Activity families and acceptance checklist

Updated September 13, 2026. The home library has **21 activity families with 34 modes** across Create, Letters, Numbers, Discover, and Listen. All 30 earlier activity routes remain as modes; four new modes use generated game audio. Letters, coloring pictures, and individual rounds are content within a mode, not additional home cards.

This is the current catalog and a checklist of required behavior, not a claim that the new catalog or listening revision has passed QA. Historical [web QA](qa-report.md) and [iPhone QA](iphone-qa-report.md) reports keep their original dates and tested bundles. The [consolidation and listening review](consolidated-listening-review.md) describes current sound-game settings. The [earlier coached play review](coached-play-review.md) records the preceding catalog's age-fit assessment.

All families and modes stay available. The age choice sets a starting point; reading, writing, arithmetic, and listening at ages 2–4 can be shared exploration with a grown-up and visible help.

| Home card and family route | Modes and direct routes | Learning purpose |
| --- | --- | --- |
| Doodle studio · `#draw` | Free draw `#draw`; Coloring pages `#coloring` | Creative expression, color choices, and motor exploration in one art workspace |
| Trail studio · `#trails` | ABC `#uppercase`; abc `#lowercase`; First lines `#prewriting`; Words `#word-tracing`; 123 `#number-tracing` | Guide following and formation of marks, letters, words, and numerals |
| Letter buddies · `#letter-match` | Letter buddies `#letter-match` | Recognize corresponding uppercase and lowercase forms |
| Build a word · `#word-build` | Build a word `#word-build` | Arrange letter tiles, including repeated letters, into a picture word |
| Count & make · `#counting` | Count objects `#counting`; Build an amount `#ten-frame` | Connect quantities with numerals and construct amounts in five/ten structures |
| Number stories · `#number-stories` | Join together `#addition`; Take away `#subtraction`; Missing part `#number-bonds` | Explore joining, removing, and part–whole relationships |
| Groups & sharing · `#sharing` | Share fairly `#sharing`; Count groups `#equal-groups` | Distribute equal shares, account for leftovers, and count equal groups |
| More, less, same · `#compare` | More, less, same `#compare` | Compare quantities; older prompts can also ask for their difference |
| Put it in order · `#ordering` | Sizes `#size-order`; Numbers `#number-order` | Order physical size and numerical values, including older descending/skip-count tasks |
| Shape & color detective · `#shape-match` | Shapes `#shape-match`; Colors `#color-match` | Recognize and match a visual attribute |
| Pattern parade · `#patterns` | Pattern parade `#patterns` | Predict the next item in a repeating pattern |
| Sort it out · `#sorting` | Sort it out `#sorting` | Classify several objects by the stated category |
| Spot the difference · `#odd-one-out` | Spot the difference `#odd-one-out` | Identify the one exception to a stated shared property |
| Memory garden · `#memory` | Memory garden `#memory` | Remember locations and match hidden pairs |
| Pathfinder · `#maze` | Find a path `#maze`; Follow arrows `#directions` | Plan a route through walls or execute an ordered set of directions |
| Story steps · `#picture-sequence` | Story steps `#picture-sequence` | Order meaningful events and discuss what happens before and after |
| Shape builder · `#make-a-shape` | Shape builder `#make-a-shape` | Join perimeter corners, close an outline, and distinguish interior decoys |
| Sound detective · `#sound-match` | Sound detective `#sound-match` | Match generated percussion sounds; older rounds ask for the first or last sound |
| Higher or lower · `#pitch-path` | Higher or lower `#pitch-path` | Hear rising, falling, unchanged, or changing pitch contours |
| Melody echo · `#melody-echo` | Listen & echo `#melody-echo`; Picture practice `#rhythm` | Reproduce heard tone order or practice the retained visual sequence |
| Beat studio · `#beat-studio` | Beat studio `#beat-studio` | Count drum taps, then reproduce short/long relative gaps at a chosen pace |

Trail studio's family link initially chooses First lines at ages 2–4, ABC at 5–7, and Words at 8–10. Its modes remain selectable. Other family links open their first listed mode. Earlier `#letters` and `#numbers` broad links also remain supported.

## Completion and recovery criteria

- **Family navigation:** each home card has a clear purpose. Every mode is reachable from its family, and each old direct route opens the corresponding mode. Switching modes updates the selected state, coaching, and support context. Mode grouping must not duplicate practice credit or discard saved artwork.
- **Tracing:** a complete guide path must pass; taps, disconnected marks and excessive scribbling must not. Check separate strokes and all 76 practice items. Rounded guides, demonstrations, and validation must use the same geometry.
- **Number and word puzzles:** require the requested relationship or complete ordered word, preserve duplicate letter tiles, and keep retries available. A hint must address the current task. Older inverse questions need matching instructions.
- **Discovery:** one valid match/exception, accurate categories, complete card pairs, and connected mazes. Mismatches remain visible until the child is ready. Undo must not grant duplicate maze credit.
- **Adventures:** size labels must not reveal the answer; stories follow the stated order; directions stay on the board; either perimeter direction can build a shape. Picture practice remains a visual, untimed sequence mode. Fair shares require equal amounts and correct leftovers.
- **Art:** pen, eraser, fill, stamps, all nine coloring pages, bounded undo/redo, reload recovery, and PNG export remain available in one workspace. Free draw and Coloring pages share one current draft; replacement requires the existing recovery flow. Colors are creative choices, never pass/fail criteria.
- **Listening:** the actual clue must play before answer submission can complete a round. Replay and hints remain available. Sound detective's Hear control must not submit a choice. Melody echo requires every tone in order. Beat studio requires the requested tap count and, from age four, the relative short/long gaps rather than an absolute start time or fixed speed.
- **Interrupted audio:** leaving, opening a dialog, pausing game sound, or backgrounding must stop scheduled sounds. A cancelled or unavailable playback must not unlock stale answers or award completion. Returning requires explicit playback again.
- **Audio choices:** Game sound and Game volume are independent from Read aloud and persist locally. Generated game sounds need no microphone, audio download, or network request. Sound-off or unsupported-audio states must explain how to continue. Visual hints support participation; they do not establish unaided listening proficiency.
- **Coaching:** every mode has relevant starting, strategy, conversation, and real-object prompts. Support persists separately for the current practice. No completion message should imply a developmental, literacy, or hearing assessment.

## Launch and device gate

Open every one of the 21 cards from the actual release bundle, reach all 34 modes, and exercise old direct links. Complete meaningful practice, return home, and reopen. Cover ages 2 through 10, manual support changes, and phone/tablet portrait and landscape. Check reachable child controls, scrolling, dialog recovery, and no page-level horizontal overflow.

Listening verification needs generated-signal checks and actual playback/interaction checks; animated indicators alone do not prove sound. Check first user-triggered playback, repeated replay, wrong-answer recovery, hints, sound toggles, volume changes, interruptions, and immediate route changes on iPhone/iPad Safari and the native wrapper.

Repeat entry with the network disconnected, open the standalone HTML without a server, and reload the installed offline app. Verify generated Pages files, dist files, and native bundled HTML match the intended release. Exercise the Save/share/cancel flow and app relaunch. Physical-device sound, Apple Pencil, VoiceOver, and observation of children are separate from simulator or browser automation.
