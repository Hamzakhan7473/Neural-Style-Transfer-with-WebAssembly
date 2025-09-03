// www/service-worker.js - Simple but effective service worker

const CACHE_NAME = 'neural-style-transfer-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const MODEL_CACHE = 'models-v1.0.0';

// Core files to cache immediately
const CORE_FILES = [
    './',
    './index.html',
    './style.css', 
    './app.js',
    './pkg/neural_style_transfer.js',
    './pkg/neural_style_transfer_bg.wasm'
];

// External CDN resources
const CDN_FILES = [
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort.webgpu.min.js',
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort.wasm'
];

// ONNX model files (large, cache on-demand)
const MODEL_FILES = [
    './models/mosaic-9.onnx',
    './models/candy-9.onnx', 
    './models/rain-princess-9.onnx',
    './models/udnie-9.onnx',
    './models/pointilism-9.onnx'
];

// Install event - cache core files
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[ServiceWorker] Caching core files');
            return Promise.all([
                cache.addAll(CORE_FILES),
                // Try to cache CDN files, but don't fail if unavailable
                cache.addAll(CDN_FILES).catch(err => {
                    console.warn('[ServiceWorker] CDN caching failed:', err);
                })
            ]);
        })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        Promise.all([
            // Take control of all pages
            self.clients.claim(),
            
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== MODEL_CACHE && 
                            cacheName !== CACHE_NAME) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Handle different types of requests
        if (url.pathname.endsWith('.onnx')) {
            return await handleModelRequest(request);
        } else if (isCoreFile(request.url)) {
            return await handleCoreRequest(request);
        } else if (isCDNRequest(request.url)) {
            return await handleCDNRequest(request);
        } else {
            return await handleNetworkFirst(request);
        }
    } catch (error) {
        console.error('[ServiceWorker] Fetch error:', error);
        return fetch(request);
    }
}

// Handle ONNX model requests (cache-first strategy)
async function handleModelRequest(request) {
    const modelCache = await caches.open(MODEL_CACHE);
    const cachedResponse = await modelCache.match(request);
    
    if (cachedResponse) {
        console.log('[ServiceWorker] Serving model from cache:', request.url);
        return cachedResponse;
    }
    
    try {
        console.log('[ServiceWorker] Fetching and caching model:', request.url);
        const response = await fetch(request);
        
        if (response.ok) {
            // Clone the response before caching
            const responseToCache = response.clone();
            await modelCache.put(request, responseToCache);
        }
        
        return response;
    } catch (error) {
        console.error('[ServiceWorker] Model fetch failed:', error);
        throw error;
    }
}

// Handle core application files (cache-first strategy)
async function handleCoreRequest(request) {
    const staticCache = await caches.open(STATIC_CACHE);
    const cachedResponse = await staticCache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Fallback to network
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache successful responses
            const responseToCache = response.clone();
            await staticCache.put(request, responseToCache);
        }
        
        return response;
    } catch (error) {
        console.error('[ServiceWorker] Core file fetch failed:', error);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlineResponse = await staticCache.match('./index.html');
            if (offlineResponse) {
                return offlineResponse;
            }
        }
        
        throw error;
    }
}

// Handle CDN requests (cache-first with long TTL)
async function handleCDNRequest(request) {
    const staticCache = await caches.open(STATIC_CACHE);
    const cachedResponse = await staticCache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache CDN files for longer
            const responseToCache = response.clone();
            await staticCache.put(request, responseToCache);
        }
        
        return response;
    } catch (error) {
        console.warn('[ServiceWorker] CDN fetch failed:', request.url, error);
        throw error;
    }
}

// Handle other requests (network-first strategy)
async function handleNetworkFirst(request) {
    try {
        return await fetch(request);
    } catch (error) {
        // Try to serve from cache
        const staticCache = await caches.open(STATIC_CACHE);
        const cachedResponse = await staticCache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Helper functions
function isCoreFile(url) {
    return CORE_FILES.some(file => {
        const normalizedFile = file.startsWith('./') ? file.substring(2) : file;
        return url.endsWith(normalizedFile) || url.endsWith(file);
    });
}

function isCDNRequest(url) {
    return CDN_FILES.some(cdnUrl => url.includes(cdnUrl) || url === cdnUrl);
}

// Handle background sync for model preloading (future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'preload-models') {
        console.log('[ServiceWorker] Background sync: preloading models');
        event.waitUntil(preloadPopularModels());
    }
});

async function preloadPopularModels() {
    const modelCache = await caches.open(MODEL_CACHE);
    
    // Preload most popular models (mosaic and candy)
    const popularModels = [
        './models/mosaic-9.onnx',
        './models/candy-9.onnx'
    ];
    
    for (const modelUrl of popularModels) {
        try {
            const cached = await modelCache.match(modelUrl);
            if (!cached) {
                console.log('[ServiceWorker] Preloading model:', modelUrl);
                const response = await fetch(modelUrl);
                if (response.ok) {
                    await modelCache.put(modelUrl, response);
                }
            }
        } catch (error) {
            console.warn('[ServiceWorker] Failed to preload model:', modelUrl, error);
        }
    }
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'New style available!',
            icon: './icon-192.png',
            badge: './badge-72.png',
            tag: 'style-transfer-update',
            requireInteraction: false
        };
        
        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Neural Style Transfer', 
                options
            )
        );
    } catch (error) {
        console.error('[ServiceWorker] Push notification error:', error);
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Focus existing window or open new one
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});

// Periodic cache cleanup
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAN_CACHE') {
        event.waitUntil(cleanupOldCaches());
    }
});

async function cleanupOldCaches() {
    console.log('[ServiceWorker] Running cache cleanup...');
    
    const cacheNames = await caches.keys();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const cacheName of cacheNames) {
        if (cacheName.includes('models-')) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            
            for (const request of keys) {
                const response = await cache.match(request);
                if (response) {
                    const dateHeader = response.headers.get('date');
                    if (dateHeader && new Date(dateHeader).getTime() < oneWeekAgo) {
                        console.log('[ServiceWorker] Removing old cached file:', request.url);
                        await cache.delete(request);
                    }
                }
            }
        }
    }
}

console.log('[ServiceWorker] Loaded and ready');
