# Guided Access setup handoff

The Doodle Fun parent PIN protects only app controls. Apple’s Guided Access keeps an iPhone or iPad in a single app and uses its own passcode. Saving an app PIN cannot enable Guided Access or open its Settings page.

Kid-safe setup now opens a three-step guide after the grown-up acknowledges the recovery code. The guide covers Settings → Accessibility → Guided Access, its separate passcode, returning to an activity and starting with the hardware-button shortcut, and safely ending the session. Touch and Software Keyboards must remain available for drawing and app PIN entry. Existing PIN owners can reopen the guide from the home reminder or Grown-ups; saved credentials and artwork are preserved. Cancel, recovery, navigation and background behavior continue to relock adult controls.

Native UIKit provides a passive active-session indicator at page load, foreground return and `guidedAccessStatusDidChangeNotification`. A false `isGuidedAccessEnabled` means no session is active, not that the Settings switch is off. Browser and unavailable states explicitly say the app cannot check. No Guided Access session request, Settings deep link, permission or entitlement was added.

The instructions follow [Apple’s July 24, 2026 guide](https://support.apple.com/en-us/111795). Current devices use a triple-click to start and pause/end; Apple specifies a double-click to pause on iOS/iPadOS 18 or earlier. The guide retains Apple’s emergency-services/Crash Detection caveat.

Validation of runtime `f36d0160815eb47a`: syntax and 247 unit checks, 70 focused Chromium/WebKit parent-control checks, and three packaged native tests passed with no skips. Native coverage checks initial UIKit status, foreground invalidation/refresh and status notification, existing audio inactivity behavior, and PIN persistence/relocking. Browser coverage checks post-recovery handoff, existing-PIN enable/reentry, cancellation, interruption, recovery, and compact/landscape/tablet layout with larger text.

The initial focused browser run passed 69/70. Its Back test navigated before the drawing route committed; the fixture now awaits the actual drawing activity before invoking Back and retains every PIN assertion. Adding one native test required updating the tested inventory from 321 to 322; the original count failures are retained separately. These focused results do not claim a new complete native/gameplay or trusted-audio matrix. Physical Guided Access, actual button shortcuts, VoiceOver and speaker/Pencil acceptance remain separate device checks.
