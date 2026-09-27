# Doodle Fun — TestFlight and App Store kit

**New activity/voice revision in preparation:** PR #8 now also includes requested hints, harder age-specific games, illustrated interfaces and 116 offline coaching clips. This revision is not on TestFlight. The build 3 archive described below predates it. Refresh store screenshots before a public submission. See [revision QA](../challenge-design-voice-qa.md).

**September 26, 2026: build 3 is prepared but not uploaded.** It removes game mute/volume controls, ignores old muted/low settings, and strengthens Beat Studio percussion. Device media volume controls game sound; Read aloud controls optional spoken help. The archive passed signature/content checks, but distribution export reports no available account/distribution certificate while the Mac is locked. Native runtime verification and successful export/upload remain pending. See [current audio QA](../system-volume-audio-qa.md). Build 2 remains the last verified internal TestFlight distribution; its record below is retained.

| App record | Verified value |
| --- | --- |
| Name | Doodle Fun: Draw & Discover |
| Apple ID | `6816519633` |
| Bundle identifier | `com.minoli.DoodleFun` |
| SKU | `doodlefun-ios` |
| Language / platform | English (U.S.) / iOS |
| Current candidate / last internal build | **2.1.0 (3), not uploaded** / **2.1.0 (2), Testing** |
| App Store Connect | [Open TestFlight](https://appstoreconnect.apple.com/apps/6816519633/testflight/ios) |

Build 2 contains runtime `cf73382cbd44d40f`, HTML SHA-256 `6ac96b9c96bc20af831ce5508f3adea191e575de7cd1b9c530946934f53d5895`. The Xcode 27 / iOS 27 signed archive and App Store distribution IPA passed signature/content audits. The IPA has the correct team/bundle entitlement, no development devices or debugging entitlement, and no test bundles or DEBUG web diagnostics. Exported profile expiry is September 26, 2027. Archive used `CURRENT_PROJECT_VERSION=2`, preserving the owner's local project/signing file. Increment the build number for any later upload.

**Distribution — verified September 26:** build 2 uploaded at 22:17:51 UTC and Apple processing is **Complete**. Its testing notes are saved, and **Doodle Fun Internal** has build 2 with status **Testing** (one tester / two builds). The internal tester has installed build 1; installation of build 2 is not yet verified.

**Doodle Fun Beta** now has two authorized testers and build 1, which is **In Review**. External tester rows show **No Builds Available**; automatic notification is enabled for approval. Apple disables external assignment of build 2 while build 1 of version 2.1.0 is in review. Assign/submit build 2 to that existing group after approval. No public link or App Store Connect roles were created for external testers; keep contact details outside Git. The previous browser conflict is resolved.

The candidate passed **95 unit checks, 702 browser scenarios and 289 native cases**, including all five trusted audio UI flows. [Source CI](https://github.com/kartikkp/Doodle-fun/actions/runs/36275974967) also passed activities and iphone-build; the manual release-evidence job was skipped. See the [audio/difficulty QA report](../audio-difficulty-qa.md) for the final browser result, measured digital output and limitations. Stronger effect generation does not establish physical speaker audibility; test build 2 on iPhone/iPad before claiming that problem resolved. No automated test establishes child enjoyment or learning outcomes.

The app retains 21 activity families / 34 modes. Game audio is generated offline and remains independent of Read aloud. Picture practice now includes audible Clap/Tap/Stomp; Rest is intentionally silent. Older numerical reasoning, fraction-memory and maze challenges retain optional hints and large touch targets. Foundation exercises remain available.

## Materials for later public submission

- [Release checklist](release-checklist.md), [metadata worksheet](metadata.md), and [native screenshots](screenshots/README.md).
- [Current QA](../audio-difficulty-qa.md), [historical catalog/listening QA](../consolidated-listening-qa.md), and [earlier audio activation work](../iphone-audio-fix.md).
- [Privacy](https://kartikkp.github.io/Doodle-fun/privacy.html) and [support](https://kartikkp.github.io/Doodle-fun/support.html), with public support **pishahrodi+support@gmail.com**.

The public pages were verified against build 1 on September 26. Privacy/support source is unchanged in build 2; the newer home/game runtime has not been published to GitHub Pages. Checked-in store screenshots retain their original `0f22199625622369` provenance; review their UI/copy against the eventual public release, including the renamed Game volume control. They are not evidence of build-2 physical behavior.

Paid membership and App Store Connect access are verified. TestFlight review information, contact and no-login instructions were saved earlier. Public listing questionnaires, legal seller/copyright verification, screenshots and explicit public-release authorization remain separate from this beta update.
