# Educator lens: every activity, ages 2–10

Review date: 2026-09-26. Inventory: 21 home families, 34 playable modes in `catalog.js`. This is a source-based educational design review, not a credentialed educator assessment, child playtest, developmental diagnosis, or claim of curriculum completeness. The observations below describe the starting source at runtime `38dd5ac3d8d348ae`; the progression tables are implementation targets. Subsequent code changes and verification must be reported separately.

Age is a starting suggestion. Children vary within an age and across skills. Preserve all modes, independent support adjustments, and older children's access to foundational practice. The approximate U.S. reference is preschool at 2–4, kindergarten at 5, grades 1–5 at 6–10; school-entry ages and curricula vary. NAEYC emphasizes individual context, active play, and purposeful adult support rather than one uniform developmental schedule. [NAEYC development and learning principles](https://www.naeyc.org/resources/position-statements/dap/principles)

## Findings that change the implementation

| Priority | Starting implementation and evidence | Required change |
|---|---|---|
| P0 | `challenges.js:154,238–249,290–316`: young children see the whole number/word solution or case partner; wrong answers invoke the exact next-letter/number hint or reveal all partners. `adventures.js:94,104,153`: ordered solutions/cookie guide counts appear automatically at 2–4. `listening.js:25,151,211`: age 2 opens with the answer model. | No automatic solution models at any age. Wrong attempts retain the task and invite another try; only an explicit Hint action reveals a strategy/model. Keep undo/retry. |
| P0 | `discovery.js:216–226`: target shape name and property are displayed above choices bearing those same names; color is an identical sample at every age. `renderSorting()` supplies the correct basket after a mistake. | Distinguish name recognition from property reasoning. Do not print the requested answer beside the clue in a property task. Give only requested hints. Never conceal accessibility labels to manufacture difficulty. |
| P1 | `learning-data.js:131–152`: fixed paths, 26 cases, ten numerals, and six CVC words for every age; `core.js` mainly tightens trace tolerance. | Retain formation as a foundation option; extend content/context by age. Older success should involve planning/writing meaningful labels, words, and captions, not narrower motor tolerance. |
| P1 | `discovery.js` picture-pattern prefix ends on the same phase for most ages; ordinary oddity is one nonidentical item among identical copies; sorting uses the same category bank. | Vary pattern phase and missing position; require a stated rule across varied distractors; switch sorting criteria and representations. Test unique answers independently. |
| P1 | `adventures.js:9–13,24–58`: only two causal stories; flower rank differs mainly in count/gap; routes copy arrows; shape outline gives every edge; sharing repeats one total for each age. | Add causal stories, measurable comparisons, inverse/spatial rules, optional shape outline, and variable equal-share tasks. Do not make old tasks harder only by smaller pixels. |
| P1 | `listening.js` increases sequence lengths, pitch closeness and timing precision, but melody structure largely repeats after transposition. | Increase musical relationships, missing/reversed phrases, rests and rhythmic grouping before increasing sensory precision. Leave tempo flexible; preserve actual heard-output gates. |
| P1 | `catalog.js:getActivity()` opens the first mode except Trail studio. A ten-year-old can repeatedly enter very elementary count/size/shape tasks although deeper modes exist. | Open an age-appropriate substantive task within the chosen mode/family; show its actual goal. Support settings must be visible and recoverable, never silently inferred from a mistake. |
| Keep | Current older place-value arithmetic, missing operands, equivalent-fraction memory, arithmetic patterns and checkpoint mazes have meaningful reasoning. | Preserve these gains and improve variation/strategy; do not replace them with generic larger choice grids. |

## Instruction and hint contract

Every round begins with the task and necessary evidence, not a worked answer. Tracing paths are the task; a melody must first be heard; a repeating pattern needs enough examples; a maze needs walls, endpoints and legal-move controls. These are not answer leaks. A fully ordered story, highlighted correct choice, spelled-out next letter, completed route, or matching answer image supplied merely as help is a solution model and begins hidden.

Use explicit Hear for instructions and explicit Hint for visual help. Neither opening a route, tapping an answer, nor completing a round should initiate narration. Hint may first explain a strategy and then reveal a worked/model answer on a second request. Keep the model within that round and clear it on Next/reset. A mistake does not activate a hint. Corrective feedback may explain why the selected answer fails, without revealing the missing answer. Never remove accessible names, picture alternatives, or spoken target words: spelling needs a known word, and blind access needs equivalent task information.

At 2–3, use one concrete action and an optional adult-supported exploration pathway. Letter/spelling/fraction material is exposure, not a preschool proficiency test. At 4–5, introduce simple rules and causal sequences. At 6–7, combine and reverse rules, link quantities to symbols, and use familiar phonics patterns. At 8–10, add relationships, justification choices, transformations and planning. More options may manage load, but do not count as the only educational progression.

## Individual-year progression targets

Each cell is a distinct default goal; optional support can simplify presentation without changing chronological-age artwork. Free creation has no machine-graded “correct picture.” The tables specify design targets, not achieved or child-validated outcomes.

### Create and form (7 modes)

| Mode | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| draw | Explore marks | Combine lines and circles | Make recognizable subject | Add setting | Show an event | Two-panel sequence | Foreground/background | Communicate an invention | Plan and revise visual story |
| coloring | Fill one chosen region | Choose/repeat colors | Alternate a color rule | Separate subject/background | Explore light/dark | Deliberate warm/cool palette | Indicate one light source | Limited palette and emphasis | Revise palette to communicate mood |
| prewriting | Broad straight trail | Curve and loop | Join two movements | Repeated line pattern | Symmetric path halves | Repeat with spacing | Construct a border rule | Rotate/reflect a motif | Design repeating tessellation motif |
| uppercase | Explore a familiar initial | Recognize own initial | Form familiar capitals | Form common capitals | Write initials/names | Capitalize sentence opening | Proper nouns in caption | Titles/abbreviations in labels | Edit capitalization in a short message |
| lowercase | Explore a curved mark | Familiar letter exposure | Name-letter formation | Common lowercase forms | CVC labels | Digraph/word-family labels | Multi-syllable labels | Root/prefix labels | Morphology in meaningful captions |
| word-tracing | Chosen name exposure | Familiar short label | Trace meaningful name | CVC word | Digraph/blend word | Two-syllable word | Prefix/root word | Suffix changes | Short purposeful phrase, then independent copy |
| number-tracing | One mark/one object | Numerals 1–3 | Numerals 0–5 | Numerals 0–10 | Teen place-value labels | Two/three-digit labels | Number in a measurement | Decimal tenths in a model | Decimal hundredths/thousandths in context |

Keep any unimplemented advanced writing target honestly labeled as an optional prompt/foundation; do not award spelling or composition mastery from tracing coverage. Touch-ink quality is not a literacy assessment. Grade 5 literacy includes word analysis using syllables and morphology in context, far beyond copying CVC words. [K–5 foundational skills purpose](https://www.thecorestandards.org/ELA-Literacy/RF/introduction/), [grade 5 word analysis](https://www.thecorestandards.org/ELA-Literacy/RF/5/)

### Quantities and relationships (9 modes)

| Mode | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| counting | One/two objects | One-to-one to 3 | Rearrange same amount to 5 | Count scattered/organized to 10 | Group 10 plus extras | Count tens/ones | Groups/arrays without one-by-one taps | Count by fractional units | Compose a decimal amount from units |
| addition | Join 1 and 1 | Join small groups | Add one/change amount | Totals to 10, zero included | Make ten/count on within 20 | Regroup tens within 100 | Two-step join story | Multi-digit with estimate/check | Decimal addition with units/context |
| equal-groups | One for each | Two equal small groups | Compare equal/unequal groups | Repeated groups to 10 | Repeated addition/arrays | Missing group size | Multiplication/division facts | Distributive two-digit products | Two-digit groups and interpretation |
| compare | More visually distinct | Match one-to-one | Same amount, different layout | More/fewer/equal to 10 | Difference and equalizing | Tens/ones comparison | Hundreds/unknown comparison | Fractions against common benchmark | Decimals with unequal digit lengths |
| number-order | First/next quantity | 1–3 quantity sequence | Missing one to 5 | Forward/backward to 10 | Teens and skip counts | Cross a ten/hundred | Explain constant gaps | Descending or alternating gaps | Decimal/fraction positions on line |
| subtraction | One object goes | Remove one/two | All removed gives zero | Within 10, concrete story | Missing start/change/result within 20 | Regroup within 100 | Two-step change story | Multi-digit unknown operand/check | Decimal difference in shared units |
| number-bonds | One hidden object | Split 3 two ways | Missing part to 5 | Make ten | Related addition/subtraction facts | Bridge next ten | Multiple decompositions of 100 | Missing part/whole with regrouping | Decimal/fraction complements |
| ten-frame | Place one/two | Match to 3 | Recognize small structured groups | Five and ten complements | Teen as ten and ones | Two ways to bridge ten | Unit changes: row as group | Unit-fraction frame | Tenths/hundredths with stated whole |
| sharing | One for each friend | Deal two rounds | Check equal shares | Variable exact sharing | Find share size | Find number of groups | Quotient and multiply-back check | Remainders with variable divisor | Explain remainder or share fractional parts |

Kindergarten quantity work includes counting/cardinality/comparison; grade 1 includes unknown operands within 20; grade 2 includes hundreds and regrouping; grade 3 includes multiplication/division and two-step problems. These are reference points, not requirements that every game cover every standard. [K counting](https://www.thecorestandards.org/Math/Content/K/CC/), [grade 1 operations](https://www.thecorestandards.org/Math/Content/1/OA/), [grade 2 place value](https://www.thecorestandards.org/Math/Content/2/NBT/), [grade 3 operations](https://www.thecorestandards.org/Math/Content/3/OA/)

Current age 9/10 integer arithmetic is useful practice but does not by itself cover grades 4/5. Fractions, decimal relationships and meaningful problem interpretation supply suitable extensions. [Grade 4 fractions](https://www.thecorestandards.org/Math/Content/4/NF/), [grade 5 place value and decimal operations](https://www.thecorestandards.org/Math/Content/5/NBT/)

### Recognize, reason, remember (9 modes)

| Mode | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| shape-match | Named circle/square | Curved/straight feature | Side/corner clue | Rotated familiar shapes | Two defining properties | Separate defining/incidental features | Parallel/right-angle constraints | Symmetry/property conjunction | Class inclusion with explicit constraints |
| color-match | Named primary color | Name across object/context | Predict familiar paint mix | Mix primary paints | Tint versus original | Shade versus tint | Palette warm/cool relationship | Hue and lightness constraints | Complement relation on explicit color wheel |
| patterns | Continue AB | Change AB phase | AAB with missing end | ABC/AAB varying phase | Missing middle | Translate repeating unit | Growing/alternating visual rule | Arithmetic relation/missing term | Alternate operations/explain rule |
| sorting | Two familiar categories | New examples, same rule | Sort by one attribute | Two-attribute categories | Switch rule between rounds | Boolean both/either/neither | Multiples/factors | Two divisibility conditions | Fraction values versus benchmark |
| odd-one-out | One color difference | Ignore changed position | One shape feature | Ignore incidental color | Mixed examples violate one rule | Two-attribute rule exception | Number property exception | Factor/divisibility exception | Equivalent-value/fraction exception |
| memory | Two identical pairs | Relocate known pairs | Rotate/resize same shape | Quantity ↔ numeral | Case/form relation | Addition ↔ total | Fraction picture ↔ symbol | Product ↔ expression | Equivalent fractions |
| letter-match | Familiar initial exploration | Same letter in two forms | Common case pairs | Full case recognition | Confusable forms in meaningful words | Apply case to name/sentence | Edit proper nouns in context | Abbreviation/title use | Contextual case editing; foundation option retained |
| word-build | Name/symbol exploration | Familiar onset exploration | Sound/letter in known word | CVC blending | Digraph/blend patterns | Syllable chunks | Prefix/root/suffix choices | Inflection/derivation contrasts | Morphology/spelling in sentence context |
| size-order | Bigger/smaller | Three-object transitive order | Insert missing middle | Change ascending/descending | Compare lengths in units | Order composite lengths | Convert equivalent simple units | Compare area with different dimensions | Perimeter/area constraints, explicit metric |

Squares remain rectangles: single-answer geometry must constrain properties precisely or accept all mathematically valid answers. Do not teach “four sides = square,” or use orientation as a defining feature. Color choices must not depend on cultural associations such as one “correct” sky/skin color; palette creation is expressive unless a clear rule is stated. [Grade 4 geometry](https://www.thecorestandards.org/Math/Content/4/G/), [grade 5 shape classification](https://www.thecorestandards.org/Math/Content/5/G/)

### Plan, sequence, listen (9 modes)

| Mode | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| maze | Single clear turn | Choose open path | Recover from dead end | Plan a branch | Remember route/dead ends | Visit a checkpoint | Choose checkpoint detour | Ordered checkpoint and return | Multiple ordered stops/backtracking |
| picture-sequence | Before/after pair | Cause then result | Three causal stages | Missing middle in routine | Four-step causal chain | Separate relevant/unrelated event | Explain dependency | Reconstruct from state changes | Necessary order versus interchangeable steps |
| directions | One arrow/action | Two directional actions | Change start orientation | Short path sequence | Chunk repeated movements | Reverse a route | Rotate route instructions | Compose/invert transformations | Plan return under coordinate rule |
| make-a-shape | Join triangle corners | Distinguish inside/outside | Four sides/closure | Rectangle versus square | Triangle variety/rotation | Construct side-count polygon | Right-angle/parallel constraints | Symmetry or coordinate constraints | Class properties, equivalent valid constructions |
| rhythm | Copy two pictures | Copy changed order | Repeat action/rest unit | Complete missing action | Remember chunks | Reverse short pattern | Apply a substitution rule | Alternate two transformations | Compare/reproduce transformed phrase |
| sound-match | Hear one contrasting sound | Match sound amid a pair | Recognize across durations | Identify first/last in phrase | Distinguish attack/decay | Identify repeated sound | Remember a specified position | Detect changed timbre in two phrases | Classify sequence relationship by timbre |
| pitch-path | Up/down broad contrast | Include same pitch | Find direction across three notes | Rising/falling/same contour | Locate turning point | Compare contours despite transposition | Missing contour segment | Reverse/compare multi-part contours | Infer transformation from two phrases |
| melody-echo | Explore/echo two tones | Vary start and direction | Three-note short phrase | Repeat chunk | Missing/repeated note | Two chunks with changed ending | Reverse phrase | Transposed contour with reference | Choose then reproduce transformation |
| beat-studio | Copy count, no timing grade | More/fewer taps, no timing grade | Short/long gap contrast | Repeat rhythmic unit | Include meaningful rest | Group/accent phrase | Missing rhythmic segment | Compare equivalent rhythm at new tempo | Compose constrained rhythm and replay/check |

These music/art year steps are design judgments, not cited age norms. Avoid grading pitch perception, speed or motor timing as general ability. Device sound must be user initiated, audible through the real output path, cancellable, and independent of coaching narration. Quiet rest is intentional. Keep replay unlimited and let children use their own steady tempo.

## Implemented changes versus longer-term targets

The following describes the revised source in this work, not the older shipped bundle. The year tables above remain a design direction: they are not a claim that every aspirational literacy, music, drawing or mathematics extension is already implemented.

| Mode group | Implemented in `discovery.js` / `adventures.js` | Remaining boundary |
|---|---|---|
| Shape detective | Named recognition at 2–3; property clues at 4–7; all 8–10 rounds use conjunctions of angles, parallel sides, equality and symmetry. Thirteen actual polygon geometries, with a guaranteed same-side distractor; rotated choices; model only on Hint. | Selection demonstrates property recognition, not a written geometric proof. |
| Color buddies | Named color at 2–3; paint combinations at 4–5; tint at 6; shade at 7; warm/cool at 8; hue plus lightness at 9; complementary paint-wheel relationship at 10. | Color theory is a focused art exercise, not a grade-level academic assessment; color-vision usability still needs direct testing. |
| Pattern parade | Varied repeating-unit phase at 2–8; interior missing pictures from 6; arithmetic missing terms and alternate operations at 9–10. | No free construction or explanation scoring. |
| Sort / oddity | Sorting progresses from familiar categories to edge attributes, two conditions, parity/divisibility and fraction benchmarks. Oddity uses varied valid examples; 8 tests factors, 9 common multiples, 10 fraction equivalence. | Classification remains selection-based, with a stated rule. |
| Memory | Same pictures at 2; changed visual size at 3; rotated/recolored shapes at 4; dots/numerals at 5; case forms at 6; sums at 7; fraction diagrams at 8; products at 9; equivalent fractions at 10. | Memory load and content interact; it does not assess either skill in isolation. |
| Maze | Open-path planning at 2–6, ordered checkpoints from 7. Legal-neighbor highlighting remains; correct route only on requested Hint. | Some years share a maze mechanism; no shortest-route or efficiency score is claimed. |
| Size ordering | Physical flower sizes at 2–5; measured lengths at 6; summed lengths at 7; cm/mm conversion at 8; area at 9; perimeter at 10. Older pictures have identical visual size so metric reasoning is necessary. | No actual ruler manipulation; labels give measurements. |
| Story steps | Five causal scene banks; 2–5 events; unrelated distractor from 7; backwards retelling in alternating rounds from 8. Complete ordered model only on Hint. | Finite authored stories; interpretation/explanation is prompted, not machine assessed. |
| Directions | Concrete arrow following through 6; inverse return route at 7; clockwise quarter-turn at 8; left/right reflection at 9; return plus rotation at 10. | No free route programming or arbitrary coordinate entry. |
| Shape builder | Closed perimeter construction; age-specific triangle/rectangle/polygon/rhombus properties; decoys; both valid perimeter directions accepted. Outline on Hint only. | At 2–3 this is adult-supported exploration; independent preschool success is unverified. At older ages it is constrained construction, not arbitrary drawing verification. |
| Picture rhythm | Varied repeated forms, then remembered sequence at 7, reversal at 8, Clap/Tap substitution at 9, both at 10. Rest remains silent; no timing score. | This is sequence/transform reasoning; actual musical rhythm is a separate Beat studio mode. |
| Fair shares | Variable totals and group counts; exact shares through 8; variable remainders at 9–10. After distribution, 9 predicts cookies needed for another round; 10 divides leftovers into equal fractional shares. Credit waits for that interpretation. | A bounded model of division, not general long division. |

Both engines now start with no solution model, keep wrong-attempt feedback separate from Hint, and speak only after explicit Hear. Requested hints can reveal a model; they do not trigger narration. Existing routes and progress keys remain. All other engine changes are owned and verified separately; consult the final QA report for the final candidate fingerprint and execution evidence.

Verification at this review checkpoint: 39 focused generator/state tests pass, including all nine ages and 24–48 round samples for new rules, independently calculated arithmetic/transform properties, 13 polygon geometries and known symmetry counts. Rendered browser verification passed 274/274 checks on candidate `ee3d20f68d428e38`, across Chromium and WebKit with no skips or flaky cases. This includes every discovery/adventure mode at every age, incorrect attempts, explicitly requested hints, completion, replay, next rounds and older layout/reasoning checks. Four independent return-route checks also confirm that progress markers follow the source arrows consumed in reverse order. Native integration is verified separately. Evidence is in the local work artifact directory `educator-review-qa-2026-09-26/`, including `browser-release-report.json`, `browser-release.log` and `unit-results-final.log`.

One subsequent copy correction changes the age-6 size-order instructions from “flower pictures” to “diagrams,” matching the ruler artwork. Its added instruction/art assertions await the next packaged-build recheck; scoring and generation are unchanged. This checkpoint is not evidence of child testing.

## Concrete implementation and QA gates

1. `challenges.js`, `adventures.js`, `listening.js`: initialize help hidden; remove wrong-answer calls that reveal models. `discovery.js`: wrong sorting feedback must not name the correct basket. `coaching.js` should describe the active round rule, including reversed orders and missing operands. Explicit Hear is instruction access, not a persistent sound setting.
2. `discovery.js`: generate objective/rule independently of answer labels. Add varied phase/missing position, explicit classification predicates and unique relation pairs. Test 2–10 across at least 24 rounds/seeds, checking independent predicates rather than simply comparing a generated `answer` to itself.
3. `adventures.js`: retain fields used by route/UI solvers, but attach explicit rule/task metadata. Vary totals/divisors, orders, causal scenes and spatial transformations. Show an optional geometric outline only on Hint for construction tasks; preserve a starting point and sufficient verbal/visual constraints. Accept both valid directions around the same polygon.
4. `learning-data.js`/`learning.js`: expand meaningful trace content without shrinking stroke allowance to stand in for learning. Counting needs a defined unit at older ages; ten-frame fractional/decimal modes must label the whole. Preserve saved ink and original progress keys.
5. `listening.js`: balance answers and transformations across rounds; score only after actual playback; compare audible relations independently of hidden indices. Never replace live output checks with timer-only success. New task instruction should describe both what is heard and what response is requested.
6. `catalog.js`/`app.js`: each of 34 modes must resolve under each of nine ages: 306 distinct mode/age paths. Test family tab change, effective support setting, legacy route, reset, next round and re-entry. A displayed “age 10” must not silently use a saved little-kids level.
7. Browser/native integration: initial view and an intentionally wrong response must leave solution models/highlights absent. Explicit Hint reveals appropriate support; Next clears it. Correct play, retry, undo and replay remain possible. Inspect 375px phone and tablet at youngest, transition and oldest ages, including landscape safe areas and long property clues. Keep targets at least 48 CSS pixels.
8. Content review: test every answer against the stated rule; accept all valid category/geometry/story answers or constrain the prompt. Avoid color-only cues, ambiguous emoji, reading-only preschool controls, arithmetic distractors solved by one trivial digit, repeated banks with memorized positions, or story orders whose supposedly “wrong” steps can reasonably commute.

Completed software checks can establish correctness and presentation, not enjoyment, learning gains, independent preschool usability, physical speaker audibility or VoiceOver usability. Those require the relevant direct observations; none are claimed by this document.
