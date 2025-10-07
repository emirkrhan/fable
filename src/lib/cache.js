/**
 * Simple in-memory cache for frequently accessed data
 * ✅ FIX #2: Cache layer to reduce Firestore reads
 *
 * Features:
 * - TTL (Time To Live) support
 * - Memory-efficient (auto-cleanup)
 * - Type-safe keys
 * - Performance metrics
 */

class SimpleCache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    // Auto-cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get value from cache
   * @param {string} key
   * @returns {any | null}
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    });
    this.stats.sets++;
  }

  /**
   * Delete key from cache
   * @param {string} key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.evictions += cleaned;
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0
      ? ((this.stats.hits / totalRequests) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      totalRequests
    };
  }

  /**
   * Destroy cache (cleanup interval)
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Singleton instances for different data types
const userCache = new SimpleCache(10 * 60 * 1000); // 10 minutes for user data
const boardCache = new SimpleCache(2 * 60 * 1000);  // 2 minutes for board data

/**
 * Get user info from cache or fetch function
 * @param {string} userId
 * @param {Function} fetchFn - Async function to fetch user if not cached
 */
export async function getCachedUser(userId, fetchFn) {
  const cacheKey = `user:${userId}`;
  const cached = userCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  // Cache miss - fetch from Firestore
  const userData = await fetchFn(userId);
  if (userData) {
    userCache.set(cacheKey, userData);
  }

  return userData;
}

/**
 * Get board from cache or fetch function
 * @param {string} boardId
 * @param {Function} fetchFn
 */
export async function getCachedBoard(boardId, fetchFn) {
  const cacheKey = `board:${boardId}`;
  const cached = boardCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const boardData = await fetchFn(boardId);
  if (boardData) {
    boardCache.set(cacheKey, boardData);
  }

  return boardData;
}

/**
 * Invalidate board cache (call after update)
 * @param {string} boardId
 */
export function invalidateBoardCache(boardId) {
  boardCache.delete(`board:${boardId}`);
}

/**
 * Invalidate user cache (call after profile update)
 * @param {string} userId
 */
export function invalidateUserCache(userId) {
  userCache.delete(`user:${userId}`);
}

/**
 * Get cache stats for monitoring
 */
export function getCacheStats() {
  return {
    users: userCache.getStats(),
    boards: boardCache.getStats()
  };
}

// Cleanup on module unload (for hot reload)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    userCache.destroy();
    boardCache.destroy();
  });
}

export default {
  getCachedUser,
  getCachedBoard,
  invalidateBoardCache,
  invalidateUserCache,
  getCacheStats
};
