/* APP-ENHE · PWA service worker v1.3 */
const CACHE_NAME = "app-enhe-pwa-v1-3-0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./css/admin-guard.css",
  "./js/assets.js",
  "./js/data.js",
  "./js/app.js",
  "./js/admin-guard.js",
  "./assets/logo-n-mayuscula.jpg",
  "./assets/n-mayuscula-stage-bg.jpg",
  "./assets/posters/cartel-cien-x-cien-2026-06-16.jpg",
  "./assets/posters/cartel-cien-x-cien-2026-06-16-thumb.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
        return Promise.resolve();
      })))
      .then(() => self.clients.claim())
  );
});

function isCoreRequest(request) {
  const url = new URL(request.url);
  return request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith("manifest.json");
}

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  if (isCoreRequest(request)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        });
      })
  );
});
