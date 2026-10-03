# Content provenance and release audit

Reviewed October 3, 2026 against source `bf40d0adbbbb7c438cb83c84da657be004edfe85` and the vector-stamp remediation in this change. This is a source, packaging and published-license audit, not a legal opinion or a guarantee of non-infringement. Git history records when material entered this project; it does not by itself establish ownership or contributor assignments.

## Outcome

No pirated artwork, copied commercial recordings, downloaded songs, bundled commercial fonts, or third-party runtime libraries were identified. The synthetic coaching recordings have documented permissive upstream sources and are retained. Coloring pictures, activity illustrations, lesson paths and the app icon are defined by project source rather than imported stock-image files.

One avoidable uncertainty was removed: newly placed drawing stamps now use the same project-authored vector drawings as their previews. Previously, the picker used a mixture of vector previews and Unicode emoji, while every placement rasterized a device emoji font into the user's PNG. This change retains all 20 stamp choices, sizing, Undo/Redo, existing saved drawings and export. Existing pixel drafts may still contain previously placed emoji; they are preserved unchanged. This is risk reduction and visual consistency, not a finding that the earlier app infringed copyright.

Public release still needs the actual rights holder/copyright credit and confirmation that the submitter owns or has the necessary rights to the project's contributions. Do not infer that identity from a Git author, account name or bundle identifier. Account settings, physical testing and Apple's review are separate release checks.

## Shipped content inventory

| Content | Exact source / evidence | Assessment and action |
| --- | --- | --- |
| Nine coloring pictures | `templates.js`: Sunshine, Rainbow, House, Butterfly, Rocket, Cat, Flower, Fish and Dino. Extracted into the module at `5d0f736`; subsequent geometry fixes remain in Git history | Procedural Canvas geometry; no external image references. Retain. Project authorship/rights remain subject to owner confirmation |
| Activity/card illustrations and game objects | `activity-art.js`, plus inline geometric SVG in `learning.js`, `discovery.js`, `challenges.js`, `adventures.js` and `studio-play.js`. Main illustrated set introduced at `78d76ae`; its project plan and summary expressly describe original illustrations | Source-defined paths, shapes and system-rendered labels. No stock library, image pack or remote image endpoint identified. Retain |
| Twenty drawing stamps | `stamp-art.js` names the complete catalog; `activity-art.js` supplies the geometry; `draw.js` rasterizes only those SVG images for new placements | Ten existing object illustrations reused; ten new stamp illustrations authored in this change. Preview and export use the same paths. No copied emoji images, font outlines or remote assets. No migration or destruction of existing user artwork |
| Letter/numeral/tracing paths and learning content | `learning-data.js`, activity modules, `coaching.js`, `catalog.js` and `scripts/voice-transcripts.mjs` | Project-defined geometry, short prompts and generated practice rounds. No reproduced book, worksheet pack, lyrics or branded character found in the inspected sources. Retain |
| Web app icon | `icon.svg`, SHA-256 `d6ca53502aa9c3ef0f9c5c03c8ffd55aecbd100dfecfead8f9e1a2848e99b3ca`, introduced at `e75e887` | Simple source-defined lowercase mark with dot; no font or external logo file. Retain; no trademark clearance search is implied |
| Native app icon | `ios/DoodleFun/Assets.xcassets/AppIcon.appiconset/AppIcon.png`, SHA-256 `7bf52cd8421110958bf27095bd52b12b8d1ee82780d7cfe39acdd51481aec044`; reproduced by `ios/scripts/render-icon.swift`, introduced together at `b069808` | Core Graphics recreation of the same mark, not a stock image or emoji. Source and rendered PNG inspected; retain |
| Synthetic coach recordings | All 120 `assets/voice/<id>.m4a` files, individually listed with transcript, uses, bytes and SHA-256 in `assets/voice/manifest.json`; `scripts/generate-voice-clips.py`; [voice record](voice-provenance.md) | 10,120,649 bytes, 1,178.085 seconds; every current file digest and transcript/mode/age association verified. General `af_heart` synthetic voice; no separately recorded human performance, requested named-person clone or imported song in the generation path. Retain with the caveats below |
| Listening sounds and music patterns | `audio.js`, `listening.js`, `studio-play.js`, `adventures.js` | Local oscillator/noise synthesis and generated note/rhythm sequences; no sample pack, soundfont, master recording, licensed song catalog or background-music file. User-created beat patterns remain local |
| Device speech | `speech.js`, `ios/DoodleFun/DoodleViewController.swift` | Uses browser/device speech APIs at the user's request. Voice binaries are not copied into this repository or app; dynamic speech is not recorded for redistribution |
| Fonts and Unicode labels | CSS font stacks in `styles.css`, component CSS, `privacy.html` and `support.html`; system-font SVG text | No `.ttf`, `.otf`, `.woff`, `.woff2` or other font payload found. Names such as SF Pro Rounded, Nunito and Segoe UI are fallbacks to an installed font, not embedded font files. No remote font stylesheet/import remains in the release bundle |
| Native frameworks | `ios/DoodleFun/*.swift` and `ios/DoodleFun.xcodeproj/project.pbxproj` | Apple SDK frameworks only; no CocoaPods, Swift package dependency, copied third-party native framework or model resource identified |

The tracked media-file inventory is exactly 132 files: 120 AAC clips, 11 PNGs (one native app icon and ten store screenshots), and one SVG app icon. Runtime vector drawings live in JavaScript, and audio is embedded into the standalone HTML during build. The native resource copy contains that same HTML and its hash manifest; neither model weights nor Python/Node tooling is included.

## Voice source and license evidence

The official [Kokoro-82M model card](https://huggingface.co/hexgrad/Kokoro-82M) identifies Apache-2.0 weights and describes its training sources. The publisher's [voice catalog](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) lists `af_heart` under American English. The [official wrapper repository](https://github.com/thewh1teagle/kokoro-onnx) identifies its code as MIT and the model as Apache-2.0. These primary sources were checked on October 3, 2026.

The recorded build uses Kokoro-82M v1.0, `kokoro-onnx==0.6.1`, `af_heart`, speed 0.96, and the official [model-files-v1.1 release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1). Historical generation hashes in the manifest are:

- Model: `beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a`
- Voice pack: `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`

This audit rehashed every shipped clip, not the unbundled historical model files, and did not regenerate speech or independently audit the model's training data or voice-consent chain. No separate output-only, noncommercial or royalty restriction was identified in the inspected publisher materials. That supports retaining the generated clips; it does not establish exclusive copyright in AI output or guarantee all possible third-party rights.

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) allows distribution of covered work subject to its conditions, including license and applicable notice preservation. [The wrapper's MIT license](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE) requires its notice when distributing the software or substantial portions. Here those tools and weights remain build-only; generated audio is the shipped asset. Existing provenance documentation credits both. No additional mandatory in-app software notice was identified for this artifact. Reassess license/notice obligations before shipping any model, wrapper or additional third-party code, rather than assuming the same conclusion covers a different package.

## Emoji and system resources

Apple's [App Review Guidelines 4.5.6 and 5.2](https://developer.apple.com/app-store/review/guidelines/#intellectual-property) allow runtime Unicode emoji in app UI/metadata while restricting bundled Apple emoji artwork and requiring rights to included content. Remaining interface emoji are Unicode text rendered by the device, not extracted Apple image files. Replacing new exportable stamps with project vectors avoids relying on platform emoji redistribution rights. We did not remove ordinary system-font UI text or rewrite users' existing drawings.

## Development dependencies and notices

`package.json` declares only development dependencies. The audited lockfile resolves esbuild 0.28.2 and its platform packages as MIT, and `@playwright/test`, `playwright` and `playwright-core` 1.63.0 as Apache-2.0. Installed package license files remain with those packages. Build-only Python dependencies are documented in the voice generator; they are not part of the release bundle.

An esbuild metafile audit identified only the project's JavaScript modules as bundle inputs, with no `node_modules` inputs or external imports. No third-party runtime software was found requiring a bundled attribution screen. The current build uses `legalComments:'none'`; before adding a runtime dependency, review its actual license and include required notices rather than relying on that stripping setting. This report does not assign an open-source license to Doodle Fun itself.

## Store assets, separate from the app binary

The ten checked-in screenshots are `docs/app-store/screenshots/{iphone,ipad}/{01-library,02-coloring,03-tracing,04-patterns,05-listening}.png`. All ten hashes match their adjacent manifests. They are recorded as native simulator captures of historical runtime `0f22199625622369`; they are not captures of this candidate. Preserve that original evidence and recapture/review current screens before public store submission. No third-party marketing photo, device mockup, font file or promotional soundtrack is included in this set. See the [capture procedure and original provenance](app-store/screenshots/README.md).

## Verification and remaining gates

- Passed: all 120 AAC hashes, exact current transcript coverage, no orphan voice clips, and all ten screenshot hashes
- Passed: source-level inventory, complete Git-history review for asset introduction, no external bundle imports, icon/source inspection and vector contact-sheet visual review
- Passed: `npm run ios:sync`, `npm run check`, `npm test` (246 tests), and `git diff --check`
- Added regression coverage: all 20 actual stamp placements versus picker geometry in exported PNG pixels, exact Undo/Redo, no late placement after slow decode/navigation, and legacy-draft restoration/export
- Local browser execution is blocked: package browsers were absent; system Chromium could not create its process socket even with an approved escalation, and the downloaded WebKit lacks host libraries. No successful local browser or Safari result is claimed. Hosted full Chromium/WebKit/native CI must pass for the final commit before this change is called release-ready
- Native distribution-archive resource inspection, current screenshots, physical iPhone/iPad acceptance, legal seller/rights-holder identity, final questionnaires and Apple review remain separate checks

Keep a source and license record for every future external asset. Do not substitute a bare "royalty-free" label or a Git commit for the actual grant and any required attribution. If the owner identifies imported project material or an ownership restriction not visible here, pause the affected content and review that specific evidence before publication.
