# Doodle Fun

A friendly creative learning space for ages 2–10, designed for fingers, an Apple Pencil, and a mouse. It remains a lightweight static web app with no runtime dependencies, accounts, advertising, or backend.

## 24 activities

Browse Create, Letters, Numbers, and Discover. Each card opens its specific task:

- **Create (2):** Doodle studio and Color & create, retaining all nine coloring pages, 20 stamps, undo/redo, local drafts, and PNG export.
- **Letters (6):** Line & shape trails, Big letter trails, Little letter trails, Word trails, Letter buddies, and Build a word.
- **Numbers (9):** Number trails, Count with me, Add together, Equal groups, More/less/same, Number stepping stones, Take away, Missing number, and Fill the frame.
- **Discover (7):** Shape detective, Color buddies, Pattern parade, Sort it out, Spot the difference, Memory garden, and Little pathfinder.

The original uppercase/lowercase alphabets, digits, and coloring pages remain inside these activities. Individual glyphs are practice items, not inflated game counts. See the [activity catalog](docs/activity-catalog.md) for every learning objective and support level.

Age selects suggested support. Grown-up settings can adjust it independently; every activity stays available. Young children can explore word and arithmetic tasks with a grown-up. See [age guidance](docs/age-guidance.md) for rationale and primary sources.

## Run

Use Node.js 20 or newer:

```sh
npm install
npm start
```

Open `http://127.0.0.1:4173`. `PORT` can override the port. `npm start` first builds a self-contained app into `dist/` and then serves it.

For a standalone copy, run `npm run build` and open **dist/index.html** in a browser. All game code, styles, and icons are embedded: opening an activity does not fetch another module and does not need a server. To host the app, publish **dist/index.html** and **dist/sw.js** together. The service worker caches the complete app for offline reloads after its first successful installation over HTTPS or localhost. It does not claim to install before the initial page has loaded. Browser storage eviction can remove this cache; the downloadable HTML remains independent.

The prior preview failed because a cached home page tried to import game modules from a stopped local server. Bundling removes that dependency from every activity entry point. Offline entry, offline reload, and the downloadable HTML each have dedicated regression checks.

## Verification

```sh
npm run check
npm test
npx playwright install chromium webkit
npm run test:browser
```

The suite covers actual browser interactions, each activity and age group at phone/tablet sizes, every coloring page, tracing data, count logic, storage failure, drawing recovery, and PNG export. Browser emulation cannot substitute for physical Apple Pencil pressure/palm behavior, Safari share sheets, safe-area insets, and VoiceOver. See [QA report](docs/qa-report.md).

## Local data

Settings, the current drawing, and practice stars are saved only in this browser under the `doodle-fun:v2:` prefix. They are not synced across devices. Blocked/full storage falls back to the current session; PNG export is the way to keep important artwork. The offline cache stores the app itself; personal drawings and practice progress stay in local storage.

The previous app did not persist artwork or progress, so there is no legacy saved-data migration. The nine original template drawings and letter paths were retained and revised where necessary.
