/* Ailexity POS Service Worker
 * Strategy:
 *   - App shell (index.html, static assets): cache-first → loads app offline
 *   - GET /items/: stale-while-revalidate → items browsable offline
 *   - Everything else: network-only (login, invoices, dashboard)
 *
 * NOTE: Invoice POST offline queuing is handled in api.js (main thread)
 * so the auth token is always available for sync replays.
 */

const STATIC_CACHE = 'ailexity-static-v2';
const API_CACHE = 'ailexity-api-items-v1';
const ALL_CACHES = [STATIC_CACHE, API_CACHE];

// ── Install: pre-cache the app shell ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(['/', '/index.html']))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old cache versions ──────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => keys.filter((k) => !ALL_CACHES.includes(k)))
      .then((stale) => Promise.all(stale.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: route each request to the right strategy ─────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests (POSTs are handled by api.js)
  if (request.method !== 'GET') return;

  // Cross-origin requests: let them go through (e.g. dev API on :8000)
  if (url.origin !== self.location.origin) return;

  // ── Navigation (page loads / SPA routing) ──────────────────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(
          (r) => r || new Response('<h1>Offline</h1><p>No cached page found.</p>', { status: 503, headers: { 'Content-Type': 'text/html' } })
        )
      )
    );
    return;
  }

  // ── /items/ API: stale-while-revalidate ─────────────────────────────
  if (url.pathname.match(/\/items\/?$/) || url.pathname.match(/\/items\/\?/)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        // Always try network in background — update cache silently
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);
        // Return cached immediately if available, else wait for network
        return cached || networkFetch;
      })
    );
    return;
  }

  // ── Static JS / CSS / images / fonts: cache-first ───────────────────
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else: network-only, no caching
});

// ── Listen for skip-waiting message from main thread ────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
