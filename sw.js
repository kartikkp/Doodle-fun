const CACHE='doodle-fun-offline-eff5063732721817';
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
