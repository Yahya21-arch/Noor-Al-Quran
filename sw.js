/* Noor Al-Quran — TRUE OFFLINE APP SHELL + 604 MUSHAF PAGES */
const SHELL_CACHE = 'noor-app-shell-v6';
const MUSHAF_CACHE = 'noor-mushaf-pages-v6';
const TOTAL_PAGES = 604;

const pageUrl = n =>
  new URL(`mushaf-pages/page-${String(n).padStart(3, '0')}.jpg`, self.registration.scope).href;

const shellPaths = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './sw.js',
  './privacy-policy.html',
  './adhkar.js',
  './adhkar.css'
];

async function cacheOne(cache, url) {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (response.ok) await cache.put(url, response.clone());
  } catch (_) {}
}

async function cacheAppShell() {
  const cache = await caches.open(SHELL_CACHE);
  for (const path of shellPaths) {
    await cacheOne(cache, new URL(path, self.registration.scope).href);
  }
}

async function cacheAllPages() {
  const cache = await caches.open(MUSHAF_CACHE);
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = pageUrl(page);
    try {
      if (!await cache.match(url)) {
        const response = await fetch(url, { cache: 'no-cache' });
        if (response.ok) await cache.put(url, response.clone());
      }
    } catch (_) {
      // Keep going: a temporary network failure must not stop the remaining pages.
    }
    if (page % 4 === 0) await new Promise(r => setTimeout(r, 0));
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await cacheAppShell();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k =>
        (k.startsWith('noor-app-shell-') && k !== SHELL_CACHE) ||
        (k.startsWith('noor-mushaf-pages-') && k !== MUSHAF_CACHE)
      )
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'CACHE_ALL_MUSHAF_PAGES') {
    event.waitUntil(cacheAllPages());
  }
  if (event.data?.type === 'CACHE_APP_SHELL') {
    event.waitUntil(cacheAppShell());
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isMushafPage =
    url.origin === location.origin &&
    /\/mushaf-pages\/page-\d{3}\.jpg$/i.test(url.pathname);

  if (isMushafPage) {
    event.respondWith((async () => {
      const cache = await caches.open(MUSHAF_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        throw error;
      }
    })());
    return;
  }

  // Cache the whole same-origin app shell. This is the part that was missing:
  // without it, the browser could have the 604 JPGs but fail to start the app
  // itself when offline.
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(request);

      // Navigation: cache-first so a completely offline launch works.
      if (request.mode === 'navigate') {
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put(request, response.clone());
          return response;
        } catch (_) {
          const fallback = await cache.match(
            new URL('./index.html', self.registration.scope).href
          );
          if (fallback) return fallback;
          throw _;
        }
      }

      // Static app files: cache-first, then network + update cache.
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (_) {
        throw _;
      }
    })());
  }
});
