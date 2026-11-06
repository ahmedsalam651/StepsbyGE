const CACHE = 'khatwati-v52';
const FILES = ['./index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './enhancements.js', './history.js', './features.js', './focus.js', './study.js', './study-mode.js', './ui.js', './widget.html', './quran.html'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && key !== FONT_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
const FONT_CACHE = 'khatwati-fonts';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const u = new URL(event.request.url);
  if (!FONT_HOSTS.includes(u.hostname)) return;
  // fonts: serve from cache instantly, refresh in the background, so the app keeps its font offline
  event.respondWith(caches.open(FONT_CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    const network = fetch(event.request).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(event.request, r.clone()); return r; }).catch(() => cached || Response.error());
    return cached || network;
  }));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
        return response;
      } catch { return (await caches.match(event.request)) || (await caches.match('./index.html')); }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  })));
});