const CACHE_NAME = 'style-transfer-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './main.js',
  './styles.json',
  './sw.js'
];

// Cache core assets on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
  );
});

// Serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Core app files: cache first
  if (CORE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
    return;
  }
  
  // Models and WASM: network first, then cache
  if (url.pathname.startsWith('/models/') || url.pathname.startsWith('/pkg/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Other requests: network first
  event.respondWith(fetch(event.request));
});
