# Native App Store screenshots

**September 20 refresh complete.** All ten numbered PNGs are original native captures of runtime `0f22199625622369`, HTML SHA-256 `72c6446e6281d47f8778407df192801956a215040e9dac60c3d7570fd9d842fe`. [Release CI 35544788457](https://github.com/kartikkp/Doodle-fun/actions/runs/35544788457) passed at immutable revision `a52187e04f902a67eab1ef0241429d2d13a12ee9`; application source remains `3fc4971`. Both capture tests passed, all images were independently verified against their retained original attachments, and all ten were visually reviewed. Nothing has been uploaded to App Store Connect.

The five portrait scenes in each family are:

1. Activity library, with age 6 selected.
2. A rainbow colored through six native finger taps using Fill.
3. The letter A completed using native finger gestures.
4. An ABC repeating pattern in Pattern parade.
5. Sound detective after two completed Listen playbacks.

The images use the real bundled WKWebView app. They contain no marketing overlay, browser substitute, generated artwork, cropping or resizing. The simulator status bar is set to 9:41, full Wi-Fi and 100% battery. Normal pattern randomization can change the pictured symbols on later captures.

## Reproduce

The optional manual **Activity QA** workflow input `release_evidence=true` runs six focused native checks and both five-image capture sets on fresh GitHub macOS simulators. It validates iOS 26.5 and device availability, runs serially, and retains results, source hashes, manifests and original PNG attachments for 14 days. Ordinary pull-request QA is unchanged. Download and visually review its artifact before replacing these files.

```sh
gh workflow run qa.yml --repo kartikkp/Doodle-fun --ref YOUR_REVIEWED_BRANCH -f release_evidence=true
```

For local capture, the following requires macOS, Xcode with an available iOS simulator runtime, and the repository dependencies installed. First integrate and synchronize the final app with `npm run ios:sync`. The capture script deliberately does not rebuild or synchronize production files.

Create dedicated simulators named with the `Doodle App Store ` prefix. Do not reuse a personal simulator or the full QA devices; their IDs are explicitly rejected by the script.

```sh
xcrun simctl create 'Doodle App Store iPhone' com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max com.apple.CoreSimulator.SimRuntime.iOS-26-5
xcrun simctl create 'Doodle App Store iPad' com.apple.CoreSimulator.SimDeviceType.iPad-Pro-13-inch-M5-12GB com.apple.CoreSimulator.SimRuntime.iOS-26-5

node scripts/app-store-screenshots.mjs --family iphone --device IPHONE_UDID --output /tmp/doodle-store-iphone --assets docs/app-store/screenshots/iphone
node scripts/app-store-screenshots.mjs --family ipad --device IPAD_UDID --output /tmp/doodle-store-ipad --assets docs/app-store/screenshots/ipad
```

The current helper captures the consolidated library, Doodle studio coloring, Trail studio tracing, Pattern parade, and Sound detective. Its default `--listening-state ready` requires actual completed playback; `--listening-state prompt` captures the initial unheard challenge and labels that state in its manifest. A prompt capture is not proof that sound played. The fifth image now shows listening and replaces the older Coach screenshot.

Unlock the Mac before capture. Run the devices sequentially to reduce simulator resource contention; the helper uses a temporary `caffeinate -di` assertion during its run. Each run resets app data only inside its dedicated screenshot device. It copies the iOS project to the chosen output directory, substitutes the capture XCTest source in that copy, builds without signing, and exports five retained `XCUIScreen.main.screenshot()` attachments. The original project, signing settings and production app source are unchanged.

Use `--prepare-only` to inspect the copied project and `capture-run.json` without booting a simulator or building. Use `--export /absolute/path/to/capture.xcresult` with the original `--output` to repeat extraction without running the app. Each extraction creates a fresh `attachments-*` directory and records it in the manifest, preserving earlier evidence.

The script requires 8-bit RGB PNGs with no alpha and one of these portrait sizes:

| Family | Accepted script dimensions |
| --- | --- |
| iPhone 6.9-inch | 1320 × 2868 or 1290 × 2796 |
| iPad 13-inch | 2064 × 2752 or 2048 × 2732 |

The target dimensions above are included in Apple’s current [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications), verified September 20, 2026. Apple permits one to ten images per set and disallows transparency.

Each family’s `manifest.json` records the source bundle fingerprint and SHA-256, source project and capture-script hashes, simulator, capture time, interaction, image dimensions, original attachment directory and name, and image SHA-256. Review every full-size image before uploading; generated manifests verify provenance and format, not aesthetic quality or current App Store submission eligibility.

## Verified capture set

| Family | Simulator / OS | Images | Actual dimensions |
| --- | --- | --- | --- |
| iPhone 6.9-inch | iPhone 17 Pro Max / iOS 26.5 | 5 | 1320 × 2868 |
| iPad 13-inch | iPad Pro 13-inch (M5) / iPadOS 26.5 | 5 | 2064 × 2752 |

The isolated GitHub runner used Xcode 26.6 build 17F113. Captures ran from September 20 at 23:51 UTC through September 21 at 00:01 UTC (September 20 in New York). Result bundles are `capture-2026-09-20T23-48-07-635Z.xcresult` and `capture-2026-09-20T23-55-18-100Z.xcresult`. Device IDs and exact per-image times are in the manifests. Both Sound detective scenes followed two completed Listen playbacks and use the answer-ready state.

Independent verification checked 78 source hashes against the immutable revision, both passing capture tests, all image dimensions, 8-bit RGB/no-alpha format, PNG integrity, SHA-256, and byte identity against original XCTest attachments. The checked-in files and manifests are byte-identical copies of that verified set. Visual review covered the catalog, contained rainbow fills, completed tracing, pattern choices and listening controls on both devices; no blocking visual issue was found. Simulator evidence does not establish physical-device behavior or App Store acceptance.

Earlier `f0359a88a446a67e` drafts remain outside Git in the release preparation evidence. Their visual review found the subsequently corrected cloud-outline defect; they are not the current listing images. Current source results, original attachments, independent verification and visual-review records are retained in workspace `work/release-prep-2026-09-20/ci-release-35544788457` and `work/release-prep-2026-09-20/artifact-verification`.
