// Service Worker for RA Elétrica & Automação PWA and Offline Support
const CACHE_NAME = 'ra-electrica-v11';
const OFFLINE_URL = '/index.html';

// Assets that are critical for offline boot
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpg',
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic cache with network fallback and offline navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass caching in development environments to prevent stale/corrupt assets during code edits
  const isDevelopment = url.hostname === 'localhost' || 
                        url.hostname === '127.0.0.1' || 
                        url.hostname.includes('ais-dev-') ||
                        url.hostname.includes('ais-pre-') ||
                        url.hostname.includes('.run.app') ||
                        url.pathname.includes('hmr') ||
                        url.pathname.includes('vite');

  if (isDevelopment) {
    return;
  }

  // Skip non-GET requests, hot reload, and Firebase / API calls
  if (
    request.method !== 'GET' ||
    url.pathname.includes('/api/') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  // Navigation requests (page loads) - Network First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          console.log('[Service Worker] Navigation offline, serving index.html shell');
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static Assets (CSS, JS, Fonts, Images) - Cache First with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache, fetch in background to revalidate (Stale-While-Revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {/* Ignore network errors during background revalidation */});
        
        return cachedResponse;
      }

      // Fetch from network, then cache and return
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for image requests when offline
        if (request.destination === 'image') {
          return caches.match('/logo.jpg');
        }
      });
    })
  );
});

// Push Event - Listen for incoming Web Push Notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  let payload = {
    title: 'RA Elétrica & Automação',
    body: 'Novo agendamento de serviço ou lembrete importante!',
    icon: '/logo.jpg',
    badge: '/favicon.png',
    data: {
      url: '/app/agenda'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch (e) {
      // Fallback to plain text if not JSON
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/logo.jpg',
    badge: payload.badge || '/favicon.png',
    vibrate: [100, 50, 100],
    data: payload.data || { url: '/app/agenda' },
    actions: [
      { action: 'open', title: 'Ver Agenda', icon: '/favicon.png' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Notification Click Event - Handle actions
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.', event.notification.tag);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/app/agenda';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
