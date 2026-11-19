const CACHE_NAME = 'veda-astrolight-jataka-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Google Sheet ಲೈಸೆನ್ಸ್ ಪರಿಶೀಲನೆಯನ್ನು ಎಂದಿಗೂ ಕ್ಯಾಶ್ ಮಾಡಬಾರದು (ಸದಾ ಲೈವ್ ಡೇಟಾ ಬರಬೇಕು)
  if (event.request.url.includes('docs.google.com/spreadsheets')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-First ತಂತ್ರ: ಇಂಟರ್ನೆಟ್ ಇದ್ದಾಗ ಹೊಸ ಫೈಲ್ ತರುತ್ತದೆ, ಇಲ್ಲದಿದ್ದಾಗ ಕ್ಯಾಶ್‌ನಿಂದ ತೆರೆಯುತ್ತದೆ
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
