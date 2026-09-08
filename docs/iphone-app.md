# Doodle Fun for iPhone and iPad

`ios/DoodleFun.xcodeproj` contains a small SwiftUI application that opens directly into the bundled Doodle Fun activities. It requires iOS 17 or newer and supports iPhone and iPad in portrait and landscape. There are no third-party native dependencies, accounts, advertisements, analytics, or remote content requirements.

## Build and run

From the repository root:

```sh
npm ci
npm run build
node scripts/sync-ios.mjs
open ios/DoodleFun.xcodeproj
```

In Xcode, select the shared **DoodleFun** scheme and an iPhone or iPad simulator, then Run. For an actual device, select your development team under Signing & Capabilities and choose the connected device. A unique bundle identifier may be needed for your team. No signing identity or account is included in the repository. Signing and device installation are separate from the unsigned simulator build; this project has not been submitted to the App Store.

The sync command copies the self-contained generated root `index.html` to the app's Resources directory. It rejects an unbuilt page or external script/stylesheet dependencies and writes the build fingerprint and SHA-256 into `BundleManifest.json`. Run it after each web build. The bundled resource is committed so the Xcode project can also open without Node.js.

Command-line simulator build and tests:

```sh
xcodebuild -project ios/DoodleFun.xcodeproj -scheme DoodleFun \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO build

xcodebuild -project ios/DoodleFun.xcodeproj -scheme DoodleFun \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath ios/build -parallel-testing-enabled NO \
  CODE_SIGNING_ALLOWED=NO test
```

Choose an installed simulator name from `xcrun simctl list devices available`. The simulator application is at `ios/build/Build/Products/Debug-iphonesimulator/DoodleFun.app`. To install it on an already booted simulator:

```sh
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/DoodleFun.app
xcrun simctl launch booted com.kartikkp.DoodleFun
```

## Native behavior

- All activities load from the packaged HTML. Navigation is restricted to that exact file and its activity fragments. Network resources are blocked by a WebKit content rule. No service worker is needed for native offline launch.
- WebKit's default persistent store keeps local settings and progress across application launches. Native and browser installations have separate storage. Removing the app removes its local data; there is no cloud backup.
- The native shell reloads the current activity when WebKit reports a terminated content process. It preserves data already saved by the web app, but cannot restore a gesture or round that was only in memory. Repeated termination displays a native **Try again** action.
- **Save** opens the system share sheet using a temporary PNG. Cancelling returns to the drawing; reopening works. The popover is anchored on iPad. The file is deleted when sharing completes or is cancelled. Native validation permits only a bounded, decodable PNG from the bundled main frame and sanitizes the filename.
- Spoken coaching uses `AVSpeechSynthesizer`. It follows the web sound preference, replaces the previous utterance, and stops when the app becomes inactive. Available voices are supplied by iOS.
- A debug-only `--reset-test-data` launch argument isolates automated UI tests. It is excluded from Release behavior.

## Bridge contract

Only the trusted bundled main frame may send messages to `window.webkit.messageHandlers.doodleNative`:

```js
const postMessage = message => window.webkit.messageHandlers.doodleNative.postMessage(message);
postMessage({type: 'shareImage', dataURL: 'data:image/png;base64,...', name: 'my-doodle.png'});
postMessage({type: 'speak', text: 'Let’s try one small step.'});
postMessage({type: 'stopSpeaking'});
```

The native share sheet dispatches `doodle-native-share` with `event.detail.status` equal to `completed`, `cancelled`, or `failed`. The web app requests sharing only after the child presses Save. The wrapper's own injected script sends validated `route` messages to remember the current activity for process recovery.

## Verification

Validation on 8 September 2026 used Xcode 26.6 and bundled build `030d813f25b61b2d` (SHA-256 `3a9feb0f286f3164d2e7b470ecc217bffd4ff02ac5538f4ff3007f933c039af4`). The unsigned simulator build passed. All eight tests passed on both iPhone 17 Pro and iPad Air 11-inch (M4), running iOS/iPadOS 26.5: **16 runs, zero failures, zero skips**. The five native checks also passed on iOS 18.6. Two Node.js sync tests passed.

After the modal safe-area adjustment, bundle `87f8df15e211c1db` (SHA-256 `af8c43d63e9bf5f3f34e5b3573cfe4e1bf0edc0ad641d874f9930854043ba770`) passed the three affected checks on each device: bundle integrity, Coach/navigation, and drawing share/new-picture confirmation (**six additional runs, zero failures or skips**). Screenshot inspection confirmed the iPhone Coach panel clears the status bar, the confirmation choices are visible, and the iPad popover is correctly placed.

After the drawing-status race fix, final bundle `ee99aaf12c5dbcac` (SHA-256 `e9f259d2ba6a20cc5f8a22a8f0716bc6a4a26b4d877fbb7f37b4e7d892f2e810`) passed bundle integrity and drawing sharing/new-picture confirmation on both devices (**four additional runs, zero failures or skips**). This targeted recheck again opened and cancelled the real system share sheet twice, reopened it, and cancelled the new-picture confirmation while preserving the drawing.

The native UI runs verified Coach and return navigation, read-aloud settings across an app relaunch, and two consecutive actual PNG share/cancel/reopen cycles per device. Screenshots captured coaching, the system share sheet, and the preserved drawing after cancellation. The recovery test exercises WebKit's public termination delegate callback and verifies the reload and local storage; it does not forcibly kill the WebKit process.

Native tests cover exact local navigation boundaries, PNG decoding and filename validation, oversized/malformed share inputs, bounded route messages, process-recovery reload, and local-storage persistence. UI tests exercise launch, Coach, return navigation, settings across relaunch, and two consecutive share/cancel cycles through the real drawing Save button. The sync tests reject dependencies that would prevent a self-contained native launch.

Simulator tests check integration and layout but do not replace trying the app on a physical iPhone/iPad, particularly Apple Pencil, VoiceOver, available speech voices, and destination apps in the share sheet. App Store submission would additionally require an owner-selected signing team, distribution metadata, and review of Apple's current requirements.

## Apple references

- [WKWebView local file loading](https://developer.apple.com/documentation/webkit/wkwebview/loadfileurl(_:allowingreadaccessto:)) documents the separate read-access scope used here.
- [WKWebsiteDataStore](https://developer.apple.com/documentation/webkit/wkwebsitedatastore) documents the default persistent store.
- [WKScriptMessageHandler](https://developer.apple.com/documentation/webkit/wkscriptmessagehandler) defines the JavaScript-to-native bridge.
- [Web content process termination](https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)) provides the recovery callback.
- [UIPopoverPresentationController](https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller) defines the source view and rectangle needed for iPad presentation.
- [Speech synthesis](https://developer.apple.com/documentation/avfoundation/speech-synthesis) documents native spoken prompts.
