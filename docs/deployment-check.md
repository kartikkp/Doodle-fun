# Merged-site deployment check — September 6, 2026

Public URL: https://kartikkp.github.io/Doodle-fun/

Checked after PR #2 merged as `2463a45b634ee804cff1cd6c29aaa3c73cfed0dc` and GitHub Pages reported successful deployment.

## Live result

- All 24 cards opened and returned home in **288 checks**: 24 activities × 3 age presets (3/6/9) × 2 viewports (390×844 and 820×1180) × Chromium/WebKit.
- No application runtime exceptions or horizontal document overflow.
- The HTML, nine JavaScript files, and five stylesheets returned HTTP 200 with appropriate content types and matched the previously tested source byte for byte.
- Each browser reported an offline-worker registration error: `/Doodle-fun/sw.js` returned 404.
- This was a launch/deployment smoke test. The earlier 40 unit / 122 browser suite provides the detailed gameplay validation described in qa-report.md.

The user's desktop was locked, so testing used fresh isolated browser contexts against the public URL rather than the user's open browser tab. No device state, sign-in, or Pages settings were changed.

## Cause

GitHub Pages is configured to publish the main branch root. That root held the development HTML and modules. The standalone `dist/index.html` and its `sw.js` are generated locally and ignored by git, so merging the source did not publish the tested offline package.

Online activities work because their modules load initially. The missing worker prevents the intended offline reload cache from installing. Copying only the worker would be insufficient because it would cache source HTML without its external scripts and styles.

## Publishing correction

Keep the existing Pages configuration and URL. Move editable HTML to `app-shell.html`; the build generates identical self-contained `index.html` and `sw.js` in both `dist/` and the repository root. Commit the root copies for branch-based publication. CI rebuilds them and fails if the checked-in copies are stale.

The game runtime remains unchanged. The intended standalone fingerprint remains `387b68987e207d18`. A dedicated browser regression serves only the committed root pair beneath `/Doodle-fun/`, checks worker scope and absence of external modules/styles, stops the server, reloads, and opens all 24 cards in both engines.

This publishing correction requires a follow-up merge before it can be described as verified live. After deployment, recheck the public build fingerprint and worker response, then offline reload.
