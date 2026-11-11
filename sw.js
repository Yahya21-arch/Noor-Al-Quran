/* Noor Al-Quran - Mushaf Offline Service Worker */
const CACHE_NAME = 'noor-mushaf-pages-v5';
const TOTAL_PAGES = 604;
const PAGE_URL = n => `mushaf-pages/page-${String(n).padStart(3, '0')}.jpg`;

self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('noor-mushaf-pages-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function cacheAllPages() {
  const cache = await caches.open(CACHE_NAME);
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = PAGE_URL(page);
    try {
      if (!await cache.match(url)) {
        const response = await fetch(url, { cache: 'no-cache' });
        if (response.ok) await cache.put(url, response.clone());
      }
    } catch (_) {}
    if (page % 8 === 0) await new Promise(r => setTimeout(r, 0));
  }
}

self.addEventListener('message', event => {
  if (event.data?.type === 'CACHE_ALL_MUSHAF_PAGES') event.waitUntil(cacheAllPages());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.pathname.includes('/mushaf-pages/page-') && /\.jpg$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
