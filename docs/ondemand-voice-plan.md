# On-demand spoken coaching

Updated September 26, 2026. Spoken help is a per-request action. Opening an activity, choosing an answer, finishing a round, requesting a visual Hint, changing age, and returning from the background must not start narration. Listen, Hear, instrument previews, and musical pads remain intentional audio controls. Rest remains silent. Screen-reader announcements are accessibility behavior and are not removed.

## Audit and implemented call-site policy

| Area | Earlier speech entry points | Current policy |
| --- | --- | --- |
| `app.js` | Coach Hear; it also enabled a saved read-aloud preference | Coach Hear requests the exact current coaching transcript; no persistent audio opt-in. The button can stop a pending clip. |
| `learning.js` | Trace Hear and Read the question only | Keep these explicit requests; no narration from tracing checks, counting taps, success, or hints. |
| `challenges.js` | Hear only | Keep explicit requests. Dynamic clues remain available without a saved preference. |
| `discovery.js` | Hear, `complete()`, and `hint()` | Only Hear narrates. Visual hints and completion remain silent. |
| `adventures.js` | Hear, `complete()`, `hint()`, and delayed Picture practice completion after a pad finished | Only Hear narrates. No delayed spoken celebration. Picture pads and Listen to pattern keep intentional sound. |
| `listening.js` | No speech start; stops speech before clue/pad playback | No spoken success or retry feedback. Only Listen, Hear instrument, tone pads, and drum taps start the sound engine. |
| `draw.js`, `core.js`, `coaching.js` | No automatic audio calls | Drawing stays quiet. Coaching supplies text; it does not start playback. |
| Native bridge | `speak` uses `AVSpeechSynthesizer`; native inactivity stops it | Retain on-device fallback for explicitly requested dynamic text. Native foreground gating and trusted device QA are integration responsibilities. |

`settings.sound` is a legacy field, not consent for later speech. It must not hide Hear controls or trigger any future narration. Tests exercise both old `true` and `false` values.

## Clip contract

`coachingText(id, age)` returns the age-adjusted start and strategy, normalized with `trim().replace(/\s+/g, ' ')`. Reflection and offline extensions stay on screen. The current curriculum produces **116 unique transcripts across 34 modes and nine ages**, at most **240 characters** each. Recording generation must read this helper after curriculum changes; it must not recreate its conditions independently.

The build provides:

```js
globalThis.__DOODLE_VOICE_CLIPS__ = {
  'Exact normalized coaching transcript.': 'data:audio/mp4;base64,…'
};
```

The exact transcript is the lookup key. Changing a phrase intentionally misses an old clip until generation supplies the new recording. There is no case or punctuation folding and no approximate matching to a different lesson. The runtime accepts only embedded audio data URLs, never a remote clip URL.

The recorded coach is synthesized audio, not a human voice recording. The generation source, voice identity, licenses and per-file provenance belong to the asset manifest and generation process. No inference model, API credential, synthesis service, microphone, or child recording is needed in the app.

The current native shell grants file read access to `index.html` only; the current service worker caches the standalone document and policy pages. Embedding clips preserves those boundaries and keeps downloaded standalone HTML functional without adjacent files. Build size and clip hashes must include the assets. Do not add sibling-file requests or widen native file access merely to make clips load.

## Playback and cancellation

`requestSpeech(text)` is called only by an explicit Hear handler. Importing the module, examining availability, and showing a Coach dialog create no audio context. A matching recording uses a short-lived Web Audio buffer source. Native audio preparation and `AudioContext.resume()` are requested in the original click stack; playback waits for preparation, resume and decoding. This follows the browser requirement to resume audio from a user gesture. [Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

Clip output has unity gain and bypasses the percussion mixer. Loudness and headroom are set when generating the recorded assets; device media volume remains the user control. Each request owns its context, source, timeout and completion callback. New Hear, Stop, route changes, page hiding and native inactivity invalidate the previous request. Delayed decoding, voice discovery or native replies cannot restart it. A retired context is closed again if WebKit delivers a late running event.

An absent or unreadable clip can fall back to native device speech for the same active request. Web fallback selects a local English system voice; it does not select a remote voice. A late voice list is accepted only while that request remains active. Cancellation never triggers fallback. A clip that starts but stalls ends as failed without automatically speaking the phrase again.

The promise reports `played/clip` only when the buffer source ends. Native speech fallback reports `requested/device`, since the current message bridge has no speech-completion reply. The UI must not call that result a completed recorded clip. Browser/device voices and APIs vary, so unavailable help retains its visible transcript.

## Local voice audit

Read-only inspection used `/usr/bin/say -v '?'` and `AVSpeechSynthesisVoice.speechVoices()`. The Mac exposes compact Samantha and other English voices. AVFoundation additionally listed `com.apple.siri.natural.Simone` (en-US, raw quality 2) and `com.apple.siri.natural.Martha` (en-GB, raw quality 2). No English raw-quality-3 entry was reported. Enumeration alone does not establish export capability, listening quality, or redistribution rights. [Apple voice-quality reference](https://developer.apple.com/documentation/avfaudio/avspeechsynthesisvoicequality)

Available local tools include `say`, `afconvert`, `afinfo`, Python and Swift. `ffmpeg` was absent from PATH during this audit. No voice or model was downloaded or installed during the audit. The later asset-generation workflow is separate from this inventory.

## Verification status

- **35/35 focused Node checks passed:** 13 speech lifecycle/fallback checks, 19 listening generation/lifecycle checks, and three existing coaching checks.
- **10/10 isolated Chromium/WebKit clip checks passed:** a known PCM fixture rendered nonzero audio only after Hear; navigation, page hide and native inactivity cancelled it; retry worked; corrupt data fell back once without a remote request. These establish playback behavior, not the naturalness of the generated coach.
- Added built-app checks for silent visual feedback despite legacy opt-in, Hear availability despite legacy opt-out, and an actual bundled AAC coaching clip completing offline without TTS fallback. These require the final synchronized bundle and are pending integration execution.
- Listening answer models now start hidden at every age and reset after replay, retry, wrong answers, interruption and audio failure. Explicit Hint remains available. Ages 9–10 include middle-position sound recall, varied melody/rhythm sequences, and distinct length increases while younger beat copying remains untimed.
- Updated native audio assertions and added `testTrustedCoachClipCompletesOnlyAfterHearAndCancelsOnBackground`. It requires actual bundled playback completion, then checks interruption and absence of automatic replay. Compilation and execution against the final iOS bundle remain integration steps.

Isolated raw results are outside Git under `work/ondemand-voice-qa-2026-09-26`. Simulator and digital-output checks do not establish physical iPhone loudness or child enjoyment. No such result is claimed here.
