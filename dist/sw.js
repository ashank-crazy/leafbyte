const CACHE = 'leafbyte-shell-v3';
const SHELL = ['./', './index.html', './style.css', './app.js', './demo-packs.js', './engine.js', './export.js', './carbon.js', './vendor/co2js-0.19.0.js', './icon.svg', './manifest.webmanifest', './assets/samples.json', './assets/nasa-samples.json', './assets/hero.webp'];
// Fetch the multi-megabyte sample photos only after a visitor requests them.
const DEMO_ASSETS = [
  './evidence/assets/01-laptop-desk.jpg',
  './evidence/assets/02-creative-workspace.jpg',
  './evidence/assets/03-everyday-accessories.jpg',
  './evidence/assets/04-printed-mug.jpg',
  './evidence/assets/05-camera-components.jpg',
  './evidence/assets/15-coffee-red.jpg',
  './assets/earth.jpg', './assets/amazon.jpg', './assets/glacier.jpg', './assets/ocean.jpg',
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('leafbyte-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (DEMO_ASSETS.some(asset => new URL(asset, self.location.href).href === event.request.url)) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(hit => hit || Response.error())));
});
