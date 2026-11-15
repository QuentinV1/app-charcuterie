const CACHE_NAME = 'laffinoir-v7';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './modules/catalog.js',
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
      // Force le téléchargement réseau sans utiliser l'éventuel cache HTTP intermédiaire
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

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
