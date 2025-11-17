// Simple in-memory rate limiter (for development)
// In production, use Redis or database for persistence

interface RateLimit {
  count: number
  resetTime: number
}

const limits = new Map<string, RateLimit>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `${identifier}_${Math.floor(now / windowMs)}`
  
  const currentLimit = limits.get(key) || { count: 0, resetTime: now + windowMs }
  
  if (currentLimit.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentLimit.resetTime
    }
  }
  
  currentLimit.count++
  limits.set(key, currentLimit)
  
  // Cleanup old entries
  for (const [k, limit] of limits.entries()) {
    if (limit.resetTime < now) {
      limits.delete(k)
    }
  }
  
  return {
    allowed: true,
    remaining: maxRequests - currentLimit.count,
    resetTime: currentLimit.resetTime
  }
}