/* APP-ENHE · PWA service worker v2.7 Lady Stone Acuerdos Editables */
const CACHE_NAME = "app-enhe-pwa-v4-3-0-news";
const APP_SHELL = [
  "./",
  "./index.html?v=3.0.0-library",
  "./manifest.json?v=3.0.0-library",
  "./css/styles.css?v=3.0.0-library",
  "./css/audio-library.css?v=3.0.0-library",
  "./css/news-modal.css?v=4.3.0-news",
  "./css/admin-guard.css?v=3.0.0-library",
  "./js/assets.js?v=3.0.0-library",
  "./js/data.js?v=3.0.0-library",
  "./js/audio-library.js?v=3.0.0-library",
  "./js/app.js?v=3.0.0-library",
  "./js/news-modal.js?v=4.3.0-news",
  "./js/admin-guard.js?v=3.0.0-library",
  "./assets/logo-n-mayuscula.jpg",
  "./assets/n-mayuscula-stage-bg.jpg",
  "./assets/posters/cartel-cien-x-cien-2026-06-16.jpg",
  "./assets/posters/cartel-cien-x-cien-2026-06-16-thumb.jpg",
  "./assets/audio-library/library_n_mayuscula.json",
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

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (isCoreRequest(request)) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html?v=3.0.0-library")))
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

