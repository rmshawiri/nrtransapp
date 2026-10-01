const CACHE='nr-trans-shell-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./core.js','./storage.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./diagnostic.html','./diagnostic.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nr-trans-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));});
