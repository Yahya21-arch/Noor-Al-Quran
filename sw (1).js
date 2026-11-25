/* Noor Al-Quran — fast resumable offline cache for all 604 Mushaf pages */
const SHELL_CACHE = 'noor-app-shell-v7';
const MUSHAF_CACHE = 'noor-mushaf-pages-v6'; // Keep v6 to preserve pages already downloaded.
const TOTAL_PAGES = 604;
const CONCURRENCY = 8;
const MAX_RETRIES = 2;

const pageUrl = n =>
  new URL(`mushaf-pages/page-${String(n).padStart(3, '0')}.jpg`, self.registration.scope).href;

const shellPaths = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './sw.js',
  './offline-download.js',
  './privacy-policy.html',
  './adhkar.js',
  './adhkar.css'
];

let activeMushafDownload = null;

async function cacheOne(cache, url) {
  try {
    const response = await fetch(url);
    if (response.ok) await cache.put(url, response.clone());
  } catch (_) {}
}

async function cacheAppShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(
    shellPaths.map(path =>
      cacheOne(cache, new URL(path, self.registration.scope).href)
    )
  );
}

async function notifyClients(message) {
  const clientsList = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });
  for (const client of clientsList) {
    client.postMessage(message);
  }
}

async function fetchAndStorePage(cache, page) {
  const url = pageUrl(page);

  // Resume safely: pages already present are never downloaded again.
  if (await cache.match(url)) return true;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      if (!response || !response.ok) {
        throw new Error(`HTTP ${response ? response.status : 'no response'}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType && !contentType.toLowerCase().includes('image')) {
        throw new Error('The response is not an image');
      }

      await cache.put(url, response.clone());

      // Verify that Cache Storage actually retained this page.
      if (await cache.match(url)) return true;
      throw new Error('Cache verification failed');
    } catch (error) {
      if (attempt === MAX_RETRIES) break;
      // Short backoff: retry transient network/server errors without stalling the queue.
      await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  return false;
}

async function runMushafDownload() {
  const cache = await caches.open(MUSHAF_CACHE);
  let nextPage = 1;
  let cachedCount = 0;
  let processedCount = 0;
  const failedPages = [];

  await notifyClients({
    type: 'MUSHAF_CACHE_PROGRESS',
    cached: 0,
    total: TOTAL_PAGES,
    percent: 0,
    state: 'checking'
  });

  async function worker() {
    while (true) {
      const page = nextPage++;
      if (page > TOTAL_PAGES) return;

      const success = await fetchAndStorePage(cache, page);
      processedCount++;

      if (success) cachedCount++;
      else failedPages.push(page);

      // Send genuine progress as pages are verified in Cache Storage.
      await notifyClients({
        type: 'MUSHAF_CACHE_PROGRESS',
        cached: cachedCount,
        processed: processedCount,
        total: TOTAL_PAGES,
        percent: Math.floor((cachedCount / TOTAL_PAGES) * 100),
        state: 'downloading'
      });
    }
  }

  // Eight simultaneous workers provide a much shorter download time
  // without opening hundreds of connections at once on mobile devices.
  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker())
  );

  // Final verification, not just a count of successful fetch responses.
  let verifiedCount = 0;
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    if (await cache.match(pageUrl(page))) verifiedCount++;
  }

  if (verifiedCount === TOTAL_PAGES) {
    await notifyClients({
      type: 'MUSHAF_CACHE_COMPLETE',
      cached: verifiedCount,
      total: TOTAL_PAGES,
      percent: 100
    });
  } else {
    await notifyClients({
      type: 'MUSHAF_CACHE_PARTIAL',
      cached: verifiedCount,
      total: TOTAL_PAGES,
      percent: Math.floor((verifiedCount / TOTAL_PAGES) * 100),
      failedPages
    });
  }

  return verifiedCount === TOTAL_PAGES;
}

function startMushafDownload() {
  if (activeMushafDownload) return activeMushafDownload;

  activeMushafDownload = runMushafDownload()
    .catch(async error => {
      await notifyClients({
        type: 'MUSHAF_CACHE_ERROR',
        message: String(error && error.message ? error.message : error)
      });
      return false;
    })
    .finally(() => {
      activeMushafDownload = null;
    });

  return activeMushafDownload;
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
    await Promise.all(
      keys
        .filter(key =>
          (key.startsWith('noor-app-shell-') && key !== SHELL_CACHE) ||
          (key.startsWith('noor-mushaf-pages-') && key !== MUSHAF_CACHE)
        )
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'CACHE_ALL_MUSHAF_PAGES') {
    event.waitUntil(startMushafDownload());
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

      const response = await fetch(request);
      if (response.ok) {
        try { await cache.put(request, response.clone()); } catch (_) {}
      }
      return response;
    })());
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(request);

      if (request.mode === 'navigate') {
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            try { await cache.put(request, response.clone()); } catch (_) {}
          }
          return response;
        } catch (error) {
          const fallback = await cache.match(
            new URL('./index.html', self.registration.scope).href
          );
          if (fallback) return fallback;
          throw error;
        }
      }

      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        try { await cache.put(request, response.clone()); } catch (_) {}
      }
      return response;
    })());
  }
});
