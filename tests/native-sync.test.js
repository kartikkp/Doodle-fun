import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

async function fixture(t, html) {
  const root = await mkdtemp(join(tmpdir(), 'doodle-native-sync-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'scripts'));
  await copyFile(new URL('../scripts/sync-ios.mjs', import.meta.url), join(root, 'scripts/sync-ios.mjs'));
  await writeFile(join(root, 'index.html'), html);
  return root;
}

test('iOS sync copies the exact self-contained production page and records its identity', async t => {
  const html = '<meta name="doodle-build" content="0123456789abcdef"><script>window.ready=true</script>';
  const root = await fixture(t, html);
  execFileSync(process.execPath, [join(root, 'scripts/sync-ios.mjs')]);
  const resource = join(root, 'ios/DoodleFun/Resources');
  assert.equal(await readFile(join(resource, 'index.html'), 'utf8'), html);
  assert.deepEqual(JSON.parse(await readFile(join(resource, 'BundleManifest.json'), 'utf8')), {
    fingerprint: '0123456789abcdef', sha256: createHash('sha256').update(html).digest('hex'),
  });
});

test('iOS sync rejects an unbuilt source page or dependencies that would break offline launch', async t => {
  for (const html of [
    '<script src="app.js"></script>',
    '<meta name="doodle-build" content="0123456789abcdef"><script src="app.js"></script>',
    '<meta name="doodle-build" content="0123456789abcdef"><link rel="stylesheet" href="styles.css">',
  ]) {
    const root = await fixture(t, html);
    assert.throws(() => execFileSync(process.execPath, [join(root, 'scripts/sync-ios.mjs')], { stdio: 'pipe' }), /self-contained production build/);
  }
});
