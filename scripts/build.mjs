import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ACTIVITIES} from '../catalog.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({absWorkingDir:root,entryPoints:['app.js'],bundle:true,write:false,format:'iife',target:['safari15','chrome100'],minify:true,legalComments:'none'});
let html=await readFile(new URL('../app-shell.html',import.meta.url),'utf8');
const publicPages = ['privacy.html', 'support.html'];
const privacy = await readFile(new URL('../privacy.html',import.meta.url),'utf8');
const policy = privacy.match(/<article id="privacy-policy-content">([\s\S]*?)<\/article>/)?.[1];
if (!policy || !html.includes('<!-- EMBED_PRIVACY_POLICY -->')) throw new Error('The public privacy policy must also be included in the offline app.');
// Real hrefs expose browser context-menu/middle-click navigation outside our
// parent check. Preserve policy wording, but make its in-app actions buttons.
const embeddedPolicy=policy.replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g,
  '<button type="button" class="policy-external" data-external-url="$1">$2</button>');
if (/<a\b/i.test(embeddedPolicy)) throw new Error('Every embedded policy link must use a gated button.');
html=html.replace('<!-- EMBED_PRIVACY_POLICY -->', () => embeddedPolicy);
const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)];
for(const [,file] of styles)html=html.replace(`<link rel="stylesheet" href="${file}">`,`<style>${await readFile(new URL('../'+file,import.meta.url),'utf8')}</style>`);
const icon=await readFile(new URL('../icon.svg',import.meta.url),'utf8');
html=html.replace('href="icon.svg"',`href="data:image/svg+xml,${encodeURIComponent(icon)}"`);
html=html.replace('<script type="module" src="app.js"></script>','');
// Inline all game code so file:// use and first-entry play do not require a server.
html=html.replace('</body>',()=>`<script>${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>\n</body>`);
const publicContents=await Promise.all(publicPages.map(file=>readFile(new URL('../'+file,import.meta.url))));
const versionHash=createHash('sha256').update(html);
for(const page of publicContents) versionHash.update(page);
const version=versionHash.digest('hex').slice(0,16);
html=html.replace('</head>',`<meta name="doodle-build" content="${version}">\n</head>`);
const output=new URL('../dist/',import.meta.url);await mkdir(output,{recursive:true});
await writeFile(new URL('index.html',output),html);
for (const [i,file] of publicPages.entries()) await writeFile(new URL(file,output),publicContents[i]);
const worker=`const CACHE='doodle-fun-offline-${version}';
const HOME=new URL('./',self.location.href).href;
const PAGES=['privacy.html','support.html'].map(path=>new URL(path,HOME).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.add(new Request(HOME,{cache:'reload'}));
  // Older deployments may not have these documents yet. The app itself must
  // still install offline, and its privacy policy is embedded in HOME.
  await Promise.all(PAGES.map(url=>cache.add(new Request(url,{cache:'reload'})).catch(()=>{})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('doodle-fun-offline-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);url.hash='';url.search='';
  const known=url.href===HOME||url.href===new URL('index.html',HOME).href||PAGES.includes(url.href);
  if(event.request.mode!=='navigate'||!known)return;
  event.respondWith((async()=>{
    try{const response=await fetch(event.request);if(response.ok)return response;}catch{}
    const key=PAGES.includes(url.href)?url.href:HOME;
    return (await (await caches.open(CACHE)).match(key)) || new Response('This page is not available offline yet. Open Privacy or Help inside Doodle Fun.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  })());
});
`;
await writeFile(new URL('sw.js',output),worker);
// GitHub Pages also serves the repository root in its existing branch-based
// configuration. Publish the same tested bundle there without changing Pages.
await writeFile(new URL('../index.html',import.meta.url),html);
await writeFile(new URL('../sw.js',import.meta.url),worker);
console.log(`Built standalone Doodle Fun (${version}): ${Math.round(Buffer.byteLength(html)/1024)} KB, all ${ACTIVITIES.length} activities included.`);
