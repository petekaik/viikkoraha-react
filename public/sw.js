// Viikkoraha PWA Service Worker
// Cache strategy:
//   index.html → Network-First, NEVER cached (varmistaa päivitykset iOS:llä)
//   JS/CSS/assets → Stale-While-Revalidate (välitön lataus, päivittää taustalla)
//   Google APIs → Network-First (tuorein data aina)
//
// Päivitysmekanismi: pollaa index.html:n ETagia 5 min välein,
// jos muutos → postMessage UPDATE_AVAILABLE kaikille clienteille.

const APP_VERSION = 'viikkoraha-v6';
const STATIC_CACHE = `${APP_VERSION}-static`;
const API_CACHE = `${APP_VERSION}-api`;
const POLL_INTERVAL_SEC = 5 * 60; // 5 min

let currentEtag = null;

// ── Periodic update check ─────────────────────────────────────────────────

async function checkForUpdate() {
  try {
    // IMPORTANT: cache: 'no-cache' ohittaa iOS:n HTTP-cachen —
    // ilman tätä Safari ei koskaan pyydä uutta index.html:ää palvelimelta.
    const response = await fetch('/viikkoraha/index.html', {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    if (!response.ok) return;

    const newEtag = response.headers.get('etag') || response.headers.get('last-modified');
    if (!newEtag) return;

    if (currentEtag && newEtag !== currentEtag) {
      console.log('[viikkoraha SW] Uusi versio havaittu, ilmoitetaan clienteille');
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'UPDATE_AVAILABLE' });
      }
    }
    currentEtag = newEtag;
  } catch {
    // Offline — ignore
  }
}

// ── Static assets to pre-cache on install ─────────────────────────────────
// ÄLÄ cachettaa index.html:ää — se haetaan aina network-first

const STATIC_ASSETS = ['/viikkoraha/site.webmanifest'];

// ── Lifecycle ─────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // skipWaiting: uusi SW aktivoituu heti, ei odota että vanhat välilehdet suljetaan
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Aloitetaan pollaus
      await checkForUpdate();
      setInterval(checkForUpdate, POLL_INTERVAL_SEC * 1000);

      // Clean vanhat cachet
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      );

      // clients.claim: uusi SW ottaa HETI kaikki avoimet sivut hallintaan
      await self.clients.claim();
      console.log('[viikkoraha SW] v6 aktivoitu');
    })()
  );
});

// ── Message handler ───────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch strategies ──────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Google APIs → Network-First (tuorein data)
  if (
    url.hostname === 'sheets.googleapis.com' ||
    url.hostname === 'www.googleapis.com' ||
    url.hostname === 'oauth2.googleapis.com'
  ) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // index.html → Network-First, EI cachesta ikinä
  // Tämä varmistaa että iOS ei jää jumiin vanhaan versioon.
  if (
    url.pathname === '/viikkoraha/' ||
    url.pathname === '/viikkoraha' ||
    url.pathname === '/viikkoraha/index.html'
  ) {
    event.respondWith(networkOnly(event.request));
    return;
  }

  // JS/CSS/png/svg/ico/fontit → Stale-While-Revalidate
  if (url.pathname.match(/\.(js|css|png|svg|ico|json|woff2|webmanifest|xml)$/)) {
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
    return;
  }

  // Google auth scripts → älä koske
  if (
    url.hostname === 'accounts.google.com' ||
    url.hostname === 'apis.google.com' ||
    url.hostname === 'lh3.googleusercontent.com'
  ) {
    return;
  }

  // Kaikki muu → Network-First
  event.respondWith(networkFirst(event.request, STATIC_CACHE));
});

// ── Strategy implementations ──────────────────────────────────────────────

/** Network-only — never serve from cache. Käytetään index.html:lle. */
async function networkOnly(request) {
  try {
    return await fetch(request, { cache: 'no-cache' });
  } catch {
    // Jos offline, palauta cached-versio (jos sellainen on)
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline — ei yhteyttä', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

/** Network-First: kokeile verkkoa, fallback cacheen. */
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

/** Stale-While-Revalidate: palauta cachesta heti, päivitä taustalla. */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request, { cache: 'no-cache' })
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}
