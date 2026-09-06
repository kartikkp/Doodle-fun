const CACHE='doodle-fun-offline-387b68987e207d18';
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
