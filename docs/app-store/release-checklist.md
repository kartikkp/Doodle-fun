# Doodle Fun — release checklist

September 20, 2026. Individual Apple Developer membership purchased; account activation still needs verification. No App Store Connect record, signed upload, or submission is confirmed by this checklist. The physical-phone audio report remains open: hotfix runtime **`1668feee4dc43ee0`** is installed as a signed Debug update, but audible playback is not yet confirmed. Use the [audio follow-up](../iphone-audio-fix.md), [metadata worksheet](metadata.md), and [current QA report](../consolidated-listening-qa.md) for version-specific evidence and remaining checks.

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
| Public support email | pishahrodi+support@gmail.com — supplied; post-merge publication to verify |

These choices are prepared locally and have not been entered or verified in App Store Connect. Kids ages 6–8 is the store audience; the app's adjustable practice ages remain 2–10.

## Finish while membership is pending

- [x] Prepare the listing description, subtitle, keywords, reviewer instructions, support contact, and privacy copy. The prepared text fits the store field limits; final account answers still need verification.
- [ ] Build and inspect an unsigned Release archive for hotfix runtime `1668feee4dc43ee0`. The audited 2.1.0 (1) archive belongs to prior runtime `0f22199625622369`; the signed physical Debug build does not replace a Release audit. Distribution signing and Apple's upload validation remain separate steps below.
- [x] Complete the hotfix's nine bridge and four trusted sound UI checks: **13/13 passed**, no failures/skips. Node **88/88** and targeted browser **96/96** also passed. The native result records audio-session activation warnings. Prior full CI totals of 80 Node, 640 browser, 283 native, four sound cases and six focused iPhone checks remain historical `0f` evidence, not a full retest of this change.
- [x] Prepare and visually review all ten store screenshots for the 21-family, 34-mode app. Their capture source is `0f22199625622369`; the hotfix leaves visible UI unchanged. Preserve the [screenshot manifests and status](screenshots/README.md) as the original provenance when checking listing accuracy against the submitted build.
- [ ] Finalize the audio hotfix and its release evidence in [PR #7](https://github.com/kartikkp/Doodle-fun/pull/7) on `codex/iphone-audio-output`, preserving the owner's signing configuration. Source `fa41ab9` and metadata `24c6a8d` were excluded from merged PR #6. Physical listening confirmation remains pending.
- [ ] Verify merged PR #6's GitHub Pages deployment and current privacy/support pages, support email, and links. The pre-merge September 20 check returned HTTP 200 with September 8 content; post-merge publication has not been checked. Current pages must describe the consolidated catalog, sound/volume behavior, and voluntary email support; the public policy must match the offline release policy. Recheck after audio PR #7 merges.
- [x] Receive the public support email and private App Review contact. Private contact details are stored separately from the repository and still need to be entered in App Store Connect.
- [ ] Verify the correct copyright year/rights holder and the individual membership's legal seller name. Do not infer them from file paths or repository ownership.

## Physical iPhone and iPad release checks

Record device, OS version, app version/build, result, and any defect. Use the intended release build; repeat affected checks after fixes.

- [ ] Open every activity family and its modes; check readable instructions, Coach, easier/harder controls, age selection, portrait/landscape layout, and a recoverable wrong answer or retry where applicable.
- [ ] Confirm audible Sound detective, Higher or lower, Melody echo, and Beat studio on the installed hotfix. The owner reported silence with Silent mode off; the original cause is unproven and no physical listening reply or activation log has arrived. Check speakers and headphones, media volume and Silent mode, independent Game sound/Read aloud settings, replay, and background/return recovery with a fresh Listen before scoring.
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
