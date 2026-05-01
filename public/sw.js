// Viikkoraha PWA Service Worker
// Cache strategy: Stale-While-Revalidate for app shell, Network First for API

const APP_VERSION = 'viikkoraha-v2';
const STATIC_CACHE = `${APP_VERSION}-static`;
const API_CACHE = `${APP_VERSION}-api`;

const STATIC_ASSETS = ['/viikkoraha/', '/viikkoraha/index.html', '/viikkoraha/site.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== API_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and non-HTTP
  if (event.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API calls (Sheets + UserInfo): Network first
  if (
    url.hostname === 'sheets.googleapis.com' ||
    url.hostname === 'www.googleapis.com'
  ) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // Static assets: Stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|json|woff2|webmanifest)$/) ||
    url.pathname === '/viikkoraha/' ||
    url.pathname === '/viikkoraha'
  ) {
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
    return;
  }

  // Google scripts (GIS, GAPI): Network only (don't cache CDN scripts)
  if (
    url.hostname === 'accounts.google.com' ||
    url.hostname === 'apis.google.com'
  ) {
    return;
  }

  // Fallback: network first
  event.respondWith(networkFirst(event.request, STATIC_CACHE));
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Olet offline-tilassa' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}
