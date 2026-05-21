// Otarosta Service Worker
// Strategy:
//   /_next/static/** → cache-first (immutable hashed filenames, safe to cache forever)
//   /api/**          → network-only  (always live data)
//   navigate         → network-first, fall back to cached shell
//   everything else  → stale-while-revalidate

const CACHE = 'otarosta-v1';
const SHELL  = ['/', '/api/og/icon?size=192', '/api/og/icon?size=512'];

// ── Install: pre-cache the app shell ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ── Activate: purge stale caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API → network only (never cache live roster/auth data)
  if (url.pathname.startsWith('/api/')) return;

  // Next.js static chunks → cache-first (filenames are content-hashed)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
    return;
  }

  // Navigation → network-first, fall back to shell so the app loads offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/') ?? fetch(request))
    );
    return;
  }

  // Everything else → stale-while-revalidate
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          cache.put(request, res.clone());
          return res;
        });
        return cached ?? network;
      })
    )
  );
});
