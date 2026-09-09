// Service Worker for RA Elétrica & Automação PWA and Offline Support
const CACHE_NAME = 'ra-electrica-v14';
const OFFLINE_URL = '/index.html';

// Assets that are critical for offline boot
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpg',
];

// Allow page to immediately activate a new Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install Event - Pre-cache core assets & skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker v14] Pre-caching core assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean all old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning old stale cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic network-first strategy with cache fallback
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
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Navigation offline, serving index.html shell');
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static Assets (JS, CSS, fonts, images) - Network First with Cache Fallback
  // This guarantees updates to UI and text colors are instantly seen without getting stuck in stale cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // When offline, fallback to cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
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
