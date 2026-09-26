# Doodle Fun — TestFlight and App Store kit

**September 26, 2026: the current target is TestFlight.** Individual membership is active, App Store Connect access is confirmed, and Terms of Service were accepted with the owner's explicit approval. The app record is created; upload and Apple processing are complete, and build 2.1.0 (1) is assigned to Doodle Fun Internal. Recipient confirmation remains pending. App Review and public release are later steps.

| App record | Verified value |
| --- | --- |
| Name | Doodle Fun: Draw & Discover |
| Apple ID | `6816519633` |
| Bundle identifier | `com.minoli.DoodleFun` |
| SKU | `doodlefun-ios` |
| Primary language / platform | English (U.S.) / iOS |
| App Store Connect | [Open app record](https://appstoreconnect.apple.com/apps/6816519633/distribution) |

A signed Release **2.1.0 (1)** archive was built and its contents audited with Xcode 27 (27A266a). It contains runtime `1668feee4dc43ee0`, HTML SHA-256 `bc7741c687505bfebbd503e01f506b75f80e41a251cef214355d34f37a907e8d`. App Store distribution export succeeded and re-signed the app with `iOS Team Store Provisioning Profile: com.minoli.DoodleFun`, expiring September 26, 2027. The exported profile has `LocalProvision=false`, no provisioned devices and `get-task-allow=false`; code-signature verification passed. The cached archive profile is no longer a blocker. Upload succeeded with exit code 0 on September 26 at 21:15:20 UTC (17:15:20 New York); Apple processing is now Complete. The processed build UUID is `d1297f42-0e32-43a6-87cc-a3e7c358629f`; its TestFlight status is Ready to Submit before tester access, not an App Review submission.

Audio [PR #7](https://github.com/kartikkp/Doodle-fun/pull/7) merged as `97cd87f`; PR #6 is also merged. Source [CI 35552079793](https://github.com/kartikkp/Doodle-fun/actions/runs/35552079793) passed its activities and iPhone-build jobs. The current release branch is `codex/testflight-release`. The owner has not checked the latest physical audio build; audibility remains pending despite passing automated tests. See the [audio report](../iphone-audio-fix.md).

The app groups 34 practice modes into 21 activities for starting ages 2–10, including four listening games generated offline. Game sound and volume are separate from optional Read aloud; no microphone or voice recording is used. Privacy is readable offline, and a fresh grown-up check precedes sharing or external websites.

## Prepared materials

- [Release checklist](release-checklist.md): TestFlight signing/upload, processing and physical checks, followed by later store steps.
- [Metadata worksheet](metadata.md): verified account facts, prepared listing copy and questionnaire guidance.
- [Native screenshots](screenshots/README.md): five scenes per device family with original manifests.
- [Catalog and listening QA](../consolidated-listening-qa.md): versioned automated evidence and physical-device limits.

[Privacy](https://kartikkp.github.io/Doodle-fun/privacy.html), [support](https://kartikkp.github.io/Doodle-fun/support.html) and the [homepage](https://kartikkp.github.io/Doodle-fun/) returned HTTP 200 on September 26 and exactly matched local source. The current policy includes the September 20 revision, local sound behavior and voluntary email support. The support page describes the consolidated catalog and publishes **pishahrodi+support@gmail.com** with a working email link. The earlier September 8 stale-page check is historical.

All ten checked-in screenshots still match their manifests: five 1320×2868 iPhone images and five 2064×2752 iPad images. The audio and bundle-identifier changes do not alter the pictured UI, so recapture is unnecessary for those changes. Keep their actual `0f22199625622369` capture provenance; they are not evidence that the new physical build is audible.

TestFlight information is saved and verified: description, feedback contact, marketing/privacy URLs, private review contact and notes, with no sign-in required. The **Doodle Fun Internal** group has build 2.1.0 (1) assigned, with automatic distribution off; the group page verifies 0 testers and 1 build. No invitations have been sent. Confirmation of the intended recipient is pending. The saved What to Test checklist covers all four sound games, ages/modes/coaching, drawing, offline behavior and layout.

## Next TestFlight steps

1. Confirm the intended internal tester and add that tester to Doodle Fun Internal; the processed build is already assigned.
2. Make the build available to the intended tester. Install it through TestFlight on physical iPhone/iPad and complete the [device checks](release-checklist.md), including all four sound games, headphones and background recovery.

For the later public listing, selected settings remain free/no ads or purchases, Education, Made for Kids ages 6–8, United States and manual release. These store settings and questionnaires have not been entered or verified. Exact legal seller/copyright information still needs verification; private review-contact details are supplied and stored outside Git. The app's adjustable practice ages remain 2–10.

Upload, processing and internal build assignment are complete. Recipient confirmation, tester access and physical checks remain pending. No App Review submission or public release has occurred.
