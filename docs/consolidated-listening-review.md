# Consolidated catalog and listening design review

September 13, 2026. This document describes the current implementation in `catalog.js`, `listening.js`, `audio.js`, and `core.js`. It records design decisions, age defaults, and acceptance criteria. It does **not** report completed QA for this revision or establish child enjoyment, developmental norms, musical proficiency, or hearing ability. Previous QA results remain tied to their original bundles.

## What changed and why

The library now has **21 home cards and 34 practice modes**, retaining all 30 earlier modes and adding four sound games. See [the complete family/route map](activity-catalog.md).

Doodle studio and Color & create already shared the canvas, supplies, page picker, and draft. They now share a card with Free draw and Coloring pages modes. Five tracing entry points similarly shared one practice-set interface; Trail studio makes that relationship explicit. Counting and frame-building, joining/removing/missing parts, groups/sharing, size/number ordering, shape/color recognition, and the two path tasks are grouped into named modes.

Grouping does not make the skills interchangeable. Letter recognition stays separate from handwriting and word construction. Pattern prediction, category sorting, exception finding, and hidden-pair memory remain separate activities. Story order concerns meaningful events; Shape builder concerns perimeter geometry. Modes keep earlier routes and practice records rather than turning old content into new activity-count claims.

The previous Tap the pattern mode displayed and checked an icon sequence; it did not produce percussion or measure timing. It remains `#rhythm`, labeled **Picture practice** inside Melody echo. The new Listen & echo mode plays actual tones. This distinction preserves the old practice without calling it an auditory task.

## Four distinct listening skills

| Mode | What the child does | What completion checks |
| --- | --- | --- |
| Sound detective · `sound-match` | Hear a generated sound or short sequence, audition choices with Hear, then Choose | The matching timbre; from age five, the requested position in the sequence. Ages eight and above alternate first/last on successive rounds. |
| Higher or lower · `pitch-path` | Hear a tone sequence and select its direction | Rising, falling, or unchanged pitch; ages eight and above also include up-then-down and down-then-up. Volume is not the question. |
| Melody echo · `melody-echo` | Hear a tune and play tone pads in the same order | Every pad in the target sequence. Reproducing the playback tempo is not required. A wrong pad clears the attempt for another try. |
| Beat studio · `beat-studio` | Hear drum taps, tap a drum, and choose Check my beat | At ages two and three, the tap count. From age four, count plus relative short/long gaps; absolute starting time and overall tempo are ignored. |

Sound detective uses synthesized Drum, Bell, Shaker, and Wood block voices. These are generated representations, not recorded instruments or environmental-sound identification. The two youngest defaults offer Drum and Bell; age four adds Shaker; age six adds Wood block.

The modes combine listening with different responses: auditory matching, contour classification, ordered reproduction, and relative rhythm reproduction. They are not four versions of the same multiple-choice question. Their Coach prompts and optional visual models address each task.

## Actual defaults for ages 2–10

`core.js` derives an effective challenge age from the selected age, manual support anchor, and easier/harder adjustment. `soundProfile()` uses that effective age. Manual support anchors remain 3, 6, and 9 for Little learner, Explorer, and Big thinker, with the adjustment clamped to ages 2–10. These are configurable product settings, not validated developmental thresholds.

In the table, sound means choices / events in a clue; pitch means notes / semitones between generated scale steps; melody means pads / notes to reproduce; beat means taps / relative-error tolerance. A semitone is a musical pitch step, not an audio-volume setting.

| Effective age | Sound choices / events | Pitch notes / step | Pitch choices | Melody pads / notes | Beat taps / tolerance | Visible answer model initially |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | 2 / 1 | 2 / 12 | Up, down | 2 / 2 | 2 / count only | Yes |
| 3 | 2 / 2 | 2 / 9 | Up, down | 3 / 2 | 3 / count only | No; hint available |
| 4 | 3 / 2 | 2 / 7 | Up, down, same | 3 / 3 | 3 / 50% | No; hint available |
| 5 | 3 / 2 | 3 / 5 | Up, down, same | 4 / 3 | 4 / 46% | No; hint available |
| 6 | 4 / 2 | 3 / 4 | Up, down, same | 4 / 4 | 4 / 42% | No; hint available |
| 7 | 4 / 3 | 4 / 3 | Up, down, same | 4 / 4 | 5 / 38% | No; hint available |
| 8 | 4 / 3 | 3 / 3 | Up, down, same, hill, valley | 5 / 5 | 5 / 35% | No; hint available |
| 9 | 4 / 4 | 4 / 2 | Up, down, same, hill, valley | 5 / 5 | 6 / 32% | No; hint available |
| 10 | 4 / 4 | 5 / 1 | Up, down, same, hill, valley | 5 / 6 | 7 / 30% | No; hint available |

At ages two through four, Sound detective repeats the same target sound rather than asking the child to isolate it among different sounds. From age five it asks for the last sound; from age eight, it alternates last and first on successive rounds, starting with last. Melody pad spacing also narrows with age, from 12 semitones at age two to two at ages nine/ten; the age-ten pitch-path step is one semitone. These smaller distinctions increase auditory difficulty and should be adjustable if they are not useful for an individual child.

Target note spacing decreases from 0.68 seconds at age two to 0.44 seconds at age ten. Melody answers can still be played slowly. Beat playback's short unit ranges from 0.65 to 0.46 seconds; a long gap is twice its short unit. Beat scoring rescales the target to the child's overall tempo, applies the table's per-gap error limit, and also requires long gaps to be observably longer than short ones. It is not a reaction-speed test. Picture hints remain available, and there is no round countdown.

Ages two and three explicitly invite a grown-up to explore together. Age two starts with an answer model; other ages can request it. A visible answer model supports participation and changes the task from unaided listening to supported practice. Neither completion stars nor software playback success demonstrate what a child heard or learned.

These design choices are informed by [NAEYC's music exploration guidance](https://www.naeyc.org/our-work/families/playing-music-home), which includes listening to instruments and rhythm, and [National Core Arts music standards](https://www.nationalartsstandards.org/sites/default/files/Music%20at%20a%20Glance%20rev%203-5-15.pdf), which develop rhythmic and melodic pattern work. The exact numeric settings above are implementation choices, not prescribed ages from those sources. General principles for adjustable support remain in [age guidance](age-guidance.md).

## Playback, controls, and local data

- **Game sound is separate from Read aloud.** The listening engine does not depend on the spoken-instruction preference. Its on/off choice and Game volume persist locally under `listening-audio-v1`; completed rounds are stored under `listening-progress-v1`, within the app's usual storage prefix.
- **Playback requires a direct control.** Listen plays the clue; Hear previews a Sound detective candidate; tone pads play their notes. Opening a card or enabling game sound does not itself play a clue. Sound detective separates previewing from submitting an answer.
- **Audio is generated offline.** Tones use oscillators; percussion uses oscillator envelopes or generated noise. There are no downloaded samples, microphone requests, voice recordings, or listening-response uploads.
- **Listening turns have explicit readiness.** Answer submission waits for the engine to finish a clue. A failed or interrupted playback leaves the turn unready. This guards state transitions; it cannot prove physical audibility, device volume, or attention.
- **Interruption stops the scheduled sequence.** Opening Coach/dialogs, leaving, backgrounding, or disabling game sound cancels playback. An unfinished turn asks for Listen again. UI feedback explains unavailable or interrupted sound.
- **Volume control is bounded.** Game volume is adjustable from 0.15 to 0.8, initially 0.55, through a bounded gain stage. These are software gain values, not sound-pressure levels or a hearing-safety certification. Device media volume, Silent mode, and headphones/speaker routing still affect audibility.

## Acceptance criteria and remaining evidence

The following checks are requirements for this revision; no result is implied by their presence here:

1. Verify all 21 home cards, all 34 modes, and each old route open the intended practice. Check mode-specific Coach/support state and retained artwork/progress.
2. Exercise every sound mode at each effective age from two through ten, including manual support changes. Compare generated clue data, audible signal, visible prompt, valid answer, and model. Check first/last Sound detective rounds and each supported pitch contour.
3. Confirm non-silent generated output and distinct timbres/pitches; check repeated playback, note cancellation, sound-off behavior, and first playback after load on Safari and the native wrapper. A visual pulse or mocked AudioContext is insufficient evidence of audible output.
4. Attempt answers before Listen, after failed/interrupted playback, and after changing routes or rounds. No stale completion or duplicate practice credit should result. Hear must not choose an answer.
5. For Melody echo, reject wrong order and accept the full sequence at an unhurried response speed. For Beat studio, check too few/many taps, uniformly spaced taps against a mixed-gap target, accurate slower/faster patterns, and count-only behavior for the youngest settings.
6. Verify replay, visual hint, retry, next, game volume, and independent Read aloud choices. Check dialogs and background recovery while notes are still scheduled. No note should spill into another activity.
7. Check iPhone/iPad portrait and landscape layout, touch reachability, screen-reader names, and offline entry. Retain separate evidence for physical-device audio, assistive technology, and child playtesting; do not substitute automated completion for those observations.
