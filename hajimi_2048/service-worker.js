const CACHE_NAME = "merge-2048-audio-v1";
const AUDIO_ASSETS = [
  "audio/哈基米/ha.wav",
  "audio/哈基米/ha_new.wav",
  "audio/哈基米/ji.wav",
  "audio/哈基米/ji_new.wav",
  "audio/哈基米/mi.wav",
  "audio/哈基米/mi_new.wav",
  "audio/大狗/da.wav",
  "audio/大狗/gou.wav",
  "audio/大狗/jiao.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(AUDIO_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("merge-2048-audio-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || !url.pathname.includes("/audio/")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Store and match by URL so range requests reuse the complete WAV response.
      const cacheRequest = new Request(url.href, { method: "GET" });
      const cached = await cache.match(cacheRequest);
      if (cached) return cached;

      const response = await fetch(cacheRequest);
      if (response.ok && response.status === 200) {
        await cache.put(cacheRequest, response.clone());
      }
      return response;
    })
  );
});
