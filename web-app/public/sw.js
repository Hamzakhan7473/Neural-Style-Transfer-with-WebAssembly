const CACHE_NAME = 'neural-style-transfer-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/wasm/neural_style_transfer_core_bg.wasm',
  '/wasm/neural_style_transfer_core.js',
  '/styles/van-gogh-preview.jpg',
  '/styles/picasso-preview.jpg',
  '/styles/cyberpunk-preview.jpg',
  '/styles/watercolor-preview.jpg',
  '/styles/oil-painting-preview.jpg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle WASM files with special caching
  if (url.pathname.endsWith('.wasm')) {
    event.respondWith(handleWasmRequest(request));
    return;
  }

  // Handle model files with dynamic caching
  if (url.pathname.startsWith('/models/')) {
    event.respondWith(handleModelRequest(request));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(handleNetworkFirst(request));
});

async function handleWasmRequest(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Error handling WASM request:', error);
    // Return a fallback response if available
    const fallbackResponse = await caches.match('/wasm/neural_style_transfer_core_bg.wasm');
    if (fallbackResponse) {
      return fallbackResponse;
    }
    throw error;
  }
}

async function handleModelRequest(request) {
  try {
    // Try network first for model files
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the model file
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Error handling model request:', error);
    // Try to serve from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function handleStaticRequest(request) {
  try {
    // Try cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Error handling static request:', error);
    throw error;
  }
}

async function handleNetworkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network request failed, trying cache:', error);
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'style-transfer-sync') {
    event.waitUntil(handleStyleTransferSync());
  }
});

async function handleStyleTransferSync() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify clients about sync completion
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Error in background sync:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'Neural Style Transfer is ready!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Neural Style Transfer', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll()
      .then((clients) => {
        // Focus existing client or open new one
        for (const client of clients) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

