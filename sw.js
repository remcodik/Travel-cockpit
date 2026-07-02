// ═══════════════════════════════════════════════════════════
// sw.js — App-shell caching (N1)
// Firestore-data cachet al lokaal (enablePersistence in js/firebase.js),
// maar de app zelf (HTML/CSS/JS) had geen eigen cache-strategie — zonder
// bereik (Noorse fjorden/bergen) kon de pagina zelf niet laden.
//
// Network-first, niet cache-first: deze app krijgt bijna dagelijks
// bugfixes, dus altijd de nieuwste versie proberen te halen als er
// internet is, pas bij een mislukt verzoek terugvallen op de cache.
// Cache-versie ophogen bij een merge die JS/CSS/HTML aanpast.
// ═══════════════════════════════════════════════════════════

const CACHE_VERSION = 'v1';
const CACHE_NAME = `travel-cockpit-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/firebase.js',
  '/js/data.js',
  '/js/gps.js',
  '/js/offline.js',
  '/js/state.js',
  '/js/topo.js',
  '/js/weather.js',
  '/js/charging.js',
  '/js/navigation.js',
  '/js/screen-home.js',
  '/js/screen-map.js',
  '/js/screen-planning.js',
  '/js/screen-discover.js',
  '/js/screen-accommodation.js',
  '/js/screen-roadtrip.js',
  '/js/screen-tickets.js',
  '/js/export.js',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(err => console.error('SW install — precache mislukt:', err))
  );
  // Bewust GEEN skipWaiting() hier — de gebruiker bepaalt zelf wanneer
  // een nieuwe versie wordt geactiveerd, via de update-banner in
  // js/offline.js (voorkomt dat een actieve sessie onderbroken wordt).
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Alleen eigen, statische app-shell-bestanden cachen — nooit /api/*
  // (altijd vers nodig, dat zijn de AI/laadstations-proxy's) en nooit
  // cross-origin (Firebase/Leaflet/Open-Meteo/etc.), die blijven precies
  // werken zoals zonder Service Worker.
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(networkResponse => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        return networkResponse;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
  );
});
