const ONBELLEK = "xmax-v1";
const DOSYALAR = ["./", "./asistan-arayuz.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(ONBELLEK).then((c) => c.addAll(DOSYALAR)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((anahtarlar) =>
      Promise.all(anahtarlar.filter((a) => a !== ONBELLEK).map((a) => caches.delete(a)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((yanit) => {
        const kopya = yanit.clone();
        caches.open(ONBELLEK).then((c) => c.put(e.request, kopya));
        return yanit;
      })
      .catch(() => caches.match(e.request))
  );
});
