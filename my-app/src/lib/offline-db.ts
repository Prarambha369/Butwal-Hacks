/**
 * OfflineDB — a thin IndexedDB wrapper for caching profiles, events,
 * and content so the app works partially offline.
 *
 * Uses native IndexedDB with a simple versioned schema.
 * Each store entry has a `ttl` timestamp; expired entries are
 * lazily evicted on read.
 *
 * ponytail: no dependency (idb/dexie). Simple typed wrapper over the native API.
 */

const DB_NAME = "butwalhacks-offline"
const DB_VERSION = 1

export type StoreName = "profiles_cache" | "events_cache" | "content_cache"

interface DbEntry<T> {
  key: string
  data: T
  ttl: number // epoch ms after which this entry is stale
  updatedAt: number // epoch ms of when this was last fetched
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      const stores: StoreName[] = ["profiles_cache", "events_cache", "content_cache"]
      for (const name of stores) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "key" })
        }
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Set a value in the given store with a TTL (time-to-live in seconds).
 * Default TTL is 5 minutes (300s).
 */
export async function setCacheEntry<T>(
  store: StoreName,
  key: string,
  data: T,
  ttlSeconds = 300,
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite")
    const objectStore = tx.objectStore(store)
    objectStore.put({
      key,
      data,
      ttl: Date.now() + ttlSeconds * 1000,
      updatedAt: Date.now(),
    } satisfies DbEntry<T>)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

/**
 * Get a value from the given store. Returns `null` if the entry
 * is missing or expired. Lazy-evicts expired entries.
 */
export async function getCacheEntry<T>(
  store: StoreName,
  key: string,
): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite")
    const objectStore = tx.objectStore(store)
    const req = objectStore.get(key)

    req.onsuccess = () => {
      const entry = req.result as DbEntry<T> | undefined
      if (!entry) {
        db.close()
        resolve(null)
        return
      }

      // Lazy eviction: if expired, delete and return null
      if (Date.now() > entry.ttl) {
        objectStore.delete(key)
        tx.oncomplete = () => {
          db.close()
          resolve(null)
        }
        return
      }

      db.close()
      resolve(entry.data)
    }

    req.onerror = () => {
      db.close()
      reject(req.error)
    }
  })
}

/**
 * Bulk-get all entries from a store (non-expired only).
 * Lazy-evicts expired entries.
 */
export async function getAllCacheEntries<T>(
  store: StoreName,
): Promise<Array<{ key: string; data: T; updatedAt: number }>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite")
    const objectStore = tx.objectStore(store)
    const req = objectStore.getAll()

    req.onsuccess = () => {
      const entries = (req.result as Array<DbEntry<T>>) || []
      const now = Date.now()
      const valid: Array<{ key: string; data: T; updatedAt: number }> = []

      for (const entry of entries) {
        if (now > entry.ttl) {
          objectStore.delete(entry.key)
        } else {
          valid.push({ key: entry.key, data: entry.data, updatedAt: entry.updatedAt })
        }
      }

      tx.oncomplete = () => {
        db.close()
        resolve(valid)
      }
    }

    req.onerror = () => {
      db.close()
      reject(req.error)
    }
  })
}

/**
 * Delete a specific cache entry.
 */
export async function deleteCacheEntry(
  store: StoreName,
  key: string,
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite")
    const objectStore = tx.objectStore(store)
    objectStore.delete(key)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

/**
 * Clear an entire store.
 */
export async function clearStore(store: StoreName): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite")
    const objectStore = tx.objectStore(store)
    objectStore.clear()
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

/**
 * Get the total number of entries in a store (non-expired).
 */
export async function countEntries(store: StoreName): Promise<number> {
  const entries = await getAllCacheEntries(store)
  return entries.length
}
