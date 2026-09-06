# Current state

PR #2 merged as 2463a45. Checked live https://kartikkp.github.io/Doodle-fun/ on September 6, 2026.

- 288 live launch checks passed:24 activities×3 ages×2 sizes×2 engines.
- Published source scripts/styles match tested source, but Pages main/root omitted the ignored dist build and returned 404 for sw.js.
- Publication correction prepared on codex/pages-built-app. Source HTML is app-shell.html; root index.html/sw.js are committed generated copies identical to dist. Existing Pages settings retained.
- Runtime remains byte-identical to fingerprint 387b68987e207d18.
- 40 unit checks and 2 new Pages-path/browser/server-stop regressions passed locally. Existing 40 unit/122 browser suite validated this unchanged runtime previously.
- Follow-up PR review/merge is the next publishing step. After merge, verify live fingerprint and worker response and offline reload. Do not claim offline production is fixed before that verification.

The Mac was locked during this check; fresh isolated test browsers verified the public site. No desktop state or Pages settings changed. Physical-device and observed-child playtesting limits remain in docs/qa-report.md.
