// StockShift service worker — hand-authored (no bundler / no Workbox).
// Bump CACHE_VERSION to invalidate all caches on the next deploy.
const CACHE_VERSION = "v1";
const CACHE_NAME = `stockshift-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/icon-192x192.png", "/icon-512x512.png"];

const STATIC_PREFIXES = ["/_next/static/", "/logos/", "/splash_screens/", "/icon"];
const STATIC_EXTENSIONS = [
  ".js", ".css", ".woff", ".woff2", ".png", ".jpg",
  ".jpeg", ".svg", ".webp", ".ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("stockshift-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAsset(url) {
  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return true;
  }
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function isCacheableResponse(response) {
  return Boolean(response) && response.status === 200 && response.type === "basic";
}

async function navigationWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const offline = await cache.match(OFFLINE_URL);
    return offline || Response.error();
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch the API / auth

  if (request.mode === "navigate") {
    event.respondWith(navigationWithOfflineFallback(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstAsset(request));
  }
});
