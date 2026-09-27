# Natural coaching clips on request — summary

Generated and embedded 116 offline synthetic Kokoro af_heart clips covering all 34 modes and ages 2–10. The build verifies current transcript coverage, asset hashes and payloads. Clip generation is a development step; no child audio or profile is sent to a service. The runtime needs no account, backend or network.

All coaching and spoken feedback require Hear. Entry, wrong answers, hints and completion remain quiet. Listen and instrument-pad actions intentionally produce game sound. Navigation, dialogs, inactivity and Stop cancel playback; late asynchronous activation cannot revive cancelled speech. Dynamic question text uses local device speech only after Hear. Device media volume is the sole volume control.

133 unit checks pass, with audio lifecycle, offline decoding and PCM verification retained in staged browser evidence. All 116 AAC clips decode in both engines without nonfinite values, silence or clipping. Six trusted native sound/Coach interaction cases pass on the main runtime `2c7d4518986f0cef` (audio is unchanged in final `4df4c6c112b64140`), requiring real playback completion and cancellation. Physical speaker audibility and subjective voice preference remain direct-device checks.

See [voice provenance](../../../docs/voice-provenance.md) and [QA evidence](../../../docs/challenge-design-voice-qa.md). Temporary generation dependencies and model downloads were removed after verification, freeing about 509 MB while retaining clips, manifests, scripts and logs. This revision has not been uploaded to TestFlight.

Independent main-candidate CI at `259c725` passes all six trusted native sound/Coach cases as well as the full 750 browser and 284 native integration checks. The audio files and lifecycle code are unchanged in final `4df4c6c112b64140`.
