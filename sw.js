// AURAI servis dosyası: uygulama dosyalarını önbelleğe alır, çevrimdışı açılmasını sağlar.
// Model dosyalarını WebLLM kendi önbelleğinde tutar; buraya karışmıyoruz.
const ONBELLEK = "aurai-v2";
const DOSYALAR = [
  "./", "./index.html", "./style.css", "./app.js", "./komutlar.js", "./hazir-cevaplar.js",
  "./manifest.json", "./icon-192.png", "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(ONBELLEK).then((c) => c.addAll(DOSYALAR)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((adlar) =>
      Promise.all(adlar.filter((a) => a !== ONBELLEK).map((a) => caches.delete(a)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  if (new URL(istek.url).origin !== self.location.origin) return; // dış kaynaklara dokunma
  e.respondWith(
    fetch(istek)
      .then((yanit) => {
        if (yanit.ok) {
          const kopya = yanit.clone();
          caches.open(ONBELLEK).then((c) => c.put(istek, kopya));
        }
        return yanit;
      })
      .catch(() => caches.match(istek))
  );
});
