# App Store preparation — delivered implementation

## Result

Prepared the three owner-authorized release items in PR #5: public GitHub Pages privacy/support documents, the same full policy embedded offline in the app, fresh native/browser parental gates, and an App Store kit with metadata, review notes, questionnaire guidance and ten actual native screenshots. No App Store account fields, signed archive upload, review submission or native release were performed.

The public URLs use the existing Pages site at `https://kartikkp.github.io/Doodle-fun/privacy.html` and `/support.html`. Publication is part of delivery after verification. The production policy body comes from the same source as the embedded policy.

## Behavior and corrections

- Each picture export and approved external URL needs its own challenge. Wrong answers, cancellation, navigation and backgrounding do not grant approval. One pending action cannot be replaced and old approval cannot be reused.
- Parent checks occur in native UIKit for the iOS wrapper and in a browser dialog for web use. Correct web approval preserves the user gesture needed by Safari sharing.
- Embedded policy links became buttons after independent review exposed alternate-click bypass. Both public pages now affect the delivery cache fingerprint.
- Native capture exposed header clipping under large notches; the header now accommodates safe-area padding.
- Compact-iPhone touch QA exposed modal scrolling moving the underlying activity page. Root scrolling now stays locked until all dialogs close, with overscroll contained. Native regression deliberately swipes past the settings bottom and requires home controls to remain visible afterward.

## Evidence

Final app fingerprint `05facec229a9211d`, HTML SHA-256 `f37041e2d7d6925ca75c8e5246d3031db5f22712091c977361164603f8565ee9`. Root, dist and native bundled HTML match.

- 70 Node tests and JavaScript syntax checks passed.
- Final targeted privacy/parent-gate browser checks passed 18/18 in Chromium/WebKit, followed by a complete **534/534** passing browser run in 7.8 minutes. Independent CI accompanies PR #5; evidence is described in `docs/app-store/qa.md`.
- iPhone 17 Pro/iOS 26.5 and iPhone SE 3/iOS 18.6 each passed 15/15 final native bridge, parent-gate and trusted UI cases.
- Five actual native screenshots per family, with source/dimension/hash manifests, are in `docs/app-store/screenshots`. The capture script runs only on dedicated screenshot simulators using a copied project.
- Independent reviews found no remaining blocking issue in the reviewed controls, public content or modal-scroll fix.

## Preserved state and next work

The owner's Xcode project/signing file remains byte-for-byte unchanged, SHA-256 `bd176defe8efbb0185dc1f6a46249abc36317269bc03e885c9daffd54b56a445`, and is excluded from commits. The personal simulator and its artwork were not touched.

The kit recommends free, Education, Kids 6–8, U.S. availability and manual release; those are drafts, not App Store Connect settings. GitHub issues is the selected public support channel. Owner review contact, seller/copyright details, final account settings, a signed TestFlight upload, physical-device validation and submission remain separate release steps. Existing full age/activity QA is retained in `docs/iphone-qa-report.md`; no simulator result is represented as observed child enjoyment.
