const CACHE_NAME = 'y-connect-shell-v2';
const API_CACHE_NAME = 'y-connect-api-v2';
const SHELL_ASSETS = ['./', './offline.html', './manifest.webmanifest', './favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && key !== API_CACHE_NAME).map(key => caches.delete(key)))),
  );
  self.clients.claim();
});

// Same-origin GET only; navigations, live map tiles, and third-party requests are never cached this way.
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => { caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone())); return response; })
        .catch(() => caches.match(request).then(cached => cached ?? caches.match('./offline.html'))),
    );
    return;
  }

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    // Stale-while-revalidate: show the last known synthetic data instantly, refresh in the background.
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        const network = fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response; }).catch(() => undefined);
        return cached ?? (await network) ?? Response.json({ error: 'Offline: this data has not been loaded yet.' }, { status: 503 });
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached ?? fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    })),
  );
});
