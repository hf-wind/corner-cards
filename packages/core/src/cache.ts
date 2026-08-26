const PREFIX = 'corner-weather:'
const DEFAULT_TTL = 30 * 60 * 1000

interface CacheEntry<T> {
  t: number
  ttl: number
  data: T
}

export interface CachedData<T> {
  data: T
  fetchedAt: number
  fresh: boolean
}

export function cacheKey(parts: Array<string | undefined>): string {
  return PREFIX + parts.filter((p) => p != null && p !== '').join(':')
}

export function readCache<T>(key: string, ttl = DEFAULT_TTL): CachedData<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    const fetchedAt = typeof entry.t === 'number' ? entry.t : 0
    return {
      data: entry.data,
      fetchedAt,
      fresh: Date.now() - fetchedAt < (entry.ttl || ttl),
    }
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  try {
    const entry: CacheEntry<T> = { t: Date.now(), ttl, data }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    return
  }
}
