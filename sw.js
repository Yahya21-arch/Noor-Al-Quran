const CACHE_NAME = 'noor-mushaf-pages-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('noor-mushaf-pages-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isMushafImage = request.destination === 'image' && /\/mushaf-pages\/page-\d{3}\.jpg$/i.test(url.pathname);
  if (!isMushafImage) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // If the page was previously cached under the same URL, return it.
      const fallback = await cache.match(request);
      if (fallback) return fallback;
      throw error;
    }
  })());
});
