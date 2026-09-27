# Device volume and stronger game audio

September 26, 2026. Candidate runtime **`38dd5ac3d8d348ae`**, bundled HTML SHA-256 **`0f698b6b171679905e0ebb20f64fcfc7b130a4dc73ce1016390aa74b28feac71`**. This follow-up addresses faint effects, especially Beat Studio, after the earlier [audio and difficulty changes](audio-difficulty-qa.md).

## Behavior

- Device media volume is the only user volume control. Listening games and Picture practice no longer show Game sound or Game volume controls. Previously saved disabled/low-volume preferences are ignored; they cannot suppress the new playback.
- Read aloud still controls spoken help independently. Opening an activity does not autoplay. Listen, instrument previews and picture/drum taps initiate effects.
- Beat Studio model and tap feedback both use a **0.16-second** drum with a longer body and stronger midrange content. Clap, Tap and Stomp retain their distinct feedback; Rest stays silent.
- The shared output has fixed small-signal gain **1.15** and a smooth limiter bounded at **0.92** digital amplitude. The old default master multiplier was **0.275** (`0.5 × 0.55`). The limiter bounds overlapping effects; it does not set device volume or establish a physical sound-pressure limit.
- Dialogs, navigation and inactivity still cancel playback. Cancelled or failed listening playback cannot unlock a fresh answer. Native playback-session configuration and the Read aloud preference are unchanged.

## Signal evidence

The comparison uses committed build-2 audio source **`f6207184c46709545df48beb8070779e5587766b`** at its default software volume and candidate audio SHA-256 **`84ec78d48e7b9c6d4853bb42749d7e8f14d685f422bb9dafa2bbbd8e9879763e`**. Measurements render the actual shared output path at 48 kHz, with a 350–5000 Hz stress filter. Chromium and WebKit agree at the precision shown.

| Effect / duration | Previous filtered RMS | Candidate filtered RMS |
|---|---:|---:|
| Drum / 0.16 s | 0.04821 | 0.26289 |
| Bell / 0.30 s | 0.08661 | 0.31719 |
| Shaker / 0.30 s | 0.06235 | 0.22680 |

The drum's first 60 ms filtered RMS increased from **0.08108 to 0.41864**, covering the attack heard before a rapid retrigger. Across the nine-kind, five-duration single-event sweep, the largest candidate sample peak was **0.84516** and measured release tails were zero. Tests also cover 95 ms rapid spacing, normal spacing, 16 simultaneous voices, and 44.1/48 kHz rendering. The candidate ignores the measurement harness's retained `volume` metadata; it has no app volume preference.

These are digital waveform measurements, not microphone recordings, measured iPhone speaker response, SPL or confirmed physical audibility. Device speakers/headphones and system volume still require a real listening check.

## Verification and delivery status

| Check | Current result |
|---|---|
| Unit tests | **95/95 passed**, no failures or skips |
| Offline signal tests, Chromium/WebKit | **10/10 passed**, no failures, skips or flaky results |
| Listening/Picture practice controller tests | **122/122 passed** across Chromium/WebKit; zero failures, skips or flaky results |
| Phone/tablet visual checks | **10 views passed**, no overflow/clipping, controls at least 48 px, legacy muted settings ignored and no autoplay |
| Native test build | Compiled successfully; local runtime execution remains pending because the Mac is locked. [Hosted CI 36280837350](https://github.com/kartikkp/Doodle-fun/actions/runs/36280837350) is running on source commit `f28dc5e` |
| Release packaging | Archive built and signature/content verified; distribution export reports **“No Accounts”** and no **iOS Distribution** certificate |
| TestFlight build 3 | **Not uploaded**; do not treat the candidate as installed or available to testers |

Evidence is retained outside Git in workspace `work/system-volume-qa-2026-09-26`. Its `audio-signal/` directory contains `provenance.json`, `measurements-chromium.json`, `measurements-webkit.json` and `signal-tests.json`; the workspace also retains unit/browser/native logs and packaging artifacts. Earlier build results remain separate and do not establish this candidate's native runtime or physical audio behavior.

After native verification and successful export/upload, check Beat Studio's first tap, repeated taps, Bell, picture-action feedback, device volume changes and background/return on the installed build. Confirm sounds with Read aloud both off and on; the preference should affect only narration.
