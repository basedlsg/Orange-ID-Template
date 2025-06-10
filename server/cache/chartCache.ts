import crypto from 'crypto';
import { cacheConfig } from '../config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ChartCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = cacheConfig.maxSize;
  private defaultTTL: number = cacheConfig.ttl;

  /**
   * Generate a cache key from chart calculation parameters
   */
  generateKey(params: {
    utcDateTime: Date;
    latitude: number;
    longitude: number;
  }): string {
    const str = `${params.utcDateTime.toISOString()}-${params.latitude}-${params.longitude}`;
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Get cached chart data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Set chart data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private hits = 0;
  private misses = 0;

  private calculateHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  /**
   * Record cache hit
   */
  recordHit(): void {
    this.hits++;
  }

  /**
   * Record cache miss
   */
  recordMiss(): void {
    this.misses++;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

// Create singleton instance
export const chartCache = new ChartCache();

// Run cleanup every hour
setInterval(() => {
  chartCache.cleanup();
}, 60 * 60 * 1000);