/* Service worker mínimo: guarda los 5 archivos del juego para jugar sin conexión */
const CACHE='defensores-pack-202611200127';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  // primero lo guardado (arranque inmediato, también sin conexión); en segundo plano se busca una versión nueva
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(res=>{if(res.ok)c.put(req,res.clone());return res;}).catch(()=>hit||c.match('index.html'));
    return hit||net;}));
});
