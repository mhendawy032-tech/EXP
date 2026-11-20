const CACHE = "exp-pwa-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./xlsx.full.min.js",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./fonts/cairo-400.woff2",
  "./fonts/cairo-600.woff2",
  "./fonts/cairo-700.woff2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الكاش أولاً (يشتغل أوفلاين) + تحديث النسخة المخزّنة في الخلفية لما يكون في نت
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => null);
      if (cached) return cached;
      return net.then((res) => res || (req.mode === "navigate" ? caches.match("./index.html") : Response.error()));
    })
  );
});
