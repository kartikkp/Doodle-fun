# Publication correction

Live-site check after PR #2 merge: 288 activity launches passed in Chromium/WebKit across 3 age presets and 2 phone/tablet viewports. All source assets matched tested files; missing offline worker returned 404 in all contexts. No game runtime exception or horizontal overflow.

Correction: source HTML moved to app-shell.html; build now writes identical standalone HTML/worker to dist and committed root files for the existing branch-based Pages setup. Runtime fingerprint and bytes unchanged. CI builds and checks git diff for stale publication files. Generated outputs marked for GitHub review.

Validation: 40 unit tests and 2 new Pages-path browser tests passed. Each test serves only /Doodle-fun/index-equivalent and sw.js, verifies scope/no external modules/styles, shuts down server, reloads and launches all24 activities. Publishing this correction requires a follow-up merge; live offline behavior is not yet claimed fixed.
