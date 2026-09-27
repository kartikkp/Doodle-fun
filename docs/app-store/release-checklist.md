# Doodle Fun — release checklist

**Current build 4 — Testing September 27:** signed Release 2.1.0 (4) from merge `6a7b13a`, runtime `4df4c6c112b64140`, passes archive and App Store distribution signature/identity/content/privacy checks. All six final native audio checks pass. User reauthentication resolved Xcode signing; upload succeeded at 15:27:13 UTC. After the owner manually authenticated Safari, Apple processing was verified **Complete** for app `6816519633`, build UUID `5c368446-aea8-4f3e-a14b-973e1d4c1d6e`. What to Test was saved and read back. Build 4 was assigned to existing **Doodle Fun Internal** (one tester) and **Doodle Fun Beta** (two testers); Submit for Review was completed with automatic tester notification checked. At approximately **16:13 UTC**, both groups' Builds pages showed **2.1.0 (4) — Testing**, with no pending review status shown.

No groups, testers or public links were created, and no public App Store submission occurred. Actual build 4 installation, notification-email delivery and physical acceptance checks remain unverified. Safari and Xcode were released to the authorized other chat after verification. The earlier release records below remain historical.

**Historical build 3 follow-up:** system media volume replaced all game mute/volume controls, and Beat Studio percussion became stronger. Candidate runtime `38dd5ac3d8d348ae` was archived but not uploaded. Export was blocked by account/distribution-certificate availability while the Mac was locked. Build 4 supersedes the remaining verification/export/upload handoff. See [historical audio QA](../system-volume-audio-qa.md).

**Historical build 2 update — September 26:** 2.1.0 (2), runtime `cf73382cbd44d40f`, passed 95 unit, 702 browser and 289 native cases and distribution-signature checks. Upload and Apple processing completed. Testing notes were saved, and the internal group was **Testing** build 2. The external group had two authorized testers; build 1 was **In Review**, and Apple blocked assigning build 2 externally until that review finished. Invitation emails were pending approval at that time. Build 4's status above supersedes that blocked handoff. See the [current release status](README.md) and [build 2 audio/difficulty QA](../audio-difficulty-qa.md). The build-1 preparation history below remains version-specific.

## Build 1 preparation record

September 26, 2026. **Target: TestFlight.** Individual membership and App Store Connect access are active; Terms of Service were accepted with explicit owner approval. The [app record](https://appstoreconnect.apple.com/apps/6816519633/distribution) exists. A signed Release archive was built and its contents audited. App Store distribution export succeeded and correctly re-signed the app; the cached archive profile is no longer a blocker. Upload succeeded September 26 at 21:15:20 UTC; Apple processing is Complete and build 2.1.0 (1) is assigned to Doodle Fun Internal. The authorized internal tester is Invited. Doodle Fun Beta has the authorized external tester and build assigned; its beta submission is Waiting for Review with automatic notification enabled. External approval and physical checks remain pending. The owner has not checked the latest audio build. See the [audio follow-up](../iphone-audio-fix.md), [metadata worksheet](metadata.md), and [QA report](../consolidated-listening-qa.md).

## Selected launch settings

| Setting | Release value |
| --- | --- |
| App name | Doodle Fun: Draw & Discover — app record created |
| Apple ID / SKU | `6816519633` / `doodlefun-ios` |
| Bundle identifier | `com.minoli.DoodleFun` — app record and current archive |
| Membership | Individual, active — exact legal seller name still to verify |
| Language | English (U.S.) |
| Pricing | Free; no advertising, in-app purchases, or subscriptions |
| Availability | United States |
| Category | Education; Made for Kids, ages 6–8 |
| Content rating | Expected 4+; Apple's questionnaire result is not assigned yet |
| Devices | iPhone and iPad, iOS/iPadOS 17 or later |
| Release | Manual release after review approval |
| Public support email | pishahrodi+support@gmail.com — published and verified September 26 |

Name, Apple ID, SKU, bundle ID, English (U.S.) and iOS platform are verified in the created record. Price, territory, category, rating and public-release settings remain prepared choices for a later store listing. Kids ages 6–8 is the selected store audience; adjustable practice ages remain 2–10.

## Preparation completed and remaining verification

- [x] Prepare the listing description, subtitle, keywords, reviewer instructions, support contact, and privacy copy. The prepared text fits the store field limits; final account answers still need verification.
- [x] Build and audit the contents of signed Release 2.1.0 (1), `com.minoli.DoodleFun`, runtime `1668feee4dc43ee0`, HTML SHA-256 `bc7741c687505bfebbd503e01f506b75f80e41a251cef214355d34f37a907e8d`, with Xcode 27 (27A266a). The subsequent App Store export re-signed the app correctly; its distribution profile and code signature are verified. The subsequent upload and processing are complete; internal build assignment is verified below.
- [x] Complete the hotfix's nine bridge and four trusted sound UI checks: **13/13 passed**, no failures/skips. Node **88/88** and targeted browser **96/96** also passed. The native result records audio-session activation warnings. Prior full CI totals of 80 Node, 640 browser, 283 native, four sound cases and six focused iPhone checks remain historical `0f` evidence, not a full retest of this change.
- [x] Prepare and visually review all ten store screenshots for the 21-family, 34-mode app. Their capture source is `0f22199625622369`; the hotfix leaves visible UI unchanged. Preserve the [screenshot manifests and status](screenshots/README.md) as the original provenance when checking listing accuracy against the submitted build.
- [x] Merge the audio hotfix: [PR #7](https://github.com/kartikkp/Doodle-fun/pull/7) merged as `97cd87f`; PR #6 is also merged. Source [CI 35552079793](https://github.com/kartikkp/Doodle-fun/actions/runs/35552079793) passed its activities and iPhone-build jobs. Current release work is on `codex/testflight-release`; physical listening remains pending.
- [x] Verify published pages: privacy, support and homepage returned HTTP 200 September 26 and exactly matched current local source. The consolidated catalog, sound/volume guidance, September 20 policy and voluntary support email are published. The earlier stale-page preflight remains historical.
- [x] Receive the public support email and private review contact. TestFlight review contact is saved and verified; private details remain outside the repository.
- [ ] Verify the correct copyright year/rights holder and the individual membership's legal seller name. Do not infer them from file paths or repository ownership.

## Physical iPhone and iPad release checks

Record device, OS version, app version/build, result, and any defect. Use the intended release build; repeat affected checks after fixes.

- [ ] Open every activity family and its modes; check readable instructions, Coach, easier/harder controls, age selection, portrait/landscape layout, and a recoverable wrong answer or retry where applicable.
- [ ] Confirm audible Sound detective, Higher or lower, Melody echo, Beat studio and Make a beat on the intended release. Check speakers and headphones, system media volume, Silent mode, explicit Hear/Listen/Play controls, replay, and background/return recovery. Listening clues require a fresh Listen before scoring; the composer stays stopped until Play. Physical audibility remains distinct from simulator playback checks.
- [ ] Draw a picture and export a PNG to both Photos and Files. Verify the saved image, cancellation preserving artwork, and a fresh grown-up check for each share or external link.
- [ ] In airplane mode, open activities, play generated sounds, and read the privacy policy. Relaunch the app and confirm artwork, settings, and progress persist. Optional system speech depends on available device voices.
- [ ] Check VoiceOver navigation and labels, larger text, and reachable controls on both device sizes. Record limitations honestly; do not select unsupported accessibility claims in the listing.
- [ ] Recommended product research: observe a supervised child playtest for comprehension, enjoyment, and difficulty. This is optional research, not an Apple submission requirement or evidence of learning outcomes.

## Historical build 1 TestFlight handoff

This checklist records the September 26 handoff and its remaining work at that time. Build 4's current status is recorded above.

- [x] Confirm active membership and App Store Connect access; accept Terms of Service with explicit owner approval.
- [x] Create the iOS app record: Doodle Fun: Draw & Discover, Apple ID `6816519633`, SKU `doodlefun-ios`, English (U.S.), bundle ID `com.minoli.DoodleFun`.
- [x] Export Release 2.1.0 (1) for App Store distribution. Verify the re-signed export: profile for `com.minoli.DoodleFun`, `LocalProvision=false`, no provisioned devices, `get-task-allow=false`, and valid code signature. The cached archive profile no longer blocks distribution.
- [x] Upload the verified export: exit code 0, “Upload succeeded” and “Uploaded DoodleFun” at September 26 21:15:20 UTC. Apple has subsequently completed processing.
- [x] Save and verify TestFlight description, feedback contact, marketing/privacy URLs, private review contact and notes; no sign-in is required.
- [x] Confirm processing: Build Uploads shows **Complete** for 2.1.0 (1), UUID `d1297f42-0e32-43a6-87cc-a3e7c358629f`. The external TestFlight submission is now Waiting for Review; this beta review is separate from public App Store review.
- [x] Save What to Test: all four sound games, ages/modes/coaching, drawing, offline behavior and layout.
- [x] Create **Doodle Fun Internal** with automatic distribution off and assign build 2.1.0 (1). Group detail verifies **1 tester and 1 build**; the explicitly authorized internal tester is **Invited**.
- [x] Create **Doodle Fun Beta**, add the explicitly authorized external tester and assign build 2.1.0 (1). Group detail verifies **1 tester and 1 build**; no public link was created.
- [x] Submit the external build for TestFlight beta review with sign-in required unchecked and Automatically notify testers checked. Submission succeeded; status is **Waiting for Review**.
- [ ] Await beta-review approval and automatic external notification; confirm tester installation. Keep personal tester email addresses out of repository documents.
- [ ] Install through TestFlight on physical iPhone/iPad and complete the checks above, especially audible sound and interruption recovery. No fresh physical QA is established by sending an invitation.

## Later App Store submission — outside the current target
- [ ] Enter the selected price, territory, Education/Kids settings, and manual release option. Review the lasting Kids-category commitment in the metadata worksheet.
- [ ] Add the prepared description, subtitle, keywords, reviewed current screenshots, public privacy/support URLs, copyright, private review contact, and reviewer instructions. No demo account is needed.
- [ ] Complete App Privacy against the actual final build and operating practices; “Data Not Collected” remains the expected answer, subject to that verification. Validate the privacy manifest and required-reason API declarations in the archive separately.
- [ ] Complete Apple's age-rating, export-compliance/encryption, and content-rights questions accurately for the submitted build. Do not guess a rating or encryption exemption to clear a form.
- [ ] Select the verified build and submit the completed listing to App Review. Address any review questions or required fixes.
- [ ] After approval, release manually when the owner is ready to launch.

Build 4 upload, processing, saved testing notes and both existing group assignments are verified; both groups show **Testing**. Actual installation, notification-email delivery and physical checks remain unverified. No public App Store submission or release has occurred.
