import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn, execFileSync} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {finished} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {nativeTestSourcePaths, indexNativeTests, validateNativeTestSelection} from './native-test-selection.mjs';

// This orchestrates existing test/capture helpers. It never rebuilds the web
// app, syncs resources, changes assertions, signs, uploads to Apple, or publishes.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeID = 'com.apple.CoreSimulator.SimRuntime.iOS-26-5';
const layout = 'DoodleFunTests/NativeLayoutTests/testLandscapeSafeAreasAndLowerActivityControls';
const drawing = 'DoodleFunUITests/DrawingRecoveryUITests/';
const rotation = drawing + 'testFingerStrokeUndoRedoRotationAndRelaunch';
export const releasePlan = [
  {id:'compact', name:'Doodle Release QA Compact', type:'iPhone-SE-3rd-generation',
    tests:[layout, drawing+'testAllNineColoringPagesRenderAcceptFillAndUndo', rotation, drawing+'testNewPictureCancelClearUndoAndRedo']},
  {id:'phone', name:'Doodle Release QA Phone', type:'iPhone-17-Pro', tests:[layout, rotation]},
  {id:'store-iphone', name:'Doodle App Store iPhone', type:'iPhone-17-Pro-Max', family:'iphone', dimensions:[1320,2868]},
  {id:'store-ipad', name:'Doodle App Store iPad', type:'iPad-Pro-13-inch-M5-12GB', family:'ipad', dimensions:[2064,2752]},
].map(item => ({...item, type:'com.apple.CoreSimulator.SimDeviceType.'+item.type}));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readJSON = async file => JSON.parse(await readFile(file,'utf8'));
const json = (file, value) => writeFile(file, JSON.stringify(value,null,2)+'\n');
const commandText = (command, args) => execFileSync(command,args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const xcrun = (...args) => commandText('xcrun',args);

export function selectReleaseRuntime(inventory) {
  const runtime = inventory.runtimes.find(item => item.identifier === runtimeID && item.isAvailable);
  assert(runtime, 'The runner must have an available iOS 26.5 runtime; no silent OS substitution.');
  for (const item of releasePlan) {
    assert(inventory.devicetypes.some(type => type.identifier === item.type), 'Missing device type: '+item.type);
    assert(runtime.supportedDeviceTypes?.some(type => type.identifier === item.type),
      'iOS 26.5 does not report support for '+item.type);
  }
  return runtime;
}

export function verifyTestReport(summary, tree, selections, device) {
  assert.equal(summary.result, 'Passed');
  assert.equal(summary.totalTestCount, selections.length, 'Every selected case must actually execute.');
  assert.equal(summary.passedTests, selections.length);
  for (const key of ['failedTests','skippedTests','expectedFailures']) assert.equal(summary[key], 0, key);
  assert(summary.devicesAndConfigurations?.length > 0);
  for (const configuration of summary.devicesAndConfigurations) {
    assert.equal(configuration.device.deviceId, device.udid);
    assert.equal(configuration.device.osVersion, '26.5');
  }
  const cases = [];
  const visit = nodes => {
    for (const node of nodes || []) {
      if (node.nodeType === 'Test Case') cases.push(node);
      visit(node.children);
    }
  };
  visit(tree.testNodes);
  assert.equal(cases.length, selections.length);
  for (const selection of selections) {
    const matches = cases.filter(item => item.nodeIdentifierURL?.endsWith('/'+selection));
    assert.equal(matches.length, 1, 'Missing or duplicated result: '+selection);
    assert.equal(matches[0].result, 'Passed', selection);
  }
}

async function sourceIdentity() {
  const manifest = await readJSON(path.join(root,'ios/DoodleFun/Resources/BundleManifest.json'));
  const html = await readFile(path.join(root,'ios/DoodleFun/Resources/index.html'));
  assert.match(manifest.fingerprint, /^[a-f0-9]{16}$/);
  assert.equal(sha(html), manifest.sha256);
  assert.equal(html.toString().match(/<meta name="doodle-build" content="([a-f0-9]{16})"/)?.[1], manifest.fingerprint);
  assert.equal(sha(await readFile(path.join(root,'index.html'))), manifest.sha256, 'Web and native bundles must match.');
  const sources = await Promise.all(nativeTestSourcePaths().map(async file =>
    ({file,source:await readFile(path.join(root,'ios',file),'utf8')})));
  const index = indexNativeTests(sources);
  for (const item of releasePlan) for (const selection of item.tests || []) validateNativeTestSelection(selection,index);
  assert.equal(index.get('DoodleFunUITests').get('DrawingRecoveryUITests').size, 3, 'Review this release plan if drawing cases change.');
  const files = commandText('git',['ls-files','-z']).split('\0').filter(file =>
    /^[^/]+\.(?:js|css|html|json|svg)$/.test(file) ||
    /^(?:scripts|tests)\/.*\.(?:mjs|js)$/.test(file) ||
    /^ios\/.*\.(?:swift|plist|xcprivacy|pbxproj)$/.test(file) ||
    file.startsWith('ios/DoodleFun/Resources/') || file === '.github/workflows/qa.yml');
  const sourceFilesSHA256 = {};
  for (const file of files.sort()) sourceFilesSHA256[file] = sha(await readFile(path.join(root,file)));
  const nativeSourceSHA256 = {};
  for (const file of (await readdir(path.join(root,'ios/DoodleFun'),{recursive:true})).filter(file => /\.(swift|plist|xcprivacy)$/.test(file)).sort()) {
    nativeSourceSHA256[file] = sha(await readFile(path.join(root,'ios/DoodleFun',file)));
  }
  return {
    commit:commandText('git',['rev-parse','HEAD']).trim(),
    workingTreeClean:!commandText('git',['status','--porcelain']).trim(),
    bundleManifest:manifest, sourceFilesSHA256, nativeSourceSHA256,
    orchestrationSHA256:sha(await readFile(fileURLToPath(import.meta.url))),
    sourceProjectSHA256:sha(await readFile(path.join(root,'ios/DoodleFun.xcodeproj/project.pbxproj'))),
  };
}

async function logged(command, args, directory, label) {
  await mkdir(directory,{recursive:true});
  await json(path.join(directory,label+'-command.json'),[command,...args]);
  console.log('Release evidence: '+path.basename(directory)+' / '+label);
  const log = createWriteStream(path.join(directory,label+'.log'));
  const code = await new Promise((resolve,reject) => {
    const child = spawn(command,args,{cwd:root,stdio:['ignore','pipe','pipe']});
    for (const stream of [child.stdout,child.stderr]) {
      stream.pipe(log,{end:false});
      stream.pipe(process.stdout,{end:false});
    }
    child.on('error',reject);
    child.on('close',resolve);
  }).finally(() => log.end());
  await finished(log);
  return code;
}

async function executeTests(command, directory, result, selections, device) {
  const code = await logged('caffeinate',['-di',...command],directory,'run');
  // Save summaries even when tests fail. The original xcresult is always kept.
  const summary = JSON.parse(xcrun('xcresulttool','get','test-results','summary','--path',result));
  const tree = JSON.parse(xcrun('xcresulttool','get','test-results','tests','--path',result));
  await json(path.join(directory,'test-summary.json'),summary);
  await json(path.join(directory,'tests.json'),tree);
  assert.equal(code,0,'xcodebuild failed; inspect '+result);
  verifyTestReport(summary,tree,selections,device);
  return summary;
}

async function nativeCheck(item, device, directory, identity) {
  const args = ['scripts/run-iphone-qa.mjs','--device',device.udid,'--output',directory,'--prepare-only'];
  for (const selection of item.tests) args.push('--only',selection);
  assert.equal(await logged(process.execPath,args,directory,'prepare'),0);
  const metadata = await readJSON(path.join(directory,'qa-build.json'));
  assert.deepEqual(metadata.manifest,identity.bundleManifest);
  assert.equal(metadata.originalProjectHash,identity.sourceProjectSHA256);
  assert.equal(sha(await readFile(path.join(metadata.project,'ios/DoodleFun/Resources/index.html'))),identity.bundleManifest.sha256);
  const result = path.join(directory,'focused.xcresult');
  const command = ['xcodebuild','-project',path.join(metadata.project,'ios/DoodleFun.xcodeproj'),'-scheme','DoodleFun',
    '-destination','platform=iOS Simulator,id='+device.udid,'-derivedDataPath',path.join(directory,'DerivedData'),
    '-resultBundlePath',result,'-parallel-testing-enabled','NO','-collect-test-diagnostics','never',
    'CODE_SIGNING_ALLOWED=NO','ONLY_ACTIVE_ARCH=YES','test',...item.tests.map(selection => '-only-testing:'+selection)];
  await json(path.join(directory,'last-command.json'),command);
  const summary = await executeTests(command,directory,result,item.tests,device);
  return {result,passed:summary.passedTests,selections:item.tests};
}

async function storeCapture(item, device, directory, output, identity) {
  const assets = path.join(output,'screenshots',item.family);
  const args = ['scripts/app-store-screenshots.mjs','--family',item.family,'--device',device.udid,
    '--output',directory,'--assets',assets,'--listening-state','ready'];
  assert.equal(await logged(process.execPath,[...args,'--prepare-only'],directory,'prepare'),0);
  const metadataPath = path.join(directory,'capture-run.json');
  const metadata = await readJSON(metadataPath);
  assert.equal(metadata.listeningState,'ready');
  assert.deepEqual(metadata.bundleManifest,identity.bundleManifest);
  assert.deepEqual(metadata.nativeSourceSHA256,identity.nativeSourceSHA256);
  assert.equal(metadata.sourceProjectSHA256,identity.sourceProjectSHA256);
  // Keep the capture's command metadata accurate while avoiding bulky sysdiagnose.
  metadata.command.splice(1,0,'-collect-test-diagnostics','never');
  await json(metadataPath,metadata);
  xcrun('simctl','status_bar',device.udid,'override','--time','9:41','--dataNetwork','wifi','--wifiMode','active',
    '--wifiBars','3','--cellularMode','active','--cellularBars','4','--batteryState','discharging','--batteryLevel','100');
  await executeTests(metadata.command,directory,metadata.result,
    ['DoodleFunUITests/AppStoreScreenshots/testCaptureStoreScenes'],device);
  assert.equal(await logged(process.execPath,[...args,'--export',metadata.result],directory,'export'),0);
  const manifest = await readJSON(path.join(assets,'manifest.json'));
  assert.deepEqual(manifest.sourceBundle,identity.bundleManifest);
  assert.equal(manifest.screenshots.length,5);
  for (const screenshot of manifest.screenshots) {
    assert.deepEqual([screenshot.width,screenshot.height],item.dimensions);
    assert.equal(sha(await readFile(path.join(assets,screenshot.file))),screenshot.sha256);
    assert.equal(sha(await readFile(path.join(directory,manifest.attachmentDirectory,screenshot.attachment))),screenshot.sha256);
  }
  return {result:metadata.result,passed:1,screenshots:5,assets,listeningState:'ready'};
}

async function main() {
  const args = process.argv.slice(2);
  assert(args.every((arg,index) => arg === '--preflight' || arg === '--output' || args[index-1] === '--output'), 'Unknown argument.');
  const identity = await sourceIdentity();
  if (args.includes('--preflight')) {
    console.log(JSON.stringify({identity,plan:releasePlan,runtime:runtimeID,action:'Validation only; no simulator commands or file mutations.'},null,2));
    return;
  }
  assert(process.platform === 'darwin' && process.env.GITHUB_ACTIONS === 'true' && process.env.RUNNER_OS === 'macOS',
    'Execution is restricted to GitHub-hosted macOS CI. Use --preflight for local validation.');
  assert.equal(process.env.GITHUB_EVENT_NAME,'workflow_dispatch');
  assert.equal(process.env.RUNNER_ENVIRONMENT,'github-hosted');
  assert(identity.workingTreeClean,'Release evidence must start from a clean committed checkout.');
  assert.equal(identity.commit,process.env.GITHUB_SHA,'Checkout must match the immutable dispatched commit.');
  const requested = args[args.indexOf('--output')+1];
  assert(args.includes('--output') && requested && !requested.startsWith('--'),'Supply --output <fresh runner-temp directory>.');
  const output = path.resolve(requested), runnerTemp = path.resolve(process.env.RUNNER_TEMP);
  assert(output.startsWith(runnerTemp+path.sep) && !output.startsWith(root+path.sep),'Output must be inside RUNNER_TEMP and outside the checkout.');
  await mkdir(output,{recursive:false});
  const report = {schema:1,startedAt:new Date().toISOString(),status:'running',...identity,
    github:{repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,runId:process.env.GITHUB_RUN_ID,
      runAttempt:process.env.GITHUB_RUN_ATTEMPT,url:process.env.GITHUB_SERVER_URL+'/'+process.env.GITHUB_REPOSITORY+'/actions/runs/'+process.env.GITHUB_RUN_ID},
    runtime:runtimeID,plan:releasePlan,devices:[],phases:[],
    limitations:['CI compact checks use SE3/iOS26.5; they do not repeat the earlier local iOS18.6 environment.',
      'Simulator playback and screenshots do not establish physical speaker/headphone behavior.',
      'Screenshots require visual review before use. This run does not sign, upload to Apple, or publish.']};
  const reportFile = path.join(output,'release-evidence.json');
  await json(reportFile,report);
  const created = [];
  try {
    const inventory = {xcode:commandText('xcodebuild',['-version']),macOS:commandText('sw_vers',[]),
      imageOS:process.env.ImageOS,imageVersion:process.env.ImageVersion,
      runtimes:JSON.parse(xcrun('simctl','list','runtimes','--json')).runtimes,
      devicetypes:JSON.parse(xcrun('simctl','list','devicetypes','--json')).devicetypes};
    await json(path.join(output,'inventory.json'),inventory);
    const runtime = selectReleaseRuntime(inventory);
    report.runtimeVersion = runtime.version;
    report.runtimeBuild = runtime.buildversion;
    for (const item of releasePlan) {
      const name = item.name+' '+process.env.GITHUB_RUN_ID;
      const udid = xcrun('simctl','create',name,item.type,runtimeID).trim();
      assert.match(udid,/^[0-9A-F-]{36}$/i);
      const device = {id:item.id,udid,name,type:item.type,runtime:runtimeID};
      created.push(device); report.devices.push(device);
      await json(reportFile,report);
      xcrun('simctl','boot',udid);
      xcrun('simctl','bootstatus',udid,'-b');
      const phase = {id:item.id,startedAt:new Date().toISOString(),status:'running'};
      report.phases.push(phase); await json(reportFile,report);
      try {
        const directory = path.join(output,item.id);
        Object.assign(phase,item.tests ? await nativeCheck(item,device,directory,identity)
          : await storeCapture(item,device,directory,output,identity));
        phase.status = 'passed';
      } catch (error) {
        phase.status = 'failed'; phase.error = error.message;
        throw error;
      } finally {
        phase.finishedAt = new Date().toISOString();
        await json(reportFile,report);
        xcrun('simctl','shutdown',udid);
      }
    }
    const finalIdentity = await sourceIdentity();
    assert.deepEqual(finalIdentity,identity,'Source files and committed bundle must stay unchanged throughout evidence capture.');
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.error = error.message;
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    await json(reportFile,report);
    // Only devices created by this run; never touch pre-existing simulators.
    for (const device of created) {
      try { xcrun('simctl','shutdown',device.udid); } catch { /* Already shut down. */ }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
