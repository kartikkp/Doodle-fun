# Doodle Fun

A friendly creative learning space for ages 2–10, designed for fingers, an Apple Pencil, and a mouse. It remains a lightweight static web app with no runtime dependencies, accounts, advertising, or backend.

## 30 activities

Browse Create, Letters, Numbers, and Discover. Each card opens its specific task:

- **Create (2):** Doodle studio and Color & create, retaining all nine coloring pages, 20 stamps, undo/redo, local drafts, and PNG export.
- **Letters (6):** Line & shape trails, Big letter trails, Little letter trails, Word trails, Letter buddies, and Build a word.
- **Numbers (10):** Number trails, Count with me, Add together, Equal groups, More/less/same, Number stepping stones, Take away, Missing number, Fill the frame, and Fair shares.
- **Discover (12):** Shape detective, Color buddies, Pattern parade, Sort it out, Spot the difference, Memory garden, Little pathfinder, Growing garden, Story steps, Follow the arrows, Shape builder, and Tap the pattern.

The original uppercase/lowercase alphabets, digits, and coloring pages remain inside these activities. Individual glyphs are practice items, not inflated game counts. See the [activity catalog](docs/activity-catalog.md) for every learning objective and support level.

Each age from 2 through 10 has its own starting configuration. The **Coach** offers a starting step, current-game hints, strategy, conversation and real-object activities. **A little easier / harder** remembers a separate adjustment for each game. Optional read-aloud preserves work. Changing the challenge may begin a fresh round; drawing edits remain recoverable. Young children can explore words and arithmetic with a grown-up. See the [game-by-game age review](docs/coached-play-review.md) for actual defaults, playthrough findings and limits.

## iPhone and iPad app

Open **ios/DoodleFun.xcodeproj** in Xcode and run the **DoodleFun** scheme. The iOS 17+ app includes all activities offline, native spoken coaching, local progress and the system PNG share sheet. Run `npm run ios:sync` after web changes. A personal device requires your Xcode signing team; no App Store submission is included. See [iPhone build and installation](docs/iphone-app.md).

## Run

Use Node.js 20 or newer:

```sh
npm install
npm start
```

Open `http://127.0.0.1:4173`. `PORT` can override the port. `npm start` first builds a self-contained app into `dist/` and then serves it. The build also writes identical generated `index.html` and `sw.js` files at the repository root.

For a standalone copy, run `npm run build` and open **dist/index.html** in a browser. All game code, styles, and icons are embedded: opening an activity does not fetch another module and does not need a server. To host the app, publish **dist/index.html** and **dist/sw.js** together. The service worker caches the complete app for offline reloads after its first successful installation over HTTPS or localhost. It does not claim to install before the initial page has loaded. Browser storage eviction can remove this cache; the downloadable HTML remains independent.

## Build and deploy

Edit **app-shell.html**, the JavaScript modules, or the CSS source files, then run `npm run build`. The root **index.html** and **sw.js** are generated release files; run `npm run ios:sync` and commit both root release files plus the native Resources bundle whenever source changes. Do not edit the generated files directly. CI rebuilds the app and rejects stale committed release files.

The existing GitHub Pages configuration publishes the repository root from the `main` branch. Its generated **index.html** and **sw.js** are byte-identical to the tested copies in `dist/`, so merging a built change keeps the same public URL and includes the offline worker. No Pages settings change is needed. For another static host, deploy the two files from `dist/` together as above.

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

Settings, per-game support, the current drawing, and practice stars are saved only on this installation under the `doodle-fun:v2:` prefix. They are not synced across devices. Blocked/full storage falls back to the current session; PNG export is the way to keep important artwork. The offline cache stores the app itself; personal drawings and practice progress stay in local storage.

The previous app did not persist artwork or progress, so there is no legacy saved-data migration. The nine original template drawings and letter paths were retained and revised where necessary.
