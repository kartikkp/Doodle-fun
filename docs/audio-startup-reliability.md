# Cold-start audio reliability

Prepared after PR #10 CI exposed two existing startup races. This change keeps real-playback assertions and does not treat device speech or elapsed wall time as successful bundled/game audio.

## Evidence and cause

The [failed native audio retry](https://github.com/kartikkp/Doodle-fun/actions/runs/36954589004/job/110679958232) retained [diagnostic traces](https://github.com/kartikkp/Doodle-fun/actions/runs/36954589004/artifacts/11206477255):

- Beat Studio's first Listen created a suspended context. Its 2.5-second combined watchdog expired before the native reply. Native activation itself took about 60 ms, but route/volume inspection and logging were still on the reply path; another 4.69 seconds elapsed before the reply. No source began playing.
- Coach decoding took 5.398 seconds, exceeding a five-second watchdog that combined output activation and decoding. An earlier run took 14.26 seconds to decode the same clip. The timer closed otherwise healthy output and silently selected device speech. Native TTS “requested” correctly did not pass the clip-completion assertion.

Both failures occurred before the background/parent-lock portions of the tests. The audio code, clips and trusted native UI tests were unchanged from the earlier main branch, which had also shown the Coach failure intermittently.

## Changes

1. `prepareGameAudio` returns `{ok:true}` directly after `setActive(true)`. Normal activation no longer reads route/volume properties or prints success diagnostics before the reply. Native bridge tests inspect the session afterward to retain category, mode, mixing, volume-range and route checks.
2. `audio-startup.js` owns native preparation and output startup as separate phases. Context construction and first resume remain in the original Listen/Hear stack. After native success, a still-suspended context gets exactly one ownership-checked resume. Proven running state can complete readiness without waiting forever for the first resume promise.
3. Initial suspension is expected during startup; interruption after readiness cancels. Cancellation, backgrounding, a newer request and context retirement remain authoritative.
4. Coach silently predecodes only its selected bundled clip using OfflineAudioContext. Preparation does not activate a native session, create/resume a live context, render, create sources or speak. Requests coalesce by exact payload. At most two offline decodes run concurrently; at most four PCM buffers and 16 MiB are retained in memory.
5. A direct cold Hear does not require prewarming. Output readiness completes independently of decoding; a slow decode cannot consume the playback-start watchdog. The UI says “Preparing spoken help…” until a source actually starts and keeps Stop available. Decode timeout fails with a retry state, rather than claiming TTS is the requested clip. Dynamic text and invalid/missing clip fallback remain explicit-request behavior.

## Separate bounds

- Native preparation: 10 seconds; output is never scheduled without a successful reply.
- Post-activation output startup: the existing 2.5-second game / 5-second speech limits.
- Cold clip preparation: a separate 30-second resource ceiling, allowing the observed 14.26-second cold decode without changing output deadlines. A timed-out underlying decode can finish only into discarded work; it cannot revive playback.
- Playback: existing real audio-clock/end-of-source completion and bounded stalled-playback checks remain.

No output gain, audio assets, microphone permission, background audio entitlement, network access, or signing configuration changes are included.

## Verification

Deterministic tests cover late native replies, an unresolved first resume followed by successful post-activation resume, startup suspension, denial/timeout, cancellation/replacement, decode completion at 5.398 and 14.26 seconds, interruption while decoding, silent cache/coalescing/bounds, decode timeout and late callbacks. Existing signal/headroom, frozen-clock and actual-clip completion checks remain.

The normal CI now runs the seven trusted native audio tests both without instrumentation and in an isolated instrumented copy. Diagnostics observe offline decoding and distinct phase caps without replacing promises or changing their results. Neither run can pass by accepting TTS fallback, removing checks, or increasing XCTest's completion waits.

Local syntax and unit results, plus final head-commit browser/native CI outcomes, are recorded in the PR description. Physical-device Guided Access, audio output/volume, VoiceOver and Apple Pencil remain release checks; simulator results do not establish physical audibility.
