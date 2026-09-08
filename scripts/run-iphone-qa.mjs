import {cp, mkdir, readFile, writeFile, appendFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = name => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const device = option('--device');
if (!device && !args.includes('--prepare-only')) {
  throw new Error('Supply --device <dedicated test simulator UDID>. This suite resets its app data.');
}
const output = path.resolve(option('--output') || path.join(root, 'test-results', 'iphone-native'));
if (output === root || !path.relative(path.join(root, 'ios'), output).startsWith('..')) throw new Error('Use a separate QA output directory.');
const project = path.join(output, 'project');
await mkdir(project, {recursive:true});
const sourceProject = path.join(root, 'ios', 'DoodleFun.xcodeproj', 'project.pbxproj');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const originalProjectHash = sha(await readFile(sourceProject));
const testSources = [
  'DoodleFunTests/NativeBridgeTests.swift', 'DoodleFunTests/NativeGameplayTests.swift',
  'DoodleFunUITests/DoodleFunUITests.swift', 'DoodleFunUITests/ActivityCatalogUITests.swift',
  'DoodleFunUITests/DrawingRecoveryUITests.swift', 'DoodleFunUITests/TracingGestureUITests.swift',
];
const testSourceSHA256 = Object.fromEntries(await Promise.all(testSources.map(async file =>
  [file, sha(await readFile(path.join(root, 'ios', file)))]
)));

// Work in a copy: Xcode signing settings and an already running app stay intact.
await cp(path.join(root, 'ios'), path.join(project, 'ios'), {
  recursive:true, force:true,
  filter:src => !src.split(path.sep).some(part => ['build','DerivedData','xcuserdata'].includes(part)),
});
const integrationFile = path.join(project, 'ios/DoodleFunTests/NativeBridgeTests.swift');
const uiFile = path.join(project, 'ios/DoodleFunUITests/DoodleFunUITests.swift');
let script = '';
if (!args.includes('--without-gameplay')) {
  const bundled = await build({
    entryPoints:[path.join(root, 'ios/DoodleFunTests/Fixtures/native-gameplay.js')],
    bundle:true, format:'iife', platform:'browser', target:'safari17', write:false,
  });
  script = bundled.outputFiles[0].text;
  const base64 = Buffer.from(script).toString('base64');
  await appendFile(integrationFile, '\n' + await readFile(path.join(root, 'ios/DoodleFunTests/NativeGameplayTests.swift'), 'utf8'));
  await appendFile(integrationFile, `\nenum NativeQAFixtures { static let script = String(data: Data(base64Encoded: "${base64}")!, encoding: .utf8)! }\n`);
}
for (const name of ['ActivityCatalogUITests.swift','DrawingRecoveryUITests.swift','TracingGestureUITests.swift']) {
  await appendFile(uiFile, '\n' + await readFile(path.join(root, 'ios/DoodleFunUITests', name), 'utf8'));
}
const manifest = JSON.parse(await readFile(path.join(root, 'ios/DoodleFun/Resources/BundleManifest.json'), 'utf8'));
await writeFile(path.join(output,'qa-build.json'), JSON.stringify({
  device, manifest, originalProjectHash, testSourceSHA256, fixtureSHA256:sha(script),
  preparedAt:new Date().toISOString(), project,
}, null, 2) + '\n');
if (sha(await readFile(sourceProject)) !== originalProjectHash) throw new Error('Original Xcode project changed during QA preparation.');
console.log(`Prepared isolated native QA for ${manifest.fingerprint}: ${project}`);
if (args.includes('--prepare-only')) process.exit(0);

const stamp = new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const action = args.includes('--build-only') ? 'build-for-testing' : 'test';
const command = [
  '-project', path.join(project,'ios/DoodleFun.xcodeproj'), '-scheme','DoodleFun',
  '-destination',`platform=iOS Simulator,id=${device}`,
  '-derivedDataPath',path.join(output,'DerivedData'),
  '-resultBundlePath',path.join(output,`run-${stamp}.xcresult`),
  '-parallel-testing-enabled','NO',
  'CODE_SIGNING_ALLOWED=NO', action,
];
for (let i=0;i<args.length;i++) {
  if (args[i] === '--only') command.push(`-only-testing:${args[++i]}`);
  if (args[i] === '--skip') command.push(`-skip-testing:${args[++i]}`);
}
await writeFile(path.join(output,'last-command.json'), JSON.stringify(['xcodebuild',...command],null,2)+'\n');
const child = spawn('caffeinate',['-i','xcodebuild',...command],{cwd:root,stdio:'inherit'});
child.on('error',error => { console.error(error); process.exitCode=1; });
child.on('exit',code => { process.exitCode=code ?? 1; });
