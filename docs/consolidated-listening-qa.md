# Consolidated catalog and listening QA

September 13, 2026. This report covers the 21-family, 34-mode increment in [PR #6](https://github.com/kartikkp/Doodle-fun/pull/6). Earlier QA reports retain their original runtime identities.

## Current review runtime

- Web/native fingerprint: `d93e19bf622087d0` (application fix `e71fdb7`, final tested revision `3011df2`). This increment is in a draft PR; it has not been merged or published.
- Standalone/native HTML SHA-256: `65542141b0278404fe4948a698141401f412c4a9e52c38f812c4c5ab5381ff6e`.
- All 30 original exercises remain available, alongside four new listening modes. Drawing/progress keys and old exercise links are preserved. Related exercises share one home card and explicit mode controls.
- The owner's signing project SHA-256 remains `bd176defe8efbb0185dc1f6a46249abc36317269bc03e885c9daffd54b56a445`; it is excluded from the change. Native tests run through copied projects and dedicated simulators.

## Source, browser and audio evidence

- JavaScript syntax checks and **79/79 Node tests** passed on the current runtime. Four added lifecycle regressions cover replacing failed/interrupted audio contexts and ignoring late events from retired contexts.
- **Final [CI run 34787562004](https://github.com/kartikkp/Doodle-fun/actions/runs/34787562004) passed on `3011df2` and the current runtime: 79/79 Node tests, 630/630 Chromium/WebKit cases without skips, an unsigned iPhone Release build, 283/283 native gameplay/bridge/layout cases, and 4/4 trusted native sound playthroughs.** The browser total includes all 86 listening cases: every game at ages 2–10 plus signal, replay, interruption, recovery and failure guards. The four native sound playthroughs use age two and actual simulator touch gestures.
- Dedicated family/mode tests passed in Chromium and WebKit: every mode reached through its card at ages 2, 6 and 10, each original exercise link, per-mode saved support, and correct Coach context. Legacy-page regressions also verify that changing tabs updates actual game difficulty and Coach together.
- The complete independent CI rerun, [34772337237](https://github.com/kartikkp/Doodle-fun/actions/runs/34772337237), succeeded on application/test commit `f5e101b`, runtime `ad3544bbd06a552e`: **628/628 browser cases**, the unsigned iPhone Release build, and **282/282 native gameplay/bridge/layout cases**. Earlier failures were stale test selectors for consolidated cards; corrected tests preserve the same gameplay and geometry assertions.
- [CI run 34782058175](https://github.com/kartikkp/Doodle-fun/actions/runs/34782058175) also succeeded on `b13a06d`, runtime `9a819bdfd018e8e0`, after the audio-recovery fix. [Run 34782519314](https://github.com/kartikkp/Doodle-fun/actions/runs/34782519314) verified that same runtime with **79/79 Node tests, 628/628 browser cases, the unsigned Release build and 282/282 native gameplay/bridge/layout cases**. Its added native audio step passed **three of four trusted listening tests**; Beat studio exposed a real background-return defect described below, so that CI run failed overall.
- **All 84 listening browser cases are included in that passing total: 42 Chromium and 42 WebKit, without skips.** These include all four games at every age 2–10, wrong attempts, hints, replay, completion, independent narration/game sound, interruption/cancellation, duplicate-credit prevention, corrupted preferences, unavailable audio and a stalled audio clock.
- Audio tests observe the real browser audio graph and require nonzero output with an advancing audio clock. OfflineAudioContext also renders and compares the actual generated voices. They do not replace playback with a fake clock or award completion from an animation.
- The local host's desktop WebKit backend produced neither advancing audio time nor signal. Its 38 live-audio cases were explicitly capability-skipped locally; four synthesis/failure/preferences cases passed. Chromium used software audio output. Two locally paused-renderer cases passed on an unchanged quiet recheck. The independent CI run above supplies complete live WebKit evidence.

## Native iPhone evidence

On dedicated iPhone 17 Pro/iOS 26.5 and iPhone SE 3/iOS 18.6 simulators, **all 270 original age/exercise gameplay cases passed per device**, together with all seven bridge and four parental-gate cases, on runtime `ad3544bbd06a552e` (HTML SHA-256 `f00f7a84c96fe4c808bcc9c0bb132311e70ff0072cf69a3e8a033646e92b52b8`). These cases open the selected family/mode, exercise meaningful wrong/right/recovery behavior, and verify retained progress. The initial landscape helper still referenced removed home cards; its selectors now use family cards while checking the actual leaf activity and retaining every geometry/control assertion.

**The broader local native touch/audio matrix and refreshed store screenshots still need an unlocked Mac.** Local UI runs experienced severe event-synthesis/renderer stalls. A trusted Listen tap reached the app, but the native Web Audio context stayed suspended with `currentTime = 0` and a pending resume promise; the app correctly kept answers locked and offered retry. A subsequent host-state check confirmed that the screen was locked. Speakers are present. These local observations do not establish whether playback will work on that host after unlock. The final independent CI above supplies passing native sound-flow evidence on its own simulator; it does not replace the outstanding two-phone local matrix.

Independent CI on `9a819bdfd018e8e0` established successful age-two native playback and completion for Sound detective, Higher or lower and Melody echo. Beat studio also completed its initial Listen, but after Home → activate it retained “Your turn” and an enabled drum. This is a real interruption gap, distinct from the locked local host: relying only on WebKit visibility/audio-state events does not reliably invalidate a heard round after a quick native app transition. Commit `e71fdb7` adds a fixed native lifecycle event on inactivity and redelivers it on return in case background JavaScript was deferred. The Beat studio test now explicitly waits for the app to enter `runningBackground` or a suspended background state before activating it; its paused-state, disabled-input, fresh-playback and actual-completion assertions remain unchanged. The final CI run passed the native visible-document lifecycle regression and all four trusted sound playthroughs, including Beat studio’s real background/return and fresh-Listen completion. The return-state assertions were preserved.

No further local simulator interaction runs while the host is locked. After unlock, test the current runtime's four trusted listening flows, then complete the native touch/layout suite serially on the two dedicated phones, using a temporary display/sleep assertion. If pristine playback still fails, continue the isolated audio-session diagnostics before signing off that local device/runtime. No microphone or system-audio capture is needed.

The ten checked-in store screenshots still show the earlier `05facec229a9211d` app. Their manifests remain intact; they must be recaptured for the consolidated catalog and listening games before this revision is submitted. The updated capture helper supports either an honest initial listening prompt or a ready state that requires actual completed playback.

The final full CI log is retained as `work/consolidation-qa/ci-34787562004.log`, with its native audio artifact under `work/consolidation-qa-ci-audio-34787562004`. All four final native completion screenshots were visually reviewed: success feedback, mode hints, tap counts and large action controls were readable. The captures retain their original 1206 × 2622 pixels. These are QA captures, not replacement App Store assets.

Raw local logs, copied-project manifests, xcresults and audio signal attachments are retained under the workspace's `work/consolidation-qa*` directories. The audio evidence note and CI triage index are in `work/consolidation-qa`.

## Fixes found during review and QA

- Null/array/malformed stored sound preferences no longer prevent an activity from opening.
- An unavailable or stalled AudioContext returns to a clear retry state and cannot score an unheard challenge.
- Native app inactivity now explicitly invalidates unfinished listening attempts, even if the web document remains visible. Foreground redelivery covers deferred background execution; no native audio-session override or silent-audio primer was introduced.
- Confirmed interruption/retry races are fixed by retiring a failed or suspended context and creating a fresh one on the next explicit listening action. Delayed events from an old context cannot stop its replacement. This fix does not establish that the locked host's initial audio-start failure is resolved.
- Sound previews expose their busy state and cannot accidentally submit an answer. Opening Coach, backgrounding or leaving cancels scheduled notes.
- Legacy `#letters` and `#numbers` pages synchronize their selected mode before rendering, so saved adjustments and visible Coach advice match the actual practice difficulty.
- Test fixtures were updated to exercise the new public family/mode controls. No original age/exercise gameplay case was removed.

## Limits

Software audio-signal checks and successful simulator interactions do not establish physical speaker/headphone audibility, real device volume/Silent-mode behavior, or what a child heard or learned. Physical-device TestFlight listening, VoiceOver and supervised child playtesting remain separate release checks. No microphone or system-audio recording permission was requested, and no App Store upload or submission was performed.
