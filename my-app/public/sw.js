const CACHE = "bh-cache-v3"
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
      Promise.all(keys.filter((k) => k !== CACHE && k !== IMAGE_CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

// Fetch: network-first for pages+api, cache-first for static assets,
// stale-while-revalidate for images
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
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Network-first for pages and API requests
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
 * Stale-while-revalidate strategy for images.
 * Serves from cache immediately, then updates the cache in the background.
 * Evicts oldest entries when over IMAGE_CACHE_MAX.
 */
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request)

  // Clone the request for the network fetch
  const networkFetch = fetch(request.clone())
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
        // Evict old entries if over limit
        trimCache(cache, IMAGE_CACHE_MAX)
      }
      return response
    })
    .catch(() => cached || new Response("", { status: 503 }))

  // If we have a cached version, return it immediately
  if (cached) {
    // Don't await — fire and forget the revalidation
    networkFetch
    return cached
  }

  // Otherwise wait for the network
  return networkFetch
}

/**
 * Evict oldest entries from a cache until it's under maxItems.
 */
async function trimCache(cache: Cache, maxItems: number): Promise<void> {
  const keys = await cache.keys()
  if (keys.length <= maxItems) return

  // Delete oldest entries sequentially to avoid batch rejection on error
  const toDelete = keys.slice(0, keys.length - maxItems)
  for (const key of toDelete) {
    try {
      await cache.delete(key)
    } catch {
      // ponytail: individual delete failure is non-fatal
    }
  }
}

// Listen for update messages from the client
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
