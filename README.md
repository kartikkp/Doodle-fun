# Doodle Fun

A friendly creative learning space for ages 2–10, designed for fingers, an Apple Pencil, and a mouse. It remains a lightweight static web app with no runtime dependencies, accounts, advertising, or backend.

## Activities

- **Doodle studio:** pressure-aware pen, eraser, fill, 20 stamps, named colors and brush sizes, age-fit creative prompts, undo/redo, local draft, and PNG export with iOS share/save fallback.
- **Color & create:** all nine original coloring pages, with confirmation before replacing artwork and recoverable page changes.
- **Letter adventures:** prewriting paths, all 26 uppercase and lowercase letters, digits 0–9, and short word practice. Numbered starts, a stroke demonstration, and feedback based on actual path coverage.
- **Number explorers:** visible quantities, tap-to-count support, zero, addition, and equal-group challenges. Correct answers stay visible and mistakes can be retried without penalties.

Age selects a starting point rather than judging ability. Grown-up settings can independently adjust support. All tracing sets stay available, including numbers and lowercase for young children. See [age guidance](docs/age-guidance.md) for design rationale and primary sources.

## Run

Use Node.js 20 or newer:

```sh
npm install
npm start
```

Open `http://127.0.0.1:4173`. `PORT` can override the port. No build step is required. For static hosting (including GitHub Pages), publish `index.html`, `app.js`, `core.js`, `draw.js`, `templates.js`, `learning.js`, `learning-data.js`, the three CSS files, and `icon.svg` in the same directory. Serve over HTTP(S); ES modules do not run reliably from a `file:` URL.

## Verification

```sh
npm run check
npm test
npx playwright install chromium webkit
npm run test:browser
```

The suite covers actual browser interactions, each activity and age group at phone/tablet sizes, every coloring page, tracing data, count logic, storage failure, drawing recovery, and PNG export. Browser emulation cannot substitute for physical Apple Pencil pressure/palm behavior, Safari share sheets, safe-area insets, and VoiceOver. See [QA report](docs/qa-report.md).

## Local data

Settings, the current drawing, and practice stars are saved only in this browser under the `doodle-fun:v2:` prefix. They are not synced across devices. Blocked/full storage falls back to the current session; PNG export is the way to keep important artwork. There is no service worker or offline-install claim.

The previous app did not persist artwork or progress, so there is no legacy saved-data migration. The nine original template drawings and letter paths were retained and revised where necessary.
