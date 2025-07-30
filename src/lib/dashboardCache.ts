interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number;
}

class DashboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50
  };

  private getCacheKey(userId: string, dataType: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${userId}:${dataType}:${paramString}`;
  }

  set<T>(userId: string, dataType: string, data: T, config?: Partial<CacheConfig>, params?: Record<string, any>): void {
    const key = this.getCacheKey(userId, dataType, params);
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Clean up expired entries and enforce max size
    this.cleanup();
    
    if (this.cache.size >= finalConfig.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + finalConfig.ttl
    });

    console.log(`📦 Cached ${dataType} for user ${userId.substring(0, 8)}`);
  }

  get<T>(userId: string, dataType: string, params?: Record<string, any>): T | null {
    const key = this.getCacheKey(userId, dataType, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`🗑️ Expired cache entry for ${dataType}`);
      return null;
    }

    console.log(`🎯 Cache hit for ${dataType}`);
    return entry.data;
  }

  has(userId: string, dataType: string, params?: Record<string, any>): boolean {
    const key = this.getCacheKey(userId, dataType, params);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  invalidate(userId: string, dataType?: string): void {
    if (dataType) {
      // Invalidate specific data type
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(`${userId}:${dataType}:`)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🧹 Invalidated ${dataType} cache for user ${userId.substring(0, 8)}`);
    } else {
      // Invalidate all data for user
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(`${userId}:`)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🧹 Invalidated all cache for user ${userId.substring(0, 8)}`);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys = Array.from(this.cache.entries())
      .filter(([_, entry]) => now > entry.expiresAt)
      .map(([key, _]) => key);
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  clear(): void {
    this.cache.clear();
    console.log('🧹 Cleared all cache');
  }

  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export const dashboardCache = new DashboardCache();