# Doodle Fun — TestFlight and App Store kit

**September 26, 2026: TestFlight build 2 is the current candidate.** The owner reported faint effects and insufficient older-child difficulty in build 1. Build 2 addresses those reports; public App Store submission remains a later step.

| App record | Verified value |
| --- | --- |
| Name | Doodle Fun: Draw & Discover |
| Apple ID | `6816519633` |
| Bundle identifier | `com.minoli.DoodleFun` |
| SKU | `doodlefun-ios` |
| Language / platform | English (U.S.) / iOS |
| Current candidate | **2.1.0 (2)** |
| App Store Connect | [Open TestFlight](https://appstoreconnect.apple.com/apps/6816519633/testflight/ios) |

Build 2 contains runtime `cf73382cbd44d40f`, HTML SHA-256 `6ac96b9c96bc20af831ce5508f3adea191e575de7cd1b9c530946934f53d5895`. The Xcode 27 / iOS 27 signed archive and App Store distribution IPA passed signature/content audits. The IPA has the correct team/bundle entitlement, no development devices or debugging entitlement, and no test bundles or DEBUG web diagnostics. Exported profile expiry is September 26, 2027. Archive used `CURRENT_PROJECT_VERSION=2`, preserving the owner's local project/signing file. Increment the build number for any later upload.

**Distribution: build 2 uploaded successfully at 22:17:51 UTC on September 26.** Xcode reported Apple processing. Processing and tester-group assignment still need verification; another workflow was concurrently changing Safari, so assignment is paused pending safe access. Existing groups are Doodle Fun Internal and Doodle Fun Beta; use those authorized testers. Do not create a public link or grant external testers account roles. Keep private contact details outside Git. Build 1 was uploaded and processed successfully; its earlier status and provenance remain in `.planning/STATE.md`.

The candidate passed **95 unit checks, 702 browser scenarios and 289 native cases**, including all five trusted audio UI flows. See the [audio/difficulty QA report](../audio-difficulty-qa.md) for the final browser result, measured digital output and limitations. Stronger effect generation does not establish physical speaker audibility; test build 2 on iPhone/iPad before claiming that problem resolved. No automated test establishes child enjoyment or learning outcomes.

The app retains 21 activity families / 34 modes. Game audio is generated offline and remains independent of Read aloud. Picture practice now includes audible Clap/Tap/Stomp; Rest is intentionally silent. Older numerical reasoning, fraction-memory and maze challenges retain optional hints and large touch targets. Foundation exercises remain available.

## Materials for later public submission

- [Release checklist](release-checklist.md), [metadata worksheet](metadata.md), and [native screenshots](screenshots/README.md).
- [Current QA](../audio-difficulty-qa.md), [historical catalog/listening QA](../consolidated-listening-qa.md), and [earlier audio activation work](../iphone-audio-fix.md).
- [Privacy](https://kartikkp.github.io/Doodle-fun/privacy.html) and [support](https://kartikkp.github.io/Doodle-fun/support.html), with public support **pishahrodi+support@gmail.com**.

The public pages were verified against build 1 on September 26. Privacy/support source is unchanged in build 2; the newer home/game runtime has not been published to GitHub Pages. Checked-in store screenshots retain their original `0f22199625622369` provenance; review their UI/copy against the eventual public release, including the renamed Game volume control. They are not evidence of build-2 physical behavior.

Paid membership and App Store Connect access are verified. TestFlight review information, contact and no-login instructions were saved earlier. Public listing questionnaires, legal seller/copyright verification, screenshots and explicit public-release authorization remain separate from this beta update.
