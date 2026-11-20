const CACHE_NAME = 'laffinoir-v14';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './version.json',
  './modules/firebase.js',
  './modules/catalog.js',
  './modules/salage.js',
  './modules/state.js',
  './modules/photos.js',
  './modules/calculateur.js',
  './modules/pesees.js',
  './modules/cave.js',
  './modules/evaluation.js',
  './modules/projets.js',
  './modules/recettes.js',
  './modules/planification.js',
  './modules/courses.js',
  './modules/revente.js',
  './modules/parametres.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(
        ASSETS.map((url) => new Request(url, { cache: 'reload' }))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Stratégie Network-First avec mise à jour du cache et fallback hors-ligne
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return;

  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  const networkRequest = e.request.mode === 'navigate'
    ? e.request
    : new Request(e.request, { cache: 'no-cache' });

  e.respondWith(
    fetch(networkRequest)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(e.request, { ignoreSearch: true });
        if (cached) return cached;
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return undefined;
      })
  );
});
