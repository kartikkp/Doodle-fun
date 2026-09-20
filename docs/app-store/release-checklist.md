# Doodle Fun — release checklist

September 20, 2026. Individual Apple Developer membership purchased; activation pending. No App Store Connect record, signed upload, or submission is confirmed by this checklist. Use the [metadata worksheet](metadata.md) for copy and questionnaire guidance, and the [current QA report](../consolidated-listening-qa.md) for version-specific evidence and remaining checks.

## Selected launch settings

| Setting | Release value |
| --- | --- |
| App name | Doodle Fun: Draw & Discover — availability unverified |
| Membership | Individual — exact legal seller name to verify in the account |
| Language | English (U.S.) |
| Pricing | Free; no advertising, in-app purchases, or subscriptions |
| Availability | United States |
| Category | Education; Made for Kids, ages 6–8 |
| Content rating | Expected 4+; Apple's questionnaire result is not assigned yet |
| Devices | iPhone and iPad, iOS/iPadOS 17 or later |
| Release | Manual release after review approval |
| Public support email | pishahrodi+support@gmail.com — supplied; prepared locally, not yet published |

These choices are prepared locally and have not been entered or verified in App Store Connect. Kids ages 6–8 is the store audience; the app's adjustable practice ages remain 2–10.

## Finish while membership is pending

- [ ] Finish the outstanding native QA and record results in the current QA report. Do not treat simulator or automated results as completed physical-device testing.
- [ ] Replace and visually review all ten store screenshots for the current 21-family, 34-mode app. Recapture/review is in progress; consult the [screenshot manifest and status](screenshots/README.md) before using any images.
- [ ] Finalize the release source in [PR #6](https://github.com/kartikkp/Doodle-fun/pull/6), preserving the owner's signing configuration.
- [ ] After PR #6 is merged, publish the current privacy/support pages and verify their content, support email, and links. Both public URLs returned HTTP 200 on September 20, but still served September 8 content for the earlier 30-activity app. Current pages must describe the consolidated catalog, sound/volume behavior, and voluntary email support; the public policy must match the offline release policy.
- [x] Receive the public support email and private App Review contact. Private contact details are stored separately from the repository and still need to be entered in App Store Connect.
- [ ] Verify the correct copyright year/rights holder and the individual membership's legal seller name. Do not infer them from file paths or repository ownership.

## Physical iPhone and iPad release checks

Record device, OS version, app version/build, result, and any defect. Use the intended release build; repeat affected checks after fixes.

- [ ] Open every activity family and its modes; check readable instructions, Coach, easier/harder controls, age selection, portrait/landscape layout, and a recoverable wrong answer or retry where applicable.
- [ ] Complete Sound detective, Higher or lower, Melody echo, and Beat studio. Check speakers and headphones, media volume and Silent mode, independent Game sound/Read aloud settings, replay, and background/return recovery with a fresh Listen before scoring.
- [ ] Draw a picture and export a PNG to both Photos and Files. Verify the saved image, cancellation preserving artwork, and a fresh grown-up check for each share or external link.
- [ ] In airplane mode, open activities, play generated sounds, and read the privacy policy. Relaunch the app and confirm artwork, settings, and progress persist. Optional system speech depends on available device voices.
- [ ] Check VoiceOver navigation and labels, larger text, and reachable controls on both device sizes. Record limitations honestly; do not select unsupported accessibility claims in the listing.
- [ ] Recommended product research: observe a supervised child playtest for comprehension, enjoyment, and difficulty. This is optional research, not an Apple submission requirement or evidence of learning outcomes.

## Once membership activates

- [ ] Verify the individual account/team and legal seller name; accept required account agreements.
- [ ] Create or confirm the App Store Connect record, name availability, language, bundle ID, and SKU. Match the bundle ID to the release archive.
- [ ] Enter the selected price, territory, Education/Kids settings, and manual release option. Review the lasting Kids-category commitment in the metadata worksheet.
- [ ] Add the prepared description, subtitle, keywords, reviewed current screenshots, public privacy/support URLs, copyright, private review contact, and reviewer instructions. No demo account is needed.
- [ ] Complete App Privacy against the actual final build and operating practices; “Data Not Collected” remains the expected answer, subject to that verification. Validate the privacy manifest and required-reason API declarations in the archive separately.
- [ ] Complete Apple's age-rating, export-compliance/encryption, and content-rights questions accurately for the submitted build. Do not guess a rating or encryption exemption to clear a form.
- [ ] Create and validate the signed App Store archive with a unique build number; confirm the correct team, bundle identifier, app version, icon, and bundled web content. Upload and resolve processing/validation issues.
- [ ] Recommended release validation: install the processed build through TestFlight on physical iPhone/iPad and complete the checks above. TestFlight is the chosen testing route, not a requirement to run a public beta.
- [ ] Select the verified build and submit the completed listing to App Review. Address any review questions or required fixes.
- [ ] After approval, release manually when the owner is ready to launch.

Prepared documents and passing QA do not create a store record, reserve an app name, activate membership, or publish the app.
