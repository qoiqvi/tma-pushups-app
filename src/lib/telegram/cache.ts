import { logger } from '@/lib/debug';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple in-memory cache for reducing database queries
 */
class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every minute
    this.startCleanup();
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    logger.info(`[Cache] Set key: ${key}, TTL: ${ttl}ms`);
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      logger.debug(`[Cache] Miss: ${key}`);
      return null;
    }
    
    const age = Date.now() - item.timestamp;
    
    if (age > item.ttl) {
      this.cache.delete(key);
      logger.debug(`[Cache] Expired: ${key}`);
      return null;
    }
    
    logger.debug(`[Cache] Hit: ${key}`);
    return item.data as T;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`[Cache] Deleted: ${key}`);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    logger.info('[Cache] Cleared all entries');
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let deleted = 0;
      
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
          deleted++;
        }
      }
      
      if (deleted > 0) {
        logger.debug(`[Cache] Cleanup: removed ${deleted} expired entries`);
      }
    }, 60000); // Every minute
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const cache = new MemoryCache();

/**
 * Cache decorator for async functions
 */
export function withCache<T>(
  key: string | ((args: any[]) => string),
  ttl: number = 300000
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof key === 'function' ? key(args) : key;
      
      // Check cache first
      const cached = cache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // Call original method
      const result = await method.apply(this, args);
      
      // Store in cache
      if (result !== null && result !== undefined) {
        cache.set(cacheKey, result, ttl);
      }
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Helper to generate cache keys
 */
export const cacheKeys = {
  user: (telegramId: number) => `user:${telegramId}`,
  userStats: (telegramId: number) => `stats:${telegramId}`,
  workout: (workoutId: string) => `workout:${workoutId}`,
  workouts: (telegramId: number, limit?: number) => `workouts:${telegramId}:${limit || 'all'}`,
  reminders: (telegramId: number) => `reminders:${telegramId}`
};