/* Service worker: deja el juego instalado y jugable sin conexión */
const CACHE='defensores-v14';
const NAMES=['maui','sabana','shiro','gato','buddy','cazador','emma','oscar','corzo','serpiente','conejo','jabali','cuervo','erizo','moto','zorro','labrego','mongolo'];
const PORTRAITS=['maui','sabana','buddy','gato','shiro','oscar','emma','labrego','cazador','moto','mongolo'];
const SOUNDS=['escopeta','rifle','explosion','cuervo','jabali','moto','tractor','musica','tension','granja','ladrido','ladrido2','ladrido3','ladrido_shiro','maullido1','maullido2','sacho','punetazo'];
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png',
  'js/meta.js','js/decor.js','js/audio.js','js/art.js','js/data.js','js/engine.js','js/ui.js',
  ...NAMES.map(n=>'assets/'+n+'.png'),'assets/decor.png',...PORTRAITS.map(n=>'assets/portraits/'+n+'.png')];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(async c=>{
    await c.addAll(CORE);
    // los sonidos se guardan uno a uno: si alguno falla, el juego se instala igual
    await Promise.all(SOUNDS.map(s=>c.add('assets/sonidos/'+s+'.mp3').catch(()=>{})));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function ranged(req,res){
  const m=/bytes=(\d+)-(\d*)/.exec(req.headers.get('range')||'');if(!m)return res;
  const buf=await res.arrayBuffer(),start=+m[1],end=m[2]?Math.min(+m[2],buf.byteLength-1):buf.byteLength-1;
  return new Response(buf.slice(start,end+1),{status:206,statusText:'Partial Content',headers:{
    'Content-Type':res.headers.get('Content-Type')||'audio/mpeg','Content-Range':`bytes ${start}-${end}/${buf.byteLength}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const hit=await cache.match(req.url,{ignoreSearch:true});
    const heavy=/\.(mp3|png)$/.test(new URL(req.url).pathname);
    // imágenes y sonidos: primero caché; código y páginas: primero red (para recibir actualizaciones)
    if(hit&&heavy)return req.headers.has('range')?ranged(req,hit):hit;
    try{
      const res=await fetch(req);
      if(res.ok&&res.status===200)cache.put(req.url,res.clone());
      return res;
    }catch(err){return hit||Response.error();}
  })());
});
