// Cache utility for storing API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class APICache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private localStoragePrefix = 'finance_app_cache_';

  // Set cache with expiration time
  set<T>(key: string, data: T, expiresInMs: number = 5 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs
    };
    
    // Store in memory
    this.cache.set(key, item);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem(
        this.localStoragePrefix + key,
        JSON.stringify(item)
      );
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  // Get from cache if not expired
  get<T>(key: string): T | null {
    // Try memory cache first
    let item = this.cache.get(key);
    
    // Fallback to localStorage
    if (!item) {
      try {
        const stored = localStorage.getItem(this.localStoragePrefix + key);
        if (stored) {
          item = JSON.parse(stored);
          // Restore to memory cache
          if (item) {
            this.cache.set(key, item);
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }

    if (!item) return null;

    // Check if expired
    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Delete from cache
  delete(key: string): void {
    this.cache.delete(key);
    try {
      localStorage.removeItem(this.localStoragePrefix + key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    try {
      // Clear all items with our prefix from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.localStoragePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // Get cache info for debugging
  getInfo(): { memorySize: number; expirationTimes: Record<string, string> } {
    const expirationTimes: Record<string, string> = {};
    
    this.cache.forEach((item, key) => {
      const expiresAt = new Date(item.timestamp + item.expiresIn);
      expirationTimes[key] = expiresAt.toLocaleString();
    });

    return {
      memorySize: this.cache.size,
      expirationTimes
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

// Cache duration constants
export const CACHE_DURATIONS = {
  STOCKS: 2 * 60 * 1000,      // 2 minutes for stock data
  NEWS: 10 * 60 * 1000,        // 10 minutes for news (reduced to save API calls)
  SENTIMENT: 10 * 60 * 1000,   // 10 minutes for sentiment analysis (reduced to save Gemini calls)
  ANALYSIS: 30 * 60 * 1000,   // 30 minutes for AI analysis
} as const;

// Utility function to create cache key
export function createCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint;
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
    
  return `${endpoint}?${sortedParams}`;
}

// Hook for cached API calls
export async function cachedFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  cacheDuration: number = CACHE_DURATIONS.STOCKS
): Promise<T> {
  // Check cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    console.log(`Cache hit for: ${cacheKey}`);
    return cached;
  }

  // Fetch fresh data
  console.log(`Cache miss, fetching: ${cacheKey}`);
  const data = await fetchFn();
  
  // Store in cache
  apiCache.set(cacheKey, data, cacheDuration);
  
  return data;
} 