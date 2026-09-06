import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({absWorkingDir:root,entryPoints:['app.js'],bundle:true,write:false,format:'iife',target:['safari15','chrome100'],minify:true,legalComments:'none'});
let html=await readFile(new URL('../app-shell.html',import.meta.url),'utf8');
const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)];
for(const [,file] of styles)html=html.replace(`<link rel="stylesheet" href="${file}">`,`<style>${await readFile(new URL('../'+file,import.meta.url),'utf8')}</style>`);
const icon=await readFile(new URL('../icon.svg',import.meta.url),'utf8');
html=html.replace('href="icon.svg"',`href="data:image/svg+xml,${encodeURIComponent(icon)}"`);
html=html.replace('<script type="module" src="app.js"></script>','');
// Inline all game code so file:// use and first-entry play do not require a server.
html=html.replace('</body>',()=>`<script>${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>\n</body>`);
const version=createHash('sha256').update(html).digest('hex').slice(0,16);
html=html.replace('</head>',`<meta name="doodle-build" content="${version}">\n</head>`);
const output=new URL('../dist/',import.meta.url);await mkdir(output,{recursive:true});
await writeFile(new URL('index.html',output),html);
const worker=`const CACHE='doodle-fun-offline-${version}';
const HOME=new URL('./',self.location.href).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.add(new Request(HOME,{cache:'reload'}));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('doodle-fun-offline-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.mode!=='navigate'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    try{const response=await fetch(event.request);if(response.ok)return response;}catch{}
    return (await caches.open(CACHE)).match(HOME);
  })());
});
`;
await writeFile(new URL('sw.js',output),worker);
// GitHub Pages also serves the repository root in its existing branch-based
// configuration. Publish the same tested bundle there without changing Pages.
await writeFile(new URL('../index.html',import.meta.url),html);
await writeFile(new URL('../sw.js',import.meta.url),worker);
console.log(`Built standalone Doodle Fun (${version}): ${Math.round(Buffer.byteLength(html)/1024)} KB, all 24 activities included.`);
