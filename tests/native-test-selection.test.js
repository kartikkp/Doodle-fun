import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {nativeTestSourcePaths, indexNativeTests, validateNativeTestSelection, nativeTestSelections} from '../scripts/native-test-selection.mjs';
import {ACTIVITY_MODES} from '../catalog.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const sources = await Promise.all(nativeTestSourcePaths().map(async file =>
  ({file, source:await readFile(path.join(root, 'ios', file), 'utf8')})
));
const full = indexNativeTests(sources);
const workflow = await readFile(path.join(root, '.github/workflows/qa.yml'), 'utf8');
function workflowJob(id) {
  const match = workflow.match(new RegExp(`^  ${id}:\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9-]*:|$(?![\\s\\S]))`, 'm'));
  assert.ok(match, `The ${id} job exists`);
  return match[1];
}

test('hosted native shards cover every integration case once and keep all seven trusted audio cases', () => {
  const native = workflowJob('iphone-build');
  const groups = [...native.matchAll(/^ {10}- group: ([^\n]+)\n {12}selections: >-\n((?: {14}--only [^\n]+\n)+)/gm)];
  assert.equal(groups.length, 2);
  assert.equal(new Set(groups.map(group => group[1])).size, 2);
  const cases = groups.map(([, name, text]) => {
    const args = text.trim().split(/\s+/), selections = nativeTestSelections(args, full);
    assert.equal(args.length, selections.length * 2, `${name} contains only explicit test selections`);
    return selections.flatMap(({flag, selection}) => {
      assert.equal(flag, '--only');
      const [target, suite, method] = selection.split('/');
      assert.equal(target, 'DoodleFunTests'); assert.equal(method, undefined);
      return [...full.get(target).get(suite)].map(test => `${target}/${suite}/${test}`);
    });
  });
  assert.deepEqual(cases.map(group => group.length), [170, 151]);
  const selected = cases.flat();
  const expected = [...full.get('DoodleFunTests')].flatMap(([suite, methods]) =>
    [...methods].map(method => `DoodleFunTests/${suite}/${method}`));
  assert.equal(new Set(selected).size, selected.length, 'Native shards must not overlap');
  assert.deepEqual([...selected].sort(), expected.sort(), 'No age, bridge, parent or layout case may be dropped');
  assert.match(native, /fail-fast: false/);
  assert.match(native, /-configuration Release -sdk iphonesimulator/);
  assert.match(native, /DOODLE_NATIVE_SELECTIONS: \$\{\{ matrix\.selections \}\}/);
  assert.match(native, /"\$\{native_selections\[@\]\}"/);
  assert.match(native, /name: iphone-native-qa-report-\$\{\{ matrix\.group \}\}/);
  assert.match(native, /if: always\(\)/, 'Cancellation must retain native evidence');

  const audio = workflowJob('iphone-audio');
  const audioSelections = [...audio.matchAll(/--only (DoodleFunUITests\/\w+\/\w+)/g)].map(match => match[1]);
  const expectedAudio = [...full.get('DoodleFunUITests').get('ActivityCatalogUITests')]
    .filter(method => method.startsWith('testTrusted')).map(method => `DoodleFunUITests/ActivityCatalogUITests/${method}`);
  assert.equal(expectedAudio.length, 7);
  assert.equal(new Set(audioSelections).size, 7);
  assert.deepEqual(audioSelections.sort(), expectedAudio.sort());
  for (const selection of audioSelections) validateNativeTestSelection(selection, full);
  assert.match(audio, /--without-gameplay/);
  assert.match(audio, /timeout-minutes: 20/);
  assert.match(audio, /if: always\(\)/);
});

test('hosted browser matrix runs every configured browser once and retains cancelled-run evidence', async () => {
  const {default: config} = await import('../playwright.config.js');
  const browser = workflowJob('activities');
  const matrix = browser.match(/browser: \[([^\]]+)\]/);
  assert.ok(matrix);
  const projects = matrix[1].split(',').map(name => name.trim());
  assert.equal(new Set(projects).size, projects.length);
  assert.deepEqual(projects.sort(), config.projects.map(project => project.name).sort());
  assert.match(browser, /fail-fast: false/);
  assert.match(browser, /npx playwright install --with-deps \$\{\{ matrix\.browser \}\}/);
  assert.match(browser, /npm run test:browser -- --project=\$\{\{ matrix\.browser \}\}/);
  assert.match(browser, /name: activity-qa-report-\$\{\{ matrix\.browser \}\}/);
  assert.match(browser, /if: failure\(\) \|\| cancelled\(\)/);
});

test('real Swift inventory indexes each test under its declared target and class', () => {
  assert.deepEqual([...full.keys()], ['DoodleFunTests', 'DoodleFunUITests']);
  assert.equal(full.get('DoodleFunTests').get('NativeBridgeTests').size, 9);
  assert.equal(full.get('DoodleFunTests').get('NativeParentGateTests').size, 5);
  for (let age = 2; age <= 10; age++) {
    const methods=full.get('DoodleFunTests').get(`NativeGameplayAge${String(age).padStart(2, '0')}Tests`);
    const gameplayModes=ACTIVITY_MODES.filter(mode=>mode.engine!=='listening');
    assert.equal(gameplayModes.length,34);assert.equal(methods.size,gameplayModes.length);
    for(const mode of gameplayModes){const method='test'+mode.id.split('-').map(part=>part[0].toUpperCase()+part.slice(1)).join('');assert.equal(methods.has(method),true,`${mode.id} age ${age} is a selectable native case`);}
  }
  assert.equal(full.get('DoodleFunTests').get('NativeLayoutTests').size, 1);
  assert.deepEqual([...full.get('DoodleFunUITests')].map(([name, methods]) => [name, methods.size]), [
    ['DoodleFunUITests', 4], ['ActivityCatalogUITests', 13], ['DrawingRecoveryUITests', 3], ['TracingGestureUITests', 3],
  ]);
  assert.equal(full.get('DoodleFunTests').has('NativeGameplayCase'), false, 'A helper-only base is not a runnable suite.');
});

test('studio-only preparation compiles the fixture and selects exactly four studios at all nine ages',async()=>{
  const temp=await mkdtemp(path.join(tmpdir(),'doodle-native-studios-'));
  const output=path.join(temp,'prepared');
  const projectPath=path.join(root,'ios/DoodleFun.xcodeproj/project.pbxproj'),original=await readFile(projectPath);
  try{
    const result=spawnSync(process.execPath,['scripts/run-iphone-qa.mjs','--prepare-only','--studio-only','--output',output],{cwd:root,encoding:'utf8',timeout:30000});
    assert.equal(result.error,undefined);assert.equal(result.status,0,result.stderr);
    const metadata=JSON.parse(await readFile(path.join(output,'qa-build.json'),'utf8'));
    assert.equal(metadata.testSelections.length,36);
    assert.equal(new Set(metadata.testSelections.map(item=>item.selection)).size,36);
    for(let age=2;age<=10;age++)for(const method of ['testMirrorMosaic','testBalanceLab','testMeasurePour','testBeatMaker'])assert.ok(metadata.testSelections.some(item=>item.flag==='--only'&&item.selection===`DoodleFunTests/NativeGameplayAge${String(age).padStart(2,'0')}Tests/${method}`));
    assert.match(metadata.fixtureSHA256,/^[a-f0-9]{64}$/);
    const fixture=await readFile(path.join(output,'project/ios/DoodleFunTests/NativeBridgeTests.swift'),'utf8');
    assert.match(fixture,/enum NativeQAFixtures/);assert.match(fixture,/func testBeatMaker\(\)/);
    assert.deepEqual(await readFile(projectPath),original,'Preparation preserves the source signing project');
  }finally{await rm(temp,{recursive:true,force:true});}
});

test('target, class, and exact method selections accept every included test', () => {
  for (const [target, classes] of full) {
    assert.equal(validateNativeTestSelection(target, full), target);
    for (const [suite, methods] of classes) {
      assert.equal(validateNativeTestSelection(`${target}/${suite}`, full), `${target}/${suite}`);
      for (const method of methods) {
        for (const suffix of ['', '()']) {
          const selection = `${target}/${suite}/${method}${suffix}`;
          assert.equal(validateNativeTestSelection(selection, full), selection);
        }
      }
    }
  }
});

test('known bare names cannot validate an incorrect target or class', () => {
  for (const selection of [
    'DoodleFunUITests/ActivityCatalogUITests/testDraw',
    'DoodleFunUITests/NativeGameplayAge02Tests/testDraw',
    'DoodleFunTests/ActivityCatalogUITests/testAge2PortraitCatalog',
    'DoodleFunTests/NativeBridgeTests/testLandscapeSafeAreasAndLowerActivityControls',
    'DoodleFunUITests/ActivityCatalogUITests/testAge10Portrait',
    'DoodleFunUITests/TypoClass',
    'UnknownTarget',
    'DoodleFunTests/NativeGameplayCase',
  ]) assert.throws(() => validateNativeTestSelection(selection, full), /Unknown|excluded/, selection);
});

test('missing, empty, malformed and overlong selections are rejected', () => {
  for (const selection of [undefined, '', '/', '/DoodleFunTests', 'DoodleFunTests/',
    'DoodleFunTests//testDraw', 'DoodleFunTests/NativeBridgeTests/',
    'DoodleFunTests/NativeBridgeTests/testRouteMessagesAreBounded/extra',
    'DoodleFunTests/NativeBridgeTests/testRouteMessagesAreBounded()()',
    'DoodleFunTests()', 'DoodleFunTests/NativeBridgeTests()', ' DoodleFunTests',
    'DoodleFunTests/NativeBridgeTests/test.*',
  ]) assert.throws(() => validateNativeTestSelection(selection, full), /required|Invalid/, String(selection));
});

test('without gameplay excludes all gameplay and layout filters while keeping both real test targets', () => {
  const included = new Set(nativeTestSourcePaths({withoutGameplay:true}));
  const index = indexNativeTests(sources.filter(({file}) => included.has(file)));
  assert.deepEqual([...index.get('DoodleFunTests')].map(([name, methods]) => [name, methods.size]), [
    ['NativeBridgeTests', 9], ['NativeParentGateTests', 5],
  ]);
  assert.equal(validateNativeTestSelection('DoodleFunTests', index), 'DoodleFunTests');
  assert.equal(validateNativeTestSelection('DoodleFunUITests/ActivityCatalogUITests/testAge6LandscapeCatalog', index),
    'DoodleFunUITests/ActivityCatalogUITests/testAge6LandscapeCatalog');
  for (const selection of [
    'DoodleFunTests/NativeGameplayAge02Tests',
    'DoodleFunTests/NativeGameplayAge02Tests/testDraw',
    'DoodleFunTests/NativeLayoutTests/testLandscapeSafeAreasAndLowerActivityControls',
  ]) assert.throws(() => validateNativeTestSelection(selection, index), /Unknown or excluded/, selection);
});

test('argument parsing validates only and skip filters equally and preserves their order', () => {
  const selections = nativeTestSelections([
    '--device', 'example', '--only', 'DoodleFunTests', '--skip', 'DoodleFunTests/NativeBridgeTests',
    '--only', 'DoodleFunUITests/TracingGestureUITests/testAgeTwoTrustedTracingRejectsTapAndCompletesBothStrokes()',
  ], full);
  assert.deepEqual(selections, [
    {flag:'--only', selection:'DoodleFunTests'},
    {flag:'--skip', selection:'DoodleFunTests/NativeBridgeTests'},
    {flag:'--only', selection:'DoodleFunUITests/TracingGestureUITests/testAgeTwoTrustedTracingRejectsTapAndCompletesBothStrokes()'},
  ]);
  for (const flag of ['--only', '--skip']) {
    assert.throws(() => nativeTestSelections([flag], full), /required/);
    assert.throws(() => nativeTestSelections([flag, ''], full), /required/);
    assert.throws(() => nativeTestSelections([flag, '--build-only'], full), /required/);
    assert.throws(() => nativeTestSelections([flag, 'DoodleFunUITests/ActivityCatalogUITests/testDraw'], full), /Unknown native test method/);
  }
});

test('runner rejects invalid and excluded selections before copying or changing project files', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'doodle-native-selection-'));
  const projectPath = path.join(root, 'ios/DoodleFun.xcodeproj/project.pbxproj');
  const original = await readFile(projectPath);
  try {
    const cases = [
      ['--only', 'DoodleFunUITests/ActivityCatalogUITests/testDraw'],
      ['--skip', 'DoodleFunUITests/TypoClass'],
      ['--without-gameplay', '--only', 'DoodleFunTests/NativeGameplayAge02Tests/testDraw'],
      ['--without-gameplay','--studio-only'],
    ];
    for (const [i, args] of cases.entries()) {
      const output = path.join(temp, `invalid-${i}`);
      const result = spawnSync(process.execPath, ['scripts/run-iphone-qa.mjs', '--prepare-only', '--output', output, ...args],
        {cwd:root, encoding:'utf8', timeout:10_000});
      assert.equal(result.error, undefined);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Unknown (?:native test method|or excluded native test class)|--studio-only requires the native gameplay fixture/);
      await assert.rejects(access(output), {code:'ENOENT'});
    }
    assert.deepEqual(await readFile(projectPath), original);
  } finally {
    await rm(temp, {recursive:true, force:true});
  }
});
