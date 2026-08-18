/**
 * CampusCart - Progressive Web App Service Worker
 * Version: 1.0.0
 */

const CACHE_VERSION = 'campuscart-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Core assets to pre-cache during installation
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/badge-72x72.svg',
];

// Max items for dynamic image cache
const MAX_IMAGE_CACHE_ITEMS = 60;

async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      trimCache(cacheName, maxItems);
    }
  } catch (err) {
    // Ignore trim errors
  }
}

// 1. Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Use individual caching to prevent one failed item from failing entire install
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn(`[PWA SW] Failed to pre-cache ${asset}:`, error);
        }
      }
    })
  );
  // Force activation of new worker without waiting for restart
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[PWA SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intelligent Strategy Routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests and non-http(s) schemas (like chrome-extension://)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. Navigation requests (HTML documents) -> Network-first with Offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is valid, clone to dynamic cache for offline replay
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Network failed: Check cache for the page
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // If page not cached, show dedicated offline page
          const offlinePage = await caches.match('/offline');
          if (offlinePage) {
            return offlinePage;
          }
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head><meta charset="utf-8"/><title>CampusCart Offline</title></head>
              <body style="font-family: sans-serif; background: #09090b; color: #fff; text-align: center; padding: 40px;">
                <h1>You're Offline</h1>
                <p>CampusCart requires an internet connection for this page. Please reconnect and try again.</p>
                <button onclick="window.location.reload()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Retry Connection</button>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // B. Images -> Cache-first with stale fallback & cache trimming
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|avif)$/i) ||
    url.hostname.includes('images.unsplash.com') ||
    url.hostname.includes('images.pexels.com') ||
    url.hostname.includes('firebasestorage.googleapis.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, responseClone);
                trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_ITEMS);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return fallback SVG if available in static cache
            return caches.match('/icons/icon-192x192.png');
          });
      })
    );
    return;
  }

  // C. Static Next.js assets & JS/CSS -> Stale-while-revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // D. Default network request with cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// 4. Message Event: Skip waiting on client request
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 5. Push Notifications Support
self.addEventListener('push', (event) => {
  let data = {
    title: 'CampusCart',
    body: 'You have a new update on CampusCart!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.svg',
    url: '/',
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Open CampusCart' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 6. Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
