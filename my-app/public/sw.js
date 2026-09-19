// Kill-switch service worker — retires the legacy PWA worker.
//
// The old /sw.js precached retired assets (android-chrome-*, icon.svg,
// site.webmanifest) and kept serving them after those files were deleted.
// This file exists only so browsers still holding the old worker pick up
// this update, drop all caches, and unregister. It provides no offline
// support by design.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll();
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
