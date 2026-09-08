# Native App Store screenshots

Five actual app scenes are captured in portrait for each device family:

1. Activity library, with age 6 selected.
2. A rainbow colored through six native finger taps using the Fill tool.
3. The letter A traced using native finger gestures.
4. An ABC repeating pattern in Pattern parade.
5. The contextual Coach for Pattern parade.

The images use the real bundled WKWebView app. They contain no marketing overlay, browser substitute, generated artwork, cropping, or resizing. The simulator status bar is set to 9:41, full Wi-Fi and 100% battery. Normal pattern randomization can change the pictured symbols on later captures.

## Reproduce

Requires macOS, Xcode with an available iOS simulator runtime, and the repository dependencies installed. First integrate and synchronize the final app with `npm run ios:sync`. The capture script deliberately does not rebuild or synchronize production files.

Create dedicated simulators named with the `Doodle App Store ` prefix. Do not reuse a personal simulator or the full QA devices; their IDs are explicitly rejected by the script.

```sh
xcrun simctl create 'Doodle App Store iPhone' com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max com.apple.CoreSimulator.SimRuntime.iOS-26-5
xcrun simctl create 'Doodle App Store iPad' com.apple.CoreSimulator.SimDeviceType.iPad-Pro-13-inch-M5-12GB com.apple.CoreSimulator.SimRuntime.iOS-26-5

node scripts/app-store-screenshots.mjs --family iphone --device IPHONE_UDID --output /tmp/doodle-store-iphone --assets docs/app-store/screenshots/iphone
node scripts/app-store-screenshots.mjs --family ipad --device IPAD_UDID --output /tmp/doodle-store-ipad --assets docs/app-store/screenshots/ipad
```

Run the devices sequentially to reduce simulator resource contention. Each run resets app data only inside its dedicated screenshot device. It copies the iOS project to the chosen output directory, substitutes the capture XCTest source in that copy, builds without signing, and exports five retained `XCUIScreen.main.screenshot()` attachments. The original project, signing settings and production app source are unchanged.

Use `--prepare-only` to inspect the copied project and `capture-run.json` without booting a simulator or building. Use `--export /absolute/path/to/capture.xcresult` with the original `--output` to repeat extraction without running the app. Each extraction creates a fresh `attachments-*` directory and records it in the manifest, preserving earlier evidence. Repeating extraction of the final iPhone result produced five byte-identical images.

The script requires 8-bit RGB PNGs with no alpha and one of these portrait sizes:

| Family | Accepted script dimensions |
| --- | --- |
| iPhone 6.9-inch | 1320 × 2868 or 1290 × 2796 |
| iPad 13-inch | 2064 × 2752 or 2048 × 2732 |

Each family’s `manifest.json` records the source bundle fingerprint and SHA-256, source project and capture-script hashes, simulator, capture time, interaction, image dimensions, original attachment directory and name, and image SHA-256. Review every full-size image before uploading; generated manifests verify provenance and format, not aesthetic quality or current App Store submission eligibility.

## Capture status

Captured and visually reviewed on September 8, 2026, from integrated bundle `05facec229a9211d` (HTML SHA-256 `f37041e2d7d6925ca75c8e5246d3031db5f22712091c977361164603f8565ee9`). Both families have identical shipping native-source hashes, verified against the current native source and unchanged source project.

| Folder | Dedicated simulator | PNG size | Result |
| --- | --- | --- | --- |
| `iphone/` | iPhone 17 Pro Max, iOS 26.5 | 1320 × 2868 | 5 images; native capture case passed |
| `ipad/` | iPad Pro 13-inch M5, iOS 26.5 | 2064 × 2752 | 5 images; native capture case passed |

All ten original images were visually reviewed: clear home branding below the status bar, six contained rainbow fills, completed letter practice, a complete repeating-pattern board, and readable contextual coaching. The iPad screenshots show the actual larger-screen layout, including its native window corner control. All ten files match the original retained screenshot bytes, have no transparency, and pass dimensions, orientation and SHA-256 checks. No visual edits were applied.

The retained successful capture results are `capture-2026-09-08T22-51-56-537Z.xcresult` (iPhone) and `capture-2026-09-08T22-56-17-918Z.xcresult` (iPad). Pilot runs stayed outside this folder. Screenshots are prepared for review and upload; this process did not submit anything to App Store Connect.
