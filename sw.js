const C = 'consultorio-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red primero (las mejoras llegan al abrir con internet) y caché como respaldo sin conexión.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(r => {
        if (r && r.ok) {
          const copy = r.clone();
          caches.open(C).then(c => c.put(req, copy));
        }
        return r;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
