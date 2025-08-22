self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("absensi-qr-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/app.js",
        "/libs/html5-qrcode.min.js",
        "/manifest.json",
        "/icon.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
