import {cp, mkdir, mkdtemp, readFile, readdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// macOS + Xcode only. Capture real native UI in an isolated project copy.
// This never builds/syncs the web bundle or edits the owner's signing settings.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args=process.argv.slice(2), option=name=>args[args.indexOf(name)+1];
const get=name=>args.includes(name)?option(name):undefined;
const family=get('--family');
if(!['iphone','ipad'].includes(family)) throw new Error('Supply --family iphone|ipad.');
const output=path.resolve(get('--output')||path.join(root,'test-results','app-store',`${family}-${Date.now()}`));
if(output===root || output===path.join(root,'ios') || output.startsWith(path.join(root,'ios')+path.sep)) throw new Error('Use a separate capture output directory.');
const sha=data=>createHash('sha256').update(data).digest('hex');
const xcrun=(...args)=>execFileSync('xcrun',args,{encoding:'utf8',maxBuffer:16*1024*1024});
const scenes=[
  {id:'01-library',title:'A library of 30 activities',interaction:'Select age 6 using the home age control.'},
  {id:'02-coloring',title:'Color and create',interaction:'Open Color & create, choose Rainbow, select six colors and fill six enclosed bands with native taps.'},
  {id:'03-tracing',title:'Practice letter paths',interaction:'Open Big letter trails and trace A’s three numbered paths with trusted native finger drags on the visible guide.'},
  {id:'04-patterns',title:'Notice what repeats',interaction:'Open Pattern parade and move to the third age-6 round, an ABC repeating pattern.'},
  {id:'05-coach',title:'A little help along the way',interaction:'Open the visible Coach control for Pattern parade.'},
];
const sourceProject=path.join(root,'ios/DoodleFun.xcodeproj/project.pbxproj');

const captureSource=String.raw`import XCTest

final class AppStoreScreenshots: XCTestCase {
    private var app: XCUIApplication!
    private var web: XCUIElement { app.webViews.firstMatch }
    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
        app.launchArguments = ["--reset-test-data"]
        app.launch()
        XCTAssertTrue(web.waitForExistence(timeout: 30))
        XCTAssertTrue(named("Age 6").waitForExistence(timeout: 30))
    }
    override func tearDownWithError() throws {
        if (testRun?.failureCount ?? 0) > 0 {
            capture("capture-failure")
            let tree = XCTAttachment(string: app.debugDescription)
            tree.name = "Capture failure accessibility"
            tree.lifetime = .keepAlways
            add(tree)
        }
        app.terminate()
    }
    private func named(_ label: String) -> XCUIElement {
        web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }
    private var visibleBounds: CGRect {
        let window = app.windows.firstMatch.frame
        // Leave space around the status bar while allowing the iPad's Coach
        // row, which sits above the taller phone's top safe-area boundary.
        return window.insetBy(dx: 10, dy: window.width >= 700 ? 32 : 72)
    }
    private func reveal(_ element: XCUIElement, surface: Bool = false) {
        XCTAssertTrue(element.waitForExistence(timeout: 15))
        for _ in 0..<32 {
            let frame = element.frame, bounds = visibleBounds
            let safelyVisible = surface ? bounds.contains(frame) : bounds.contains(CGPoint(x:frame.midX,y:frame.midY))
            if !frame.isEmpty, safelyVisible, surface || element.isHittable { return }
            let down = !frame.isEmpty && frame.minY < bounds.minY
            let distance = min(CGFloat(250), max(CGFloat(65), abs(frame.midY - bounds.midY)))
            let origin = web.coordinate(withNormalizedOffset: .zero)
            let upper = origin.withOffset(CGVector(dx: 12, dy: bounds.midY - distance / 2 - web.frame.minY))
            let lower = origin.withOffset(CGVector(dx: 12, dy: bounds.midY + distance / 2 - web.frame.minY))
            (down ? upper : lower).press(forDuration: 0.05, thenDragTo: down ? lower : upper,
                                      withVelocity: .default, thenHoldForDuration: 0.15)
        }
        XCTFail("Cannot reveal capture control: \(element.label), frame \(element.frame)")
    }
    private func tap(_ element: XCUIElement) {
        reveal(element)
        element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }
    private func open(_ title: String) {
        let link = web.links.matching(NSPredicate(format: "label == %@", title)).firstMatch
        tap(link)
    }
    private func home() {
        let back = web.buttons.matching(NSPredicate(format: "label IN %@", ["Back to activities", "Back to home"])).firstMatch
        tap(back)
    }
    private func capture(_ name: String) {
        // Full-screen capture preserves every native pixel, unlike the older
        // app-window API on some iOS versions. No canvas/DOM image is substituted.
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "store-" + name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    private func settle() { Thread.sleep(forTimeInterval: 0.6) }
    func testCaptureStoreScenes() {
        tap(named("Age 6"))
        settle()
        capture("01-library")

        open("Color & create")
        let page = web.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Color Rainbow'")).firstMatch
        tap(page)
        XCTAssertTrue(named("Close coloring pages").waitForNonExistence(timeout: 10))
        let paper = named("Drawing paper. Draw using your finger, Apple Pencil, or mouse.")
        XCTAssertTrue(paper.waitForExistence(timeout: 10))
        for (color, y) in [("Coral",0.39),("Orange",0.47),("Yellow",0.55),("Green",0.63),("Blue",0.70),("Purple",0.78)] {
            tap(named(color))
            XCTAssertTrue(app.windows.firstMatch.frame.contains(paper.frame))
            paper.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: y)).tap()
        }
        XCTAssertTrue(named("Undo last action").isEnabled)
        // Wait for the actual saved-draft status and any initial template notice.
        XCTAssertTrue(named("Draft saved on this device").waitForExistence(timeout: 10))
        settle()
        capture("02-coloring")
        home()

        open("Big letter trails")
        let board = named("Trace the guide with a finger or Pencil")
        reveal(board, surface: true)
        let segments: [(CGVector,CGVector)] = [
            (CGVector(dx:0.5,dy:0.18),CGVector(dx:0.28,dy:0.82)),
            (CGVector(dx:0.5,dy:0.18),CGVector(dx:0.72,dy:0.82)),
            (CGVector(dx:0.36,dy:0.59),CGVector(dx:0.64,dy:0.59))
        ]
        for (start,end) in segments {
            board.coordinate(withNormalizedOffset:start).press(forDuration:0.05,
                thenDragTo:board.coordinate(withNormalizedOffset:end))
        }
        XCTAssertTrue(named("Beautiful practice! Your paths are complete. Pick another when you’re ready.").waitForExistence(timeout:10))
        settle()
        capture("03-tracing")
        home()

        open("Pattern parade")
        let next = web.buttons.matching(NSPredicate(format:"label BEGINSWITH 'New round'")).firstMatch
        tap(next)
        tap(next)
        reveal(named("Pattern parade"))
        XCTAssertTrue(named("Which picture comes next?").exists)
        settle()
        capture("04-patterns")
        tap(named("Coach"))
        XCTAssertTrue(named("Close coach").waitForExistence(timeout:10))
        XCTAssertTrue(named("Start here").exists)
        XCTAssertTrue(named("Try a strategy").exists)
        settle()
        capture("05-coach")
    }
}
`;

let metadata, result;
if(get('--export')) {
  result=path.resolve(get('--export'));
  metadata=JSON.parse(await readFile(path.join(output,'capture-run.json'),'utf8'));
  if(metadata.family!==family) throw new Error('Capture metadata device family mismatch.');
  if(path.resolve(metadata.result)!==result) throw new Error('Use the capture output directory whose metadata names this exact result.');
} else {
  const device=get('--device');
  if(!device) throw new Error('Supply --device <dedicated App Store simulator UDID>. Its app data is reset.');
  const protectedDevices=['139E0398-D2DC-4BC2-86D3-C543BADC3C56','7F78E3A4-8E96-4007-A444-0B6D3F86A0FA','72351945-9749-4DD3-8B16-EA8BD091F69F'];
  if(protectedDevices.includes(device.toUpperCase())) throw new Error('Owner and full-QA devices are protected. Use a dedicated App Store simulator.');
  const inventory=JSON.parse(xcrun('simctl','list','devices','available','--json'));
  const candidate=Object.entries(inventory.devices).flatMap(([runtime,values])=>values.map(value=>({...value,runtime}))).find(value=>value.udid===device);
  if(!candidate?.name.startsWith('Doodle App Store ')) throw new Error('Use a dedicated simulator named Doodle App Store ….');
  const originalProjectHash=sha(await readFile(sourceProject));
  const project=path.join(output,'project');
  await mkdir(project,{recursive:true});
  await cp(path.join(root,'ios'),path.join(project,'ios'),{recursive:true,filter:src=>!src.split(path.sep).some(part=>['build','DerivedData','xcuserdata'].includes(part))});
  // The regular UI-test target already includes this file. Replacing only its
  // copy keeps screenshot machinery out of the app and source project.
  await writeFile(path.join(project,'ios/DoodleFunUITests/DoodleFunUITests.swift'),captureSource);
  const resources=path.join(project,'ios/DoodleFun/Resources');
  const bundleManifest=JSON.parse(await readFile(path.join(resources,'BundleManifest.json'),'utf8'));
  if(sha(await readFile(path.join(resources,'index.html')))!==bundleManifest.sha256) throw new Error('Native bundle manifest does not match its HTML. Run ios:sync before capture.');
  const nativeSourceSHA256={};
  for(const file of (await readdir(path.join(project,'ios/DoodleFun'),{recursive:true})).filter(file=>/\.(swift|plist|xcprivacy)$/.test(file)).sort()) {
    nativeSourceSHA256[file]=sha(await readFile(path.join(project,'ios/DoodleFun',file)));
  }
  const preparedAt=new Date().toISOString();
  result=path.join(output,`capture-${preparedAt.replaceAll(':','-').replaceAll('.','-')}.xcresult`);
  const command=['-project',path.join(project,'ios/DoodleFun.xcodeproj'),'-scheme','DoodleFun',
    '-destination',`platform=iOS Simulator,id=${device}`,'-derivedDataPath',path.join(output,'DerivedData'),
    '-resultBundlePath',result,'-parallel-testing-enabled','NO','CODE_SIGNING_ALLOWED=NO','ONLY_ACTIVE_ARCH=YES','test',
    '-only-testing:DoodleFunUITests/AppStoreScreenshots/testCaptureStoreScenes'];
  const captureDevice={name:candidate.name,udid:candidate.udid,deviceTypeIdentifier:candidate.deviceTypeIdentifier,runtime:candidate.runtime};
  metadata={family,device:captureDevice,bundleManifest,nativeSourceSHA256,sourceProjectSHA256:originalProjectHash,captureSourceSHA256:sha(captureSource),preparedAt,result,command:['xcodebuild',...command]};
  await writeFile(path.join(output,'capture-run.json'),JSON.stringify(metadata,null,2)+'\n');
  if(sha(await readFile(sourceProject))!==originalProjectHash) throw new Error('Source project changed during preparation; rerun with a stable snapshot.');
  if(args.includes('--prepare-only')) {console.log(`Prepared ${family} native captures in ${output}`);process.exit(0);}
  console.log(`Waiting for dedicated ${candidate.name} to finish booting; capturing bundle ${bundleManifest.fingerprint}.`);
  if(candidate.state!=='Booted') xcrun('simctl','boot',device);
  xcrun('simctl','bootstatus',device,'-b');
  xcrun('simctl','status_bar',device,'override','--time','9:41','--dataNetwork','wifi','--wifiMode','active','--wifiBars','3','--cellularMode','active','--cellularBars','4','--batteryState','discharging','--batteryLevel','100');
  const code=await new Promise((resolve,reject)=>{const child=spawn('caffeinate',['-i','xcodebuild',...command],{cwd:root,stdio:'inherit'});child.on('error',reject);child.on('exit',resolve);});
  if(code!==0) throw new Error(`Native screenshot capture failed (${code}); inspect ${result}.`);
}
// xcresulttool refuses to overwrite an existing manifest. A fresh directory
// preserves earlier evidence and also makes repeated --export runs safe.
const exportDirectory=await mkdtemp(path.join(output,'attachments-'));
xcrun('xcresulttool','export','attachments','--path',result,'--output-path',exportDirectory,'--test-id','AppStoreScreenshots');
const attachments=JSON.parse(await readFile(path.join(exportDirectory,'manifest.json'),'utf8')).flatMap(item=>item.attachments||[]);
const assets=path.resolve(get('--assets')||path.join(output,'screenshots'));
const prepared=[];
for(const scene of scenes) {
  const matches=attachments.filter(item=>item.suggestedHumanReadableName.startsWith(`store-${scene.id}_`)&&!item.isAssociatedWithFailure);
  if(matches.length!==1) throw new Error(`Expected one successful ${scene.id} capture, got ${matches.length}.`);
  const attachment=matches[0],bytes=await readFile(path.join(exportDirectory,attachment.exportedFileName));
  if(attachment.deviceId!==metadata.device.udid) throw new Error('Screenshot device does not match its capture metadata.');
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') throw new Error('Expected PNG screenshot.');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),bitDepth=bytes[24],colorType=bytes[25];
  for(let offset=8;offset+12<=bytes.length;) {
    const length=bytes.readUInt32BE(offset),type=bytes.subarray(offset+4,offset+8).toString('ascii');
    if(type==='tRNS') throw new Error('PNG transparency chunks are not allowed in App Store assets.');
    offset+=12+length;
  }
  const sizes=family==='iphone'?[[1320,2868],[1290,2796]]:[[2064,2752],[2048,2732]];
  if(!sizes.some(([w,h])=>width===w&&height===h)) throw new Error(`Unexpected App Store ${family} dimensions ${width}×${height}.`);
  if(colorType!==2||bitDepth!==8) throw new Error(`Expected opaque 8-bit RGB PNG; got color type ${colorType}, depth ${bitDepth}.`);
  prepared.push({scene,bytes,record:{...scene,file:`${scene.id}.png`,width,height,alpha:false,sha256:sha(bytes),attachment:attachment.exportedFileName,capturedAt:new Date(attachment.timestamp*1000).toISOString()}});
}
await mkdir(assets,{recursive:true});
for(const {record,bytes} of prepared) await writeFile(path.join(assets,record.file),bytes);
const manifest={schema:1,family,sourceBundle:metadata.bundleManifest,nativeSourceSHA256:metadata.nativeSourceSHA256,sourceProjectSHA256:metadata.sourceProjectSHA256,
  captureSourceSHA256:metadata.captureSourceSHA256,device:metadata.device,method:'Actual bundled native app, XCUI taps and finger drags, XCUIScreen.main.screenshot. Original PNG bytes; no crop, resize, compositing, or generated imagery.',
  captureResult:path.basename(result),attachmentDirectory:path.basename(exportDirectory),preparedAt:metadata.preparedAt,age:6,statusBar:'9:41, full Wi-Fi, 100% battery (simulator override)',
  reproducibility:'The scene flow is reproducible. Pattern token selection follows the app’s normal random generator, so exact picture choices can differ on a rerun.',
  screenshots:prepared.map(({record})=>record)};
await writeFile(path.join(assets,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Exported five verified ${family} native screenshots for ${metadata.bundleManifest.fingerprint} to ${assets}`);
