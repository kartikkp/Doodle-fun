# Doodle Fun — TestFlight and App Store kit

**Unreleased creative-learning revision:** source now has 24 families / 38 modes, 120 coaching clips, age-based art tools, focused tracing, optional parent PIN controls and practice medals. See [creative learning QA](../creative-play-qa.md). This is not a TestFlight upload. Build 4 below remains the last verified distribution; archive with a new build number after merging. Public metadata and screenshots must match that eventual release.

**Latest merged revision — TestFlight build 4 Testing:** PR #8 merged as `6a7b13a`. Release **2.1.0 (4)** contains requested hints, harder age-specific games, illustrated interfaces and 116 offline coaching clips (runtime `4df4c6c112b64140`). After Xcode account reauthentication, distribution export passed and upload succeeded **September 27 at 15:27:13 UTC**. The owner manually authenticated Safari; Apple processing is **Complete** for build UUID `5c368446-aea8-4f3e-a14b-973e1d4c1d6e`, and What to Test was saved and read back. At approximately **16:13 UTC**, build 4 was verified as **Testing** on both existing groups' Builds pages: **Doodle Fun Internal** (one tester) and **Doodle Fun Beta** (two testers). Submit for Review was completed with automatic tester notification checked; Apple showed no pending review status. No groups, testers or public links were created. Actual build 4 installation and notification-email delivery remain unverified.

Last observed installations were of older builds; build 4 availability is verified, but installation and email receipt are not. Final checks cover 133 unit, 770 browser, 284 native integration and six trusted native audio cases (the hosted audio timeout was completed by a successful local rerun). See [revision QA](../challenge-design-voice-qa.md). Physical listening and observed child engagement remain acceptance checks. No public App Store submission occurred; historical store screenshots need refreshing before that later step.

**Historical build 3 — September 26, 2026:** It removed game mute/volume controls, ignored old muted/low settings, and strengthened Beat Studio percussion. Device media volume controls game sound; Read aloud controls optional spoken help. The archive passed signature/content checks, but distribution export was blocked by account/distribution-certificate availability while the Mac was locked. Native runtime verification and successful export/upload were pending at that point; build 4 supersedes that release handoff. See [historical audio QA](../system-volume-audio-qa.md).

| App record | Verified value |
| --- | --- |
| Name | Doodle Fun: Draw & Discover |
| Apple ID | `6816519633` |
| Bundle identifier | `com.minoli.DoodleFun` |
| SKU | `doodlefun-ios` |
| Language / platform | English (U.S.) / iOS |
| Current TestFlight build | **2.1.0 (4), processing Complete; Testing in Doodle Fun Internal and Doodle Fun Beta** |
| App Store Connect | [Open TestFlight](https://appstoreconnect.apple.com/apps/6816519633/testflight/ios) |

## Historical build 2 record — September 26

Build 2 contains runtime `cf73382cbd44d40f`, HTML SHA-256 `6ac96b9c96bc20af831ce5508f3adea191e575de7cd1b9c530946934f53d5895`. The Xcode 27 / iOS 27 signed archive and App Store distribution IPA passed signature/content audits. The IPA has the correct team/bundle entitlement, no development devices or debugging entitlement, and no test bundles or DEBUG web diagnostics. Exported profile expiry is September 26, 2027. Archive used `CURRENT_PROJECT_VERSION=2`, preserving the owner's local project/signing file.

**Distribution — verified September 26:** build 2 uploaded at 22:17:51 UTC and Apple processing is **Complete**. Its testing notes are saved, and **Doodle Fun Internal** has build 2 with status **Testing** (one tester / two builds). The internal tester has installed build 1; installation of build 2 is not yet verified.

**Doodle Fun Beta — status at that time:** the group had two authorized testers and build 1, which was **In Review**. External tester rows showed **No Builds Available**; automatic notification was enabled for approval. Apple disabled external assignment of build 2 while build 1 of version 2.1.0 was in review. That blocked handoff is superseded by build 4's verified **Testing** status above. No public link or App Store Connect roles were created for external testers; keep contact details outside Git.

The candidate passed **95 unit checks, 702 browser scenarios and 289 native cases**, including all five trusted audio UI flows. [Source CI](https://github.com/kartikkp/Doodle-fun/actions/runs/36275974967) also passed activities and iphone-build; the manual release-evidence job was skipped. See the [audio/difficulty QA report](../audio-difficulty-qa.md) for the final browser result, measured digital output and limitations. Stronger effect generation does not establish physical speaker audibility; test build 2 on iPhone/iPad before claiming that problem resolved. No automated test establishes child enjoyment or learning outcomes.

The app retains 21 activity families / 34 modes. Game audio is generated offline and remains independent of Read aloud. Picture practice now includes audible Clap/Tap/Stomp; Rest is intentionally silent. Older numerical reasoning, fraction-memory and maze challenges retain optional hints and large touch targets. Foundation exercises remain available.

## Materials for later public submission

- [Release checklist](release-checklist.md), [metadata worksheet](metadata.md), and [native screenshots](screenshots/README.md).
- [Current creative revision QA](../creative-play-qa.md), [build 4 QA](../challenge-design-voice-qa.md), [build 2 audio/difficulty QA](../audio-difficulty-qa.md), [historical catalog/listening QA](../consolidated-listening-qa.md), and [earlier audio activation work](../iphone-audio-fix.md).
- [Privacy](https://kartikkp.github.io/Doodle-fun/privacy.html) and [support](https://kartikkp.github.io/Doodle-fun/support.html), with public support **pishahrodi+support@gmail.com**.

The public pages were verified against build 1 on September 26. Privacy/support source was unchanged in build 2; the newer home/game runtime has not been published to GitHub Pages. Checked-in store screenshots retain their original `0f22199625622369` provenance; refresh their UI/copy against the eventual public release, including the removal of game mute/volume controls. They are not evidence of physical behavior in build 4.

Paid membership and App Store Connect access are verified. TestFlight review information, contact and no-login instructions were saved earlier. Public listing questionnaires, legal seller/copyright verification, screenshots and explicit public-release authorization remain separate from this beta update.
