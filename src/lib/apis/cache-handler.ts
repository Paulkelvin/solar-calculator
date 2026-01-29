/**
 * Cache Handler - Response Caching
 * Phase 5.2: In-memory caching for API responses
 * 
 * Status: Stub (Ready for Phase 5.2 implementation)
 * Last Updated: January 29, 2026
 */

import type { GoogleSolarData, AddressAutocompleteResult } from './google-solar-api';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  avgAge: number;
}

/**
 * Generic response cache with TTL
 * Phase 5.2: Stores API responses with expiration
 * 
 * Features:
 * - Automatic expiration based on TTL
 * - Cache statistics
 * - Manual cache clearing
 * - Lazy cleanup on get
 */
export class ResponseCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private hits = 0;
  private misses = 0;

  /**
   * Get cached value if not expired
   */
  get(key: K): V | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  /**
   * Set cache value with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlMs - Time to live in milliseconds (default: 1 hour)
   */
  set(key: K, data: V, ttlMs = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: K): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      avgAge: this.calculateAvgAge()
    };
  }

  /**
   * Get detailed cache entries
   */
  getEntries(): Array<{
    key: K;
    ageMs: number;
    ttlMs: number;
    expiresInMs: number;
  }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => {
      const ageMs = now - entry.timestamp;
      return {
        key,
        ageMs,
        ttlMs: entry.ttlMs,
        expiresInMs: Math.max(0, entry.ttlMs - ageMs)
      };
    });
  }

  private calculateAvgAge(): number {
    if (this.cache.size === 0) return 0;
    const now = Date.now();
    let totalAge = 0;
    for (const entry of this.cache.values()) {
      totalAge += now - entry.timestamp;
    }
    return totalAge / this.cache.size;
  }
}

/**
 * Cache TTL Constants
 * Phase 5.2: Recommended cache durations for different data
 */
export const CACHE_TTL = {
  // Solar data changes rarely (geographic data)
  SOLAR_DATA: 3600000, // 1 hour

  // Address suggestions are stable
  ADDRESSES: 86400000, // 24 hours

  // Incentives update periodically
  INCENTIVES: 604800000, // 7 days

  // Utility rates change seasonally/annually
  UTILITY_RATES: 2592000000, // 30 days

  // Financing quotes are time-sensitive
  FINANCING_QUOTES: 300000, // 5 minutes

  // General short-lived data
  SHORT: 300000, // 5 minutes

  // General medium-lived data
  MEDIUM: 3600000, // 1 hour

  // General long-lived data
  LONG: 604800000 // 7 days
};

/**
 * Singleton cache instances for each API
 * Phase 5.2: Global caches for common queries
 */

// Solar data cache (keyed by placeId)
export const solarDataCache = new ResponseCache<string, GoogleSolarData>();

// Address suggestions cache (keyed by search input)
export const addressCache = new ResponseCache<string, AddressAutocompleteResult[]>();

// Incentives cache (keyed by state code)
export const incentivesCache = new ResponseCache<string, any>();

// Utility rates cache (keyed by utility code)
export const utilityRatesCache = new ResponseCache<string, any>();

/**
 * Get cache key from parameters
 * Phase 5.2: Helper to generate consistent cache keys
 */
export function generateCacheKey(...parts: (string | number)[]): string {
  return parts.join('::');
}

/**
 * Clear all caches
 * Phase 5.2: Used for testing or cache invalidation
 */
export function clearAllCaches(): void {
  solarDataCache.clear();
  addressCache.clear();
  incentivesCache.clear();
  utilityRatesCache.clear();
}

/**
 * Get statistics for all caches
 * Phase 5.2: Monitor cache performance
 */
export function getAllCacheStats() {
  return {
    solarData: solarDataCache.getStats(),
    addresses: addressCache.getStats(),
    incentives: incentivesCache.getStats(),
    utilityRates: utilityRatesCache.getStats()
  };
}
