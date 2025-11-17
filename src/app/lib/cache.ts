import crypto from 'crypto'

// Simple in-memory cache (for development)
// In production, use Redis or database for persistence

interface CacheEntry {
  data: any
  expires: number
}

const cache = new Map<string, CacheEntry>()

export function generateCacheKey(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

export function getCached(key: string): any | null {
  const entry = cache.get(key)
  
  if (!entry) return null
  
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  
  return entry.data
}

export function setCached(key: string, data: any, ttlMinutes: number = 60): void {
  const expires = Date.now() + (ttlMinutes * 60 * 1000)
  cache.set(key, { data, expires })
  
  // Cleanup expired entries
  for (const [k, entry] of cache.entries()) {
    if (entry.expires < Date.now()) {
      cache.delete(k)
    }
  }
}

export function clearCache(): void {
  cache.clear()
}