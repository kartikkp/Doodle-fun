import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Run after npm run build. Native builds always contain the same offline page.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const fingerprint = html.match(/<meta name="doodle-build" content="([a-f0-9]{16})"/i)?.[1];
if (!fingerprint || /<script\b[^>]*\bsrc\s*=/i.test(html) || /<link\b[^>]*rel=["']stylesheet["']/i.test(html)) {
  throw new Error('index.html must be a self-contained production build. Run npm run build first.');
}
const resources = path.join(root, 'ios', 'DoodleFun', 'Resources');
await mkdir(resources, { recursive: true });
await writeFile(path.join(resources, 'index.html'), html);
await writeFile(path.join(resources, 'BundleManifest.json'), `${JSON.stringify({ fingerprint, sha256: createHash('sha256').update(html).digest('hex') }, null, 2)}\n`);
console.log(`Synced offline iOS bundle ${fingerprint}`);
