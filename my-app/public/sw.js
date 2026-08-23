const CACHE = "bh-cache-v4"
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/icon.svg",
  "/icon-192.svg",
  "/manifest.webmanifest",
]

// ponytail: max 50 images cached to avoid quota issues
const IMAGE_CACHE_MAX = 50
const IMAGE_CACHE = "bh-images-v1"
const API_CACHE = "bh-api-v1"

// Install: cache shell, skip waiting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

// Activate: clean old caches, claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== IMAGE_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  )
})

// Fetch: strategy dispatch by request type
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and non-http(s) requests
  if (request.method !== "GET") return
  if (!url.protocol.startsWith("http")) return

  // Cache-first for static assets (fonts, CSS, JS, icons)
  if (url.pathname.match(/\.(woff2?|css|js|json|svg|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    )
    return
  }

  // Stale-while-revalidate for images (PNG, JPG, WebP, etc.)
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif)$/)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }

  // Stale-while-revalidate for read-only API endpoints (GET)
  // Exclude the signature endpoint since it needs fresh server-side auth
  if (
    url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/api/cloudinary-signature") &&
    !url.pathname.startsWith("/api/csp-violation")
  ) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE))
    return
  }

  // Network-first for pages and remaining requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          if (request.mode === "navigate") {
            return caches.match("/offline")
          }
          return new Response("Offline", { status: 503 })
        })
      }),
  )
})

/**
 * Stale-while-revalidate strategy.
 * Serves from cache immediately, then updates the cache in the background.
 * For image caches, evicts oldest entries when over the max limit.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkFetch = fetch(request.clone())
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
        if (cacheName === IMAGE_CACHE) {
          trimCache(cache, IMAGE_CACHE_MAX)
        }
      }
      return response
    })
    .catch(() => cached || new Response("", { status: 503 }))

  if (cached) {
    // Don't await — fire and forget the revalidation
    networkFetch
    return cached
  }

  return networkFetch
}

/**
 * Evict oldest entries from a cache until it's under maxItems.
 */
async function trimCache(cache, maxItems) {
  const keys = await cache.keys()
  if (keys.length <= maxItems) return

  const toDelete = keys.slice(0, keys.length - maxItems)
  for (const key of toDelete) {
    try {
      await cache.delete(key)
    } catch {
      // ponytail: individual delete failure is non-fatal
    }
  }
}

// ─── Periodic Background Sync ─────────────────────────────────────
// ponytail: periodicSync is experimental; wrap in feature check.
// Falls back silently if the browser doesn't support it.
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "bh-content-update") {
    event.waitUntil(backgroundUpdate())
  }
})

async function backgroundUpdate() {
  try {
    // Warm the API cache for key endpoints
    const endpoints = [
      "/api/profiles/featured",
      "/api/events/upcoming",
    ]
    const cache = await caches.open(API_CACHE)

    const results = await Promise.allSettled(
      endpoints.map(async (url) => {
        const res = await fetch(url, { cache: "no-cache" })
        if (res.ok) {
          await cache.put(new Request(url), res.clone())
        }
        return res
      }),
    )

    // Notify all clients that background update completed
    const clientsList = await self.clients.matchAll()
    for (const client of clientsList) {
      client.postMessage({
        type: "BACKGROUND_UPDATE",
        success: results.every((r) => r.status === "fulfilled"),
      })
    }
  } catch {
    // ponytail: background sync failure is non-fatal
  }
}

// Listen for messages from the client
self.addEventListener("message", (event) => {
  switch (event.data) {
    case "SKIP_WAITING":
      self.skipWaiting()
      break
    case "REGISTER_PERIODIC_SYNC":
      // Client asked us to register periodic sync
      // (Only works if the site has been added to home screen)
      break
  }
})
