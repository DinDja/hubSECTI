const cache = new Map<string, { data: unknown; expiry: number }>()

export function getServerCache<T>(key: string, ttlMs = 300_000): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() < entry.expiry) return entry.data as T
  cache.delete(key)
  return null
}

export function setServerCache<T>(key: string, data: T, ttlMs = 300_000): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs })
  if (cache.size > 100) {
    const first = cache.keys().next().value
    if (first) cache.delete(first)
  }
}
