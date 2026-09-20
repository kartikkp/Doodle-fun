# Doodle Fun — App Store submission draft

Prepared September 8, 2026; product copy updated September 13, 2026 for the consolidated catalog and listening games. Release choices updated September 20, 2026 after the owner authorized preparation and purchased an individual Apple Developer membership. **Membership activation pending; not submitted.** This document records the selected release settings and prepares questionnaire answers. It does not establish that an App Store Connect record, signing entitlement, legal seller identity, or submitted build has been verified. Reconcile the final answers with the release archive and the owner's actual practices before submission.

## Listing settings

| Field | Prepared value | Status |
| --- | --- | --- |
| Enrollment | Individual | Purchased by the owner; activation pending |
| Primary language | English (U.S.) | Selected for preparation; not entered in App Store Connect |
| App name | Doodle Fun: Draw & Discover | Selected; 27 characters; availability in the owner's account unverified |
| Subtitle | Create, explore & listen | 24 characters |
| Primary category | Education | Selected; not entered in App Store Connect |
| Secondary category | None | Prepared; no second category needed |
| Made for Kids | Yes; primary audience ages 6–8 | Selected for preparation; account selection and review remain pending; see the lasting category commitment below |
| Content age rating | Expected 4+, subject to Apple's questionnaire result | Not assigned or verified |
| Price | Free | Selected; not entered in App Store Connect |
| In-App Purchases / subscriptions | None | Selected; current app has no purchase implementation |
| Advertising | None | Selected; current app has no advertising implementation |
| Availability | United States only | Selected; no territories have been configured by this document |
| Release option | Manual release after approval | Selected; public release still requires the owner's launch authorization |
| Platforms | iPhone and iPad; iOS/iPadOS 17 or later | Match the final archive's deployment target |
| Privacy Policy URL | https://kartikkp.github.io/Doodle-fun/privacy.html | HTTP 200 on September 20, 2026; published September 8 content is stale. Publish the current policy after PR #6 is merged and verify it against the release bundle before submission. |
| Support URL | https://kartikkp.github.io/Doodle-fun/support.html | HTTP 200 on September 20, 2026; published September 8 content still describes the earlier catalog. Publish the current page with the owner's supplied support email after PR #6 is merged. |
| Public support email | pishahrodi+support@gmail.com | Supplied by the owner; prepared on the support page and in offline help/policy; not yet published |
| Marketing URL | https://kartikkp.github.io/Doodle-fun/ | Existing project website; verify before entering |
| Privacy Choices URL | Leave blank | Optional; deletion and backup choices are in the privacy policy |
| Sign-in required | No | No demo account is needed |
| Custom EULA | None proposed | Use Apple's standard EULA unless the owner supplies another |

Apple limits the name and subtitle to 30 characters. The privacy URL is required, and an uploaded build's bundle ID must match the app record. [Apple: app information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information)

## Copy to paste

The copy below uses the selected Made for Kids positioning. Account selection and Kids-category review remain pending. If that decision changes before submission, review all child-directed metadata against Apple's restrictions before using it. [Apple: App Review Guidelines, 2.3.8 and 5.1.4](https://developer.apple.com/app-store/review/guidelines/)

### Promotional text

147 characters; limit 170.

```text
Draw, explore, and listen. Find related activities together, with four sound games, adjustable practice, helpful coaching, and optional read-aloud.
```

### Keywords

95 UTF-8 bytes; limit 100 bytes. Do not add spaces after commas.

```text
coloring,tracing,letters,numbers,shapes,counting,puzzles,spelling,patterns,music,rhythm,offline
```

### Description

Plain text, below the 4,000-character limit. The promotional-text, keyword, description, and review-note limits follow Apple's current platform reference. [Apple: platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)

```text
A blank page. A new pattern. A little “I did it.”

Doodle Fun brings 21 activities with 34 practice modes together in one colorful playground for iPhone and iPad. Related activities share one place: draw freely or choose a coloring page in Doodle studio, and find lines, letters, words, and numerals in Trail studio. Count a group, follow a winding path, or listen and play back a tune. Choose a starting age from 2–10 and explore at your own pace.

CREATE SOMETHING YOURS
Draw with colorful brushes, add playful stamps, or make one of nine coloring pictures your own. Try an idea prompt when you need a spark. Undo and Redo make room for another try, and a grown-up can help save or share a finished picture as a PNG.

FOLLOW LETTERS AND NUMBERS
Trace lines, shapes, uppercase and lowercase letters, familiar words, and numerals. Match letter pairs and build words. Explore counting, addition, subtraction, equal groups, missing numbers, and fair shares with visual activities.

NOTICE, PLAN, AND PLAY
Match shapes and colors, finish patterns, sort objects, find memory pairs, and guide Bunny through a maze. Arrange sizes, numbers, and story steps; follow arrows and build shape outlines.

LISTEN AND MAKE MUSIC
Find sound partners, follow notes higher or lower, play back a melody, and copy drum taps. Replay whenever you want and use picture hints for support. Beat studio begins with tap counting for the youngest starting ages, then adds short and long spaces at your own pace. The sounds are generated on the device without a microphone or downloaded recordings. Game sound and volume are separate from Read aloud.

FIND THE RIGHT STARTING POINT
The chosen age sets a starting difficulty; it never locks away activities. Open Coach for a first step, a strategy, or something to talk about together. Make each game's practice step easier or harder when it helps. Younger children can explore alongside a grown-up, especially with words and number puzzles.

SMALL DETAILS FOR EVERYDAY PLAY
• All 21 activities, their modes, and generated game sounds work offline in the iPhone and iPad app.
• Optional read-aloud uses the device's system voices.
• Settings, practice progress, and the current picture draft stay on the device.
• No account, ads, subscriptions, or in-app purchases.
• A grown-up check comes before sharing pictures or opening external websites.

Save favorite pictures outside the app to keep them. Doodle Fun keeps one current draft and does not provide a cloud account or sync between devices; device backup settings may apply. Practice progress records activities completed, not a learning assessment.

Pick something that catches your eye. Make it your own.
```

### What's new

For a first App Store version, this field is not available. If an existing listing is being updated, write a version-specific change note after confirming its last published version; do not paste the full description or claim a first release without checking. [Apple: platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)

## App privacy questionnaire recommendations

**Expected label: Data Not Collected. Owner confirmation required.** The native app packages the activities and policy locally. It has no app account, developer backend, advertising SDK, analytics SDK, or cloud-sync integration. Local preferences, including game-sound and volume choices, chosen difficulty age, progress, and the current PNG draft are not sent to the developer. Game sounds are generated locally without microphone input or audio downloads. Speech uses system voices; PNG export uses the user's chosen system-sharing destination.

Apple's collection test concerns off-device transmission accessible to the developer or integrated partners beyond servicing a real-time request. Its guidance distinguishes local handling and data collected by Apple itself. These recommendations concern this native build, not all processing by a separately opened website. [Apple: App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)

| Question or data group | Recommended answer / disposition |
| --- | --- |
| Do you or your third-party partners collect data from this app? | **No**, after the owner confirms no additional SDK, diagnostics upload, or collection service in the submitted build or operating practices. |
| Data used to track users | None. No cross-app advertising linkage, data broker, IDFA use, or tracking SDK. |
| Contact information, identity, location, contacts, browsing/search history, financial, health, sensitive data | Not collected by the native app. No corresponding input or collection workflow. |
| Photos/videos, audio, other user content, gameplay content | Current artwork, listening progress, and sound preferences are local. Game sound is generated on the device; no microphone recording or audio upload. Explicit PNG sharing goes to the destination the grown-up chooses; the developer does not receive it through an app service. |
| Identifiers, usage data, diagnostics | No app-originated upload to the developer or integrated analytics/crash service. Owner must separately confirm any data actually collected from Apple services. |
| Linked-to-user purposes | Not applicable if the collection answer remains No. |
| ATT permission | Not used; there is no tracking behavior to authorize. |

Support opens a website in the external browser after a grown-up check. The website's email link opens the grown-up's email app; nothing is sent automatically. The developer receives the sender address, message, and any attachments the grown-up chooses to send. There is no in-app support form or automatic attachment of artwork, progress, or identifiers. A person who chooses the optional public GitHub bug tracker also provides their message and profile information to GitHub and its readers. The policy explains these voluntary support channels separately from local app use. Confirm the final privacy answers against the actual support practices; do not automatically claim Apple's optional-support disclosure exemption, which has multiple conditions. Reassess the answers if an in-app contact form, diagnostic attachment, analytics service, or other collection is added. [Apple: optional disclosure and web-view guidance](https://developer.apple.com/app-store/app-privacy-details/)

The native privacy manifest and App Store privacy questionnaire are separate deliverables. Confirm the final archive's manifest and required-reason API declarations through the release checks; this draft does not certify them.

## Age rating and Kids category

**Selected positioning: Made for Kids, ages 6–8. Expected content rating: 4+, not assigned.** The app's strongest shared center is letter/word practice, counting and arithmetic with objects, patterns, and guided reasoning. Ages 2–5 have simpler creative activities and grown-up-supported practice; ages 9–10 have harder variations. The configurable 2–10 range does not mean every activity is intended for independent use at every age.

Apple offers Kids bands of 5 and under, 6–8, and 9–11. The selected 6–8 band reflects the current breadth of content; it has not yet been configured in App Store Connect. [Apple: Kids category](https://developer.apple.com/kids/)

**Lasting category commitment:** after a Made for Kids app is approved, the selection cannot be changed, and later updates must continue to meet Kids-category requirements. The selected launch positioning includes this requirement. [Apple: Made for Kids property](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information)

Use the following as a source-based worksheet, not a preassigned rating. Apple calculates the rating from the actual questionnaire. The app's difficulty picker and the content rating serve different purposes. [Apple: age ratings and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions)

| Questionnaire area | Recommended response | Current implementation rationale |
| --- | --- | --- |
| Parental controls | Yes — limited to parental gates | Saving/sharing and external links require a fresh grown-up task. Do not advertise a full Screen Time or remote parental-management feature. |
| Age assurance | No | A difficulty age is not verified age. The arithmetic gate does not verify identity or legal age. |
| Unrestricted web access | No | No in-app browser; approved external links open the system browser after a gate. |
| User-generated content | No | No broad distribution or discovery of users' content inside the app. Local drawing and optional system export do not create an in-app community. |
| Social media / under-13 social-media variant | No / not applicable | No feed, followers, comments, or social-discovery features. |
| Messaging and chat | No | No communication between users within the app. |
| Advertising | No | No ads. |
| Profanity, crude humor, horror, mature/suggestive themes | None | No such authored activity content. |
| Sexual content or nudity | None | No such authored content. |
| Cartoon/fantasy violence, realistic violence, graphic violence, guns/weapons | None | No such authored content. |
| Alcohol, tobacco, drug references | None | No such authored content. |
| Medical/treatment or health/wellness information | No / none | Practice activities do not diagnose, treat, or provide health advice. |
| Gambling, simulated gambling, loot boxes | No / none | No wagering, purchases, or randomized paid rewards. |
| Contests | None | No competition between users or prizes. Local practice achievements record individual completed activities. |

Verify the generated result for both current and earlier supported OS versions. Do not raise or lower answers merely to obtain a desired number. The 4+ recommendation is a content-rating expectation, not a claim of demonstrated developmental benefit.

## Review notes to paste

The intended notes below describe the prepared release behavior. Confirm the gate, links, sharing, and offline policy on the exact archive selected for review before using them. Notes fit within Apple's 4,000-byte limit.

```text
Doodle Fun is an offline creative/practice app for iPhone and iPad. No account, login, subscription, purchase, or server connection is required. All 21 activities and 34 modes are available immediately in Create, Letters, Numbers, Discover, and Listen. Existing activities are grouped as modes rather than removed.

STARTING SETTINGS
On the home screen, choose an age from 2 through 10. This changes starting difficulty, not access permissions or verified age. Grown-ups opens preferences. Coach inside an activity offers instructions, hints, and easier/harder practice steps. Younger children are intended to explore together with a grown-up.

PARENTAL GATE: SHARING
Open Doodle studio, choose Free draw or Coloring pages, make a mark, and tap Save. The “Ask a grown-up” check displays two randomly chosen integers from 12 through 19 to multiply. Enter their product in the numeric answer field and tap Continue. For example, if the displayed question is 12 × 13, enter 156. There is no fixed answer or demo credential. A correct answer opens the native system share sheet; Cancel or an incorrect answer does not share. Cancelling the share sheet preserves the artwork. Every new share requires a new gate. Sending the app to the background cancels a pending gate.

PRIVACY AND SUPPORT
The home footer's Privacy button and Grown-ups > Privacy policy open the same policy, included in the app and readable offline without a gate. Grown-ups > Help & support opens help. Visit support website, and external links in the policy, require the same grown-up check before opening the system browser. Native external destinations are restricted to the project's public privacy/support pages, GitHub issues, and GitHub's privacy statement. The support website offers email contact for grown-ups; sending a message is voluntary and attaches no app data automatically. The email address is also readable as plain text in offline help and the policy. GitHub is an optional public bug tracker. Both channels ask grown-ups to avoid children's identifying information.

LISTENING GAMES
Choose Listen, then a game. Game sound and Game volume are separate from Read aloud. Tap Listen for a clue. Sound detective provides separate Hear and Choose buttons; Melody echo has tone pads. Generated tones and percussion work offline with no microphone, recordings, or audio downloads. Check media volume, Silent mode, and connected audio devices if needed. Opening Coach or leaving the activity pauses the turn; return and tap Listen again. Picture practice inside Melody echo preserves the earlier visual sequence game.

DATA AND SPEECH
The native app does not collect personal data or use ads, analytics, tracking SDKs, or a developer backend. Settings, including game sound and volume, the chosen difficulty age, practice progress, and the current drawing draft are stored locally. The app has no account-based sync; operating-system backup settings may include local app data. PNG sharing is user-directed. Optional read-aloud uses Apple's system speech voices and does not use the microphone.

The app is designed for touch in portrait and landscape on iPhone and iPad. Saving a PNG can use Photos, Files, or another destination available in the system share sheet. The app does not import photos or use the camera.
```

## Owner and account handoff

These are submission prerequisites, not values to guess. No account or external submission was changed by preparing this document.

| Field / action | Required owner input or verification |
| --- | --- |
| Apple Developer membership / account holder | Individual membership purchased; wait for activation, then verify the correct account/team and required agreements. Existing project signing settings do not establish active membership or ownership. |
| Legal seller / developer name | Verify the exact legal name shown by the individual membership in App Store Connect. No name is inferred from local paths, repository ownership, or this worksheet. |
| Copyright | Supply the correct year and rights-holder name; do not use a placeholder in the submitted record. |
| Public support contact | The owner supplied pishahrodi+support@gmail.com. Publish the prepared support page and verify the email link/address before submission. GitHub issues remains an optional public developer bug tracker. |
| App Review contact | Supplied and stored separately from the repository. Enter the private first/last name, email, and telephone in App Store Connect and verify them there; do not add private values to public documentation. |
| App record / Apple ID / SKU | Confirm or create in the correct account. These values are not known or reserved by this draft. |
| Bundle ID and signing | Verify the release archive matches the registered app identifier and distribution team. |
| Version/build and selected archive | Confirm the final marketing version, unique build number, uploaded archive, and processing status. |
| App name availability | Check the prepared 27-character name in the owner's App Store Connect account. |
| Kids category and age band | Enter the selected Made for Kids, ages 6–8 positioning; verify the final parental gates and Kids-category requirements before submission. |
| Privacy and content rights | Confirm the questionnaire against the final build and actual collection practices; confirm rights to all app content and store assets. |
| Price and territory | Enter the selected free price, no IAP, and U.S.-only availability. Broader distribution requires a separate owner review of regional account/compliance fields. |
| Live policy/support pages | Both URLs were reachable with HTTP 200 on September 20, 2026, but still serve September 8 content for the earlier 30-activity app. After PR #6 is merged, publish the current 21-family/34-mode pages, including game-sound and volume information, then verify their content and links over HTTPS. The same policy body must be present offline in the submitted app. |
| Screenshots / preview | Supply actual screenshots of the submitted app for required device sizes. Do not use a mock screen or claim untested accessibility support. An app preview is optional. |
| Release authorization | Confirm final content and account fields, then submit for review; release manually only when the owner authorizes it. |

The public support page offers the owner's supplied email address. Apple's support-URL reference describes actual contact information, qualified by applicable local requirements. The separate private App Review contact has been supplied and still needs to be entered and verified in the publishing account. [Apple: support URL and review information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)

The prepared public pages use local system fonts and no scripts, tracking, or remote assets. `privacy.html` is the policy source of truth: the build embeds the contents of its single `privacy-policy-content` article into the offline app. Keep that article and the published page synchronized through the normal build and native-sync process.
