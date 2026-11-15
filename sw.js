/* Solo borra caches de su propio ambiente: QA y produccion comparten dominio.
   MichiFit v3.3 (qa) · service worker: funciona sin internet.
   v3.3: index.html se pide siempre sin cache (cache: 'no-store') para recibir versiones nuevas al instante. */
var VERSION = 'michifit-qa-v3-3-2026-11-15';
var BASE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'fonts/jakarta-400.woff2', 'fonts/jakarta-500.woff2', 'fonts/jakarta-600.woff2', 'fonts/jakarta-700.woff2', 'fonts/jakarta-800.woff2', 'fonts/outfit-500.woff2', 'fonts/outfit-600.woff2', 'fonts/outfit-700.woff2', 'fonts/outfit-800.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k.indexOf('michifit-qa-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  // Paginas: primero internet SIN cache (version nueva al instante); si no hay internet, la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put('index.html', copy); }); }
      return res;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  // Resto (iconos, fuentes): primero la copia guardada
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
