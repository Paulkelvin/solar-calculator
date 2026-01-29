/**
 * Rate Limiter - Request Rate Limiting
 * Phase 5.2: Implements token bucket and sliding window rate limiting
 * 
 * Status: Stub (Ready for Phase 5.2 implementation)
 * Last Updated: January 29, 2026
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Sliding window rate limiter
 * Phase 5.2: Tracks requests within a time window
 * 
 * Algorithm:
 * - Remove requests older than windowMs
 * - Check if count < maxRequests
 * - Add new request timestamp if allowed
 * 
 * Advantages:
 * - Simple and accurate
 * - No memory overhead
 * - Smooth rate limiting
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  /**
   * Check if request is allowed under rate limit
   * @returns true if request allowed, false if rate limited
   */
  canRequest(): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > cutoff);

    // Check if we can make a request
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests in current window
   */
  getRemaining(): number {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.requests = this.requests.filter(time => time > cutoff);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get time until oldest request expires (ms)
   */
  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldest = this.requests[0];
    const resetTime = oldest + this.windowMs - Date.now();
    return Math.max(0, resetTime);
  }

  /**
   * Get current load (0-1)
   */
  getLoad(): number {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const validRequests = this.requests.filter(time => time > cutoff);
    return validRequests.length / this.maxRequests;
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.requests = [];
  }

  /**
   * Get limiter status
   */
  getStatus() {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const validRequests = this.requests.filter(time => time > cutoff);

    return {
      totalRequests: validRequests.length,
      remaining: Math.max(0, this.maxRequests - validRequests.length),
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      windowSec: Math.round(this.windowMs / 1000),
      load: validRequests.length / this.maxRequests,
      resetTimeMs: this.getResetTime()
    };
  }
}

/**
 * Token bucket rate limiter (alternative to sliding window)
 * Phase 5.2: More suitable for burst handling
 * 
 * Algorithm:
 * - Start with maxTokens
 * - Tokens refill over time
 * - Each request costs 1 token
 * - Request allowed only if tokens > 0
 * 
 * Advantages:
 * - Allows burst handling
 * - Smoother rate limiting
 * - Better for variable load
 */
export class TokenBucketLimiter {
  private tokens: number;
  private lastRefillTime: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillRateMs: number // milliseconds per token
  ) {
    this.tokens = maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * Try to consume a token
   */
  tryConsume(count = 1): boolean {
    this.refillTokens();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  /**
   * Get available tokens
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  /**
   * Get time until next token available
   */
  getWaitTimeMs(): number {
    if (this.tokens > 0) return 0;
    return this.refillRateMs;
  }

  /**
   * Reset all tokens
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * Get limiter status
   */
  getStatus() {
    this.refillTokens();
    return {
      availableTokens: this.tokens,
      maxTokens: this.maxTokens,
      refillRateMs: this.refillRateMs,
      waitTimeMs: this.getWaitTimeMs()
    };
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = elapsed / this.refillRateMs;

    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + tokensToAdd
    );
    this.lastRefillTime = now;
  }
}

/**
 * Rate limiters for each API
 * Phase 5.2: Global rate limiters for API quotas
 */

// Google Solar API: 100 requests per minute
export const googleSolarLimiter = new RateLimiter(
  100, // maxRequests
  60000 // windowMs (1 minute)
);

// Google Places API: 1000 requests per minute
export const googlePlacesLimiter = new RateLimiter(
  1000, // maxRequests
  60000 // windowMs (1 minute)
);

// DSIRE API: 50 requests per minute
export const desireLimiter = new RateLimiter(
  50, // maxRequests
  60000 // windowMs (1 minute)
);

// Utility Rates API: 30 requests per minute
export const utilityRatesLimiter = new RateLimiter(
  30, // maxRequests
  60000 // windowMs (1 minute)
);

/**
 * Check all limiters and return status
 * Phase 5.2: Monitor rate limit compliance
 */
export function getAllRateLimiterStatus() {
  return {
    googleSolar: googleSolarLimiter.getStatus(),
    googlePlaces: googlePlacesLimiter.getStatus(),
    dsire: desireLimiter.getStatus(),
    utilityRates: utilityRatesLimiter.getStatus()
  };
}

/**
 * Wait until rate limiter allows request
 * Phase 5.2: Blocking wait for rate limit window
 * 
 * @param limiter - Rate limiter instance
 * @param maxWaitMs - Maximum wait time (0 = infinite)
 * @returns true if allowed, false if timeout
 */
export async function waitForRateLimit(
  limiter: RateLimiter,
  maxWaitMs = 0
): Promise<boolean> {
  const startTime = Date.now();

  while (!limiter.canRequest()) {
    const elapsed = Date.now() - startTime;
    if (maxWaitMs > 0 && elapsed > maxWaitMs) {
      return false;
    }

    const resetTime = limiter.getResetTime();
    await new Promise(resolve => setTimeout(resolve, Math.min(resetTime, 100)));
  }

  return true;
}
