const DB_NAME = "hub-secti-cache"
const DB_VERSION = 1
const STORE_NAME = "cache"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

type CacheEntry<T> = {
  data: T
  timestamp: number
}

export async function getCached<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => db.close()
    })
  } catch {
    return null
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const entry: CacheEntry<T> = { data, timestamp: Date.now() }
      store.put(entry, key)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Silently fail on cache write errors
  }
}

export function isCacheValid(entry: { timestamp: number } | null, ttlMs: number): boolean {
  if (!entry) return false
  return Date.now() - entry.timestamp < ttlMs
}

export async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  ttlMs = 5 * 60 * 1000,
  options?: RequestInit,
): Promise<T> {
  const cached = await getCached<{ data: T }>(cacheKey)
  if (cached && isCacheValid(cached, ttlMs)) return cached.data.data

  try {
    const mergedHeaders: Record<string, string> = { Accept: "application/json" }
    if (options?.headers) Object.assign(mergedHeaders, options.headers as Record<string, string>)
    const res = await fetch(url, { ...options, headers: mergedHeaders })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as T
    setCache(cacheKey, { data }).catch(() => {})
    return data
  } catch (err) {
    if (cached) return cached.data.data
    throw err
  }
}
