# iPhone audio follow-up

September 20, 2026. The owner reported that all four sound games animate but are silent, with Silent mode **off**. The precise cause on that physical phone is not established. The changes below address audio-session activation and playback ordering; the issue remains open until the owner confirms audible playback.

## Current build and behavior

Source commit **`fa41ab9`**, runtime **`1668feee4dc43ee0`**, standalone/native HTML SHA-256 **`bc7741c687505bfebbd503e01f506b75f80e41a251cef214355d34f37a907e8d`**. This supersedes `0f22199625622369` as the candidate being verified. Audio source `fa41ab9` and metadata `24c6a8d` were excluded from PR #6's merge (`dda0d548`, head `c8a6f06`); they are tracked in [PR #7](https://github.com/kartikkp/Doodle-fun/pull/7) on `codex/iphone-audio-output`.

- A weak native reply bridge activates `AVAudioSession` with the playback category and mixing enabled when sound is requested.
- On the same user gesture, supported WebKit audio sessions select `playback` and the app starts `AudioContext.resume()`. Notes wait for both native activation and context readiness. Native denial fails the attempt and allows retry rather than awarding unheard progress.
- Speech cancellation is skipped when speech is idle. Existing sound settings, scoring gates and interruption recovery remain in place.

Apple recommends configuring the session category and activating it when playback begins. Its playback category supports sound with the Ring/Silent switch engaged. [Apple audio-session configuration guide](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/MediaPlaybackGuide/Contents/Resources/en.lproj/ConfiguringAudioSettings/ConfiguringAudioSettings.html). WebKit documents `navigator.audioSession.type = 'playback'` for iOS 17 onward. [WebKit bug 237322](https://bugs.webkit.org/show_bug.cgi?id=237322). These sources support the implementation choice; they do **not** establish that Silent mode caused the owner's report.

## Verification status

| Evidence | Result |
| --- | --- |
| Node tests | **88/88 passed**. |
| Targeted browser checks | **96/96 passed**: 86 existing listening cases, four new session cases and six activation-failure cases. This is not a repeat of the full browser matrix. |
| Initial iOS 27 native bridge checks | **2/2 passed**. Four sound UI cases failed before playback because the test could not obtain its StatusBar geometry and did not recognize the 440×956 device profile. The failed run remains evidence, not a sound pass. |
| Scene geometry and activation follow-up | **1/1 passed**, measuring actual safe-area top62/bottom34. Only that verified device profile was added to the test helper. |
| Final native follow-up | **13/13 passed**, zero failures/skips: nine bridge cases and all four trusted sound UI cases on iPhone 17 Pro Max / iOS 27.0 simulator (24A434). |
| Physical installation | Signed Debug **2.1.0 (1)** built with the owner's team, installed as an update and launched on the real **iPhone 17 Pro Max, iOS 27.0 (24A437)**. Installation did not erase app data. A separately retained signed app passed `codesign --verify`. |
| Physical listening and activation log | **Pending:** no owner confirmation of audible sound or physical activation log has been received. Build/install success does not establish audibility. |
| Release archive | **Pending:** no unsigned Release archive has yet been built or audited for this runtime. The earlier archive belongs to `0f22199625622369`. |

Evidence is in workspace `work/audio-device-fix-2026-09-20`, including `native-final-summary.json` and `native-final-tests.json`. The final run completed normally; its summary records main-thread `AVAudioSession` activation warnings. Preserve the initial failed UI run separately: its post-failure Xcode diagnostics hung and were terminated; that run is not counted as passing. Prior 640-browser/283-native CI and ten store screenshots remain valid for their recorded `0f22199625622369` source only; they are not a full retest of this hotfix. The visible UI is unchanged, so the screenshots retain useful visual coverage with their original manifests and provenance.

## Remaining checks

1. Confirm audible Sound detective, Higher or lower, Melody echo and Beat studio on the installed physical build. Check speakers, headphones, media volume, Silent mode, replay and background/return; if silence persists, collect the activation result and output route before assigning a cause.
2. Build and audit a Release archive of this runtime, then complete distribution signing, upload and the remaining physical release checks in the [release checklist](app-store/release-checklist.md).

No App Store upload, review submission or release is established by this work.

Only completed task-created DerivedData caches (330,915,258 bytes) and the temporary iOS 27 QA simulator were removed after verification. The signed app, copied test project, raw results, exported summaries and logs remain. The owner's signing project and existing simulators were preserved.
