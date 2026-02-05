const CACHE = "album-468-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./img/placeholder.jpg",
  "./img/icon-192.png",
  "./img/icon-512.png"
];

for (let i = 1; i <= 468; i++) {
  ASSETS.push(`./img/${i}.jpg`);
}

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
