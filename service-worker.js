const CACHE_NAME = "habit-tracker-v1";
const ASSETS = [
  "/habit-tracker/",
  "/habit-tracker/index.html",
  "/habit-tracker/style.css",
  "/habit-tracker/script.js",
  "/habit-tracker/manifest.json",
  "/habit-tracker/icons/icon-192.png",
  "/habit-tracker/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
