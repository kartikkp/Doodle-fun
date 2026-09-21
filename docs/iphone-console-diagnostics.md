# iPhone console diagnostics

September 20, 2026. The owner reported PointerUI, settings, SQLite, sandbox-extension and WebContent messages while the app was running. The excerpt contains no app navigation error code, audio-session activation failure or crash report. It does not establish a cause for the earlier silent audio.

## Findings

- The public-settings read and SQLite `auto_vacuum` query describe internal work; neither line itself reports a failed game operation. The PointerUI and foreground-user messages refer to system services; their impact is not established by this excerpt.
- WebKit's `Unable to hide query parameters from script (missing data)` originates in its advanced privacy-protection code. When its parameter list is missing, that function logs and returns the original URL. This is not a Doodle game exception. See [WebKit's implementation](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/WebProcess/WebPage/Cocoa/WebPageCocoa.mm).
- Sandbox-extension errors report failed permission grants. They require correlation with actual navigation or resource failures, rather than blanket dismissal. The redacted `<private>` paths cannot be identified from the supplied text. See [WebKit's sandbox implementation](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/Shared/Cocoa/SandboxExtensionCocoa.mm).
- The app loads the current bundle's exact `index.html` using `loadFileURL`, with read access restricted to that file. Scripts, styles and icon are inline. Game sounds are synthesized; there are no separate sound files to load. No hardcoded installation path or missing game-file dependency was found. File access and navigation restrictions remain unchanged.

The earlier physical console also recorded a bundle sandbox-extension warning. That log proves process launch, not successful page loading or audible playback. The prior 13 native simulator checks are historical evidence, not a fresh device check of these messages.

## Focused app diagnostics

Debug builds now emit `DOODLE_WEB` for requested, started and finished navigation; content-rule or navigation failures include only NSError domain/code. Renderer termination is also recorded. `navigation-finished` describes WebKit navigation completion, not successful JavaScript or audio. A provisional error code of `NSURLErrorCancelled` retains the existing cancellation behavior and does not show retry UI.

Use these messages alongside `DOODLE_GAME_AUDIO` during the next Xcode run. No URLs, descriptions, error userInfo, artwork or progress are logged. Apple system logs are not suppressed. The diagnostic build has not been installed automatically; physical audio remains unconfirmed.

Validation: signed Debug build and signature verification passed for `com.minoli.DoodleFun`; unsigned Release build passed. Binary inspection found `DOODLE_WEB` in the Debug library and absent from the Release app. Independent review found no behavior/privacy issue. No gameplay matrix was rerun for this diagnostic-only change, and this Release build is not a distribution archive. Evidence is retained in workspace `work/webkit-log-triage-2026-09-20`; the completed task build cache was removed after retaining the signed Debug app.
