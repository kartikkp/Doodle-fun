import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {nativeTestSourcePaths, indexNativeTests, validateNativeTestSelection, nativeTestSelections} from '../scripts/native-test-selection.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sources = await Promise.all(nativeTestSourcePaths().map(async file =>
  ({file, source:await readFile(path.join(root, 'ios', file), 'utf8')})
));
const full = indexNativeTests(sources);

test('real Swift inventory indexes each test under its declared target and class', () => {
  assert.deepEqual([...full.keys()], ['DoodleFunTests', 'DoodleFunUITests']);
  assert.equal(full.get('DoodleFunTests').get('NativeBridgeTests').size, 7);
  assert.equal(full.get('DoodleFunTests').get('NativeParentGateTests').size, 4);
  for (let age = 2; age <= 10; age++) {
    assert.equal(full.get('DoodleFunTests').get(`NativeGameplayAge${String(age).padStart(2, '0')}Tests`).size, 30);
  }
  assert.equal(full.get('DoodleFunTests').get('NativeLayoutTests').size, 1);
  assert.deepEqual([...full.get('DoodleFunUITests')].map(([name, methods]) => [name, methods.size]), [
    ['DoodleFunUITests', 4], ['ActivityCatalogUITests', 6], ['DrawingRecoveryUITests', 3], ['TracingGestureUITests', 2],
  ]);
  assert.equal(full.get('DoodleFunTests').has('NativeGameplayCase'), false, 'A helper-only base is not a runnable suite.');
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
    ['NativeBridgeTests', 7], ['NativeParentGateTests', 4],
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
    ];
    for (const [i, args] of cases.entries()) {
      const output = path.join(temp, `invalid-${i}`);
      const result = spawnSync(process.execPath, ['scripts/run-iphone-qa.mjs', '--prepare-only', '--output', output, ...args],
        {cwd:root, encoding:'utf8', timeout:10_000});
      assert.equal(result.error, undefined);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Unknown (?:native test method|or excluded native test class)/);
      await assert.rejects(access(output), {code:'ENOENT'});
    }
    assert.deepEqual(await readFile(projectPath), original);
  } finally {
    await rm(temp, {recursive:true, force:true});
  }
});
