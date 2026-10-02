# Bundled coaching voice

Updated September 27, 2026. The app includes 120 short synthetic coaching recordings covering all 38 modes at starting ages 2–10. Their combined duration is 1,178.1 seconds and their AAC payload is 10,120,649 bytes. Identical transcripts reuse one clip. These are a general synthetic voice, not a recording or clone of a named person.

## Source and attribution

- Model: [hexgrad/Kokoro-82M v1.0](https://huggingface.co/hexgrad/Kokoro-82M), published with Apache-2.0 weights. The publisher documents permissive training sources and its training-data attributions in the model card.
- Voice: [`af_heart`](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md), US English, speed 0.96.
- Build-only wrapper: [kokoro-onnx 0.6.1](https://github.com/thewh1teagle/kokoro-onnx), copyright 2025 github.com/thewh1teagle, [MIT license](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE).
- ONNX model and voice pack: the wrapper's official [model-files-v1.1 release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1), files `kokoro-v1.0.onnx` and `voices-v1.0.bin`.
- Model SHA256: `beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a`.
- Voice-pack SHA256: `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`.

Only generated audio ships. The model, wrapper, Python environment, phonemizer, and training material are not included in the app or downloaded at runtime. App-authored coaching text is the complete input; no user or child information enters generation. No API credentials or speech service are used.

## Reproduce and update

Use Python 3.12 in a temporary virtual environment with `kokoro-onnx==0.6.1` and `soundfile==0.13.1`. Download the two official release files above into that temporary tools directory and verify their hashes. On macOS, use `afconvert` with access to the system AAC encoder. Run:

```sh
node scripts/voice-transcripts.mjs
/path/to/voice-tools/venv/bin/python scripts/generate-voice-clips.py --tools /path/to/voice-tools
npm run ios:sync
npm test
```

The generator reads `coachingText` directly. It generates mono 24 kHz PCM, applies fixed per-clip gain targeting RMS 0.15 with peak headroom 0.85, and encodes AAC at 64 kbps. It does not dynamically boost the phone volume. `assets/voice/manifest.json` records exact text, mode/age coverage, generation measurements, duration, bytes and file SHA256. Cached clips are reused only when their recorded digest matches. Remove obsolete generated clips after a changed script; the asset test rejects orphan clips.

The build rejects missing, stale or corrupt recordings. It embeds the clips in the standalone HTML, so web and iOS use identical audio without widening the native file-access scope. The new bundle is approximately 13 MB; the added size provides offline voice availability.

## What remains device-generated

Coach tips use these bundled recordings. Changing questions and selected tracing items still use local device speech when Hear is explicitly requested. If a clip is malformed or unavailable, the same active request may fall back to local speech. Slow or stalled preparation reports a retry state rather than silently replacing a bundled clip with device speech. Coach may silently predecode its selected clip into a bounded, memory-only offline cache; only Hear can activate live output. Silent navigation, answer feedback, visual hints, Stop, leaving a route and background cancellation are tested separately. An old saved narration preference never enables automatic speech.

Generator waveform checks and successful decode/playback establish non-silent digital audio, not subjective naturalness or a physical speaker's loudness. Listening on actual iPhone speakers and child usability remain direct acceptance checks. See the final phase QA report for execution evidence and the candidate fingerprint.
