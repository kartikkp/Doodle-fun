# Doodle Fun

A friendly creative learning space for ages 2–10, designed for fingers, an Apple Pencil, and a mouse. It remains a lightweight static web app with no runtime dependencies, accounts, advertising, or backend.

## 21 activities, 34 modes

Browse **Create, Letters, Numbers, Discover, and Listen**. Related practice now shares a home card:

- **Create (1):** Doodle studio combines Free draw and Coloring pages, with all nine pictures, 20 stamps, undo/redo, one local draft, and PNG export.
- **Letters (3):** Trail studio combines lines, uppercase/lowercase letters, words, and numerals. Letter buddies and Build a word teach recognition and word construction separately.
- **Numbers (4):** Count & make, Number stories, Groups & sharing, and More/less/same. Their modes retain counting, frames, addition, subtraction, missing parts, equal groups, and fair sharing.
- **Discover (9):** Put it in order, Shape & color detective, Pattern parade, Sort it out, Spot the difference, Memory garden, Pathfinder, Story steps, and Shape builder. Number ordering and following arrows remain selectable modes.
- **Listen (4):** Sound detective, Higher or lower, Melody echo, and Beat studio. They use generated sounds for sound matching, pitch direction, melody memory, and drum patterns. Melody echo also retains the earlier visual sequence game as Picture practice.

All 30 earlier routes remain available as modes, with four new listening modes. Individual glyphs, coloring pictures, and puzzle rounds are content within these modes. See the [current catalog and acceptance checklist](docs/activity-catalog.md) for every route and learning purpose.

Each age from 2 through 10 has a starting configuration. **Coach** offers a starting step, current-mode hints, strategy, conversation and real-object activities. **A little easier / harder** remembers a separate adjustment for each practice mode. Changing a challenge may begin a fresh round; drawing edits remain recoverable. Young children can explore words and arithmetic with a grown-up. The [consolidation and listening review](docs/consolidated-listening-review.md) records current source-based behavior and listening settings. The [earlier coached play review](docs/coached-play-review.md) remains a dated assessment of the previous catalog.

Game sound is separate from **Read aloud**. Inside a listening game, use **Game sound**, **Game volume**, and **Listen**; Sound detective also offers separate Hear and Choose buttons. Tones and percussion are generated locally without downloaded audio, a microphone, or voice recording. Playback starts through a listening control and pauses when the turn is interrupted. Check device volume, Silent mode, or connected headphones if nothing is audible. Picture hints are available; completed practice is not a hearing or learning assessment.

## iPhone and iPad app

Open **ios/DoodleFun.xcodeproj** in Xcode and run the **DoodleFun** scheme. The iOS 17+ app includes all activities and generated game sounds offline, optional native spoken coaching, local progress and the system PNG share sheet. Run `npm run ios:sync` after web changes. A personal device requires your Xcode signing team; no App Store submission is included. See [iPhone build and installation](docs/iphone-app.md).

## Run

Use Node.js 20 or newer:

```sh
npm install
npm start
```

Open `http://127.0.0.1:4173`. `PORT` can override the port. `npm start` first builds a self-contained app into `dist/` and then serves it. The build also writes identical generated `index.html` and `sw.js` files at the repository root.

For a standalone copy, run `npm run build` and open **dist/index.html** in a browser. All game code, styles, and icons are embedded: opening an activity does not fetch another module and does not need a server. To host the app, publish the contents of **dist/** together: **index.html**, **sw.js**, **privacy.html**, and **support.html**. The service worker caches the complete app and public pages for offline reloads after its first successful installation over HTTPS or localhost. It does not claim to install before the initial page has loaded. Browser storage eviction can remove this cache; the downloadable HTML remains independent.

## Build and deploy

Edit **app-shell.html**, the JavaScript modules, or the CSS source files, then run `npm run build`. The root **index.html** and **sw.js** are generated release files; run `npm run ios:sync` and commit both root release files plus the native Resources bundle whenever source changes. Do not edit the generated files directly. CI rebuilds the app and rejects stale committed release files.

The existing GitHub Pages configuration publishes the repository root from the `main` branch, including **privacy.html** and **support.html**. Its generated **index.html** and **sw.js** are byte-identical to the tested copies in `dist/`, so merging a built change keeps the same public URL and includes the offline worker. No Pages settings change is needed. For another static host, deploy all four files from `dist/` together as above.

The prior preview failed because a cached home page tried to import game modules from a stopped local server. Bundling removes that dependency from every activity entry point. Offline entry, offline reload, and the downloadable HTML each have dedicated regression checks.

## Verification

```sh
npm run check
npm test
npx playwright install chromium webkit
npm run test:browser
```

Verify all 21 cards and 34 modes, including legacy links, at phone/tablet sizes and across the nine starting ages. Listening checks must exercise generated audio, replay, interrupted playback, hints, and completion; an animation or DOM pass alone cannot establish audible playback. The [current consolidation/listening QA](docs/consolidated-listening-qa.md) records versioned results and limits; the [catalog checklist](docs/activity-catalog.md) records acceptance criteria. Historical [web QA](docs/qa-report.md) and [iPhone QA](docs/iphone-qa-report.md) reports retain their earlier bundles and dates. Physical Apple Pencil behavior, VoiceOver, and observation of children remain separate checks.

## Local data

Settings (including separate read-aloud, game-sound and volume choices), per-mode support, the current drawing, and practice stars are saved only on this installation under the `doodle-fun:v2:` prefix. They are not synced across devices. Blocked/full storage falls back to the current session; PNG export is the way to keep important artwork. The offline cache stores the app itself; personal drawings and practice progress stay in local storage.

The previous app did not persist artwork or progress, so there is no legacy saved-data migration. The nine original template drawings and letter paths were retained and revised where necessary.
