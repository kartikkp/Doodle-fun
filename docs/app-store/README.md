# Doodle Fun — App Store kit

The native app groups 34 practice modes into 21 activities for chosen starting ages 2–10. Create, Letters, Numbers, Discover, and Listen include four games with sounds generated offline. Game sound and volume are separate from optional Read aloud; no microphone or voice recording is used. The app also includes an offline privacy policy and a fresh grown-up check before sharing pictures or opening external websites.

## Listing and public pages

- [Release checklist](release-checklist.md): account activation, remaining device checks, listing setup, and upload-to-release steps.
- [Store copy and questionnaire worksheet](metadata.md): name, subtitle, promotional text, keywords, description, privacy answers, age-rating guidance, and reviewer instructions.
- [Native iPhone and iPad screenshots](screenshots/README.md): five scenes per device family, with exact dimensions and source manifests.
- [Current catalog and listening QA](../consolidated-listening-qa.md): tested runtime, source/browser/native evidence and physical-device limits.
- Privacy URL: https://kartikkp.github.io/Doodle-fun/privacy.html
- Support URL: https://kartikkp.github.io/Doodle-fun/support.html

Both public URLs returned HTTP 200 in the September 20, 2026 preflight, but their published content is still the September 8 version for the earlier 30-activity app. The current local pages describe the 21 activity families, 34 modes, game sound and volume. GitHub Pages is configured to deploy the repository root from `main`; merging PR #6 will publish those pages through the normal deployment. Verify the completed deployment and page content against the release build before submission. Reachability alone does not establish that the public policy and support information are current.

The owner has approved preparing **Doodle Fun: Draw & Discover** as a **free** app, without ads or in-app purchases, with **Education** as its category, **Kids ages 6–8** as its primary audience, **United States** availability, and **manual release**. These are the selected release settings; they have not been entered or verified in App Store Connect. Name availability remains unverified. The app still offers all nine starting ages from 2 through 10.

The owner purchased an **individual Apple Developer membership** and is awaiting activation. Use that membership for this release. The exact legal seller identity and copyright holder still need to be verified. Private App Review contact details have been supplied and stored separately from the repository; they have not been entered in App Store Connect.

The selected public support email is **pishahrodi+support@gmail.com**, exactly as supplied by the owner. The support page offers an email link; the offline help and privacy policy show the address as text. Email is voluntary, sends nothing automatically, and is separate from local app data. GitHub issues remains an optional public developer bug tracker. The policy explains both channels.

## Use this kit

1. Automated release QA, unsigned archive inspection and screenshot review are complete. While membership is pending, review the prepared text and questionnaire recommendations in `metadata.md`, and verify the owner's copyright information. Keep the supplied private review-contact details outside the repository.
2. Use the five numbered PNGs in each of `screenshots/iphone` and `screenshots/ipad`; their manifests match the current runtime `0f22199625622369`. Recheck that identity if application code changes before submission. The screenshot README records native capture, independent byte verification and visual review.
3. Merge PR #6, wait for its automatic GitHub Pages deployment, and verify the updated privacy/support pages. Once membership is active, verify the individual account/team, accept required account agreements, and create or confirm the app record. Check name availability and enter the selected listing settings, current public URLs and private review contact.
4. Validate and upload the signed release archive. Complete physical iPhone/iPad checks through TestFlight, reconcile the privacy and age-rating answers with that build, and select the verified build for review.

Creating the App Store Connect record, uploading a signed archive, physical-device TestFlight checks, and submitting to Apple remain the next release steps. Preparing this kit does not submit an app or authorize its public release; use manual release after approval and the owner's launch authorization.
