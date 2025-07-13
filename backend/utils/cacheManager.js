// Simple in-memory cache manager for frequently accessed data
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each key
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttl);

    // Clean up expired entries periodically
    this.cleanup();
  }

  get(key) {
    const expiry = this.ttl.get(key);

    if (!expiry || Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Cache middleware for Express routes
const cacheMiddleware = (ttl = 5 * 60 * 1000) => {
  return (req, res, next) => {
    const key = `${req.method}:${req.originalUrl}`;
    const cached = cacheManager.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cacheManager.set(key, data, ttl);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Invalidate cache for specific patterns
const invalidateCache = (pattern) => {
  const keys = Array.from(cacheManager.cache.keys());
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cacheManager.delete(key);
    }
  });
};

module.exports = {
  cacheManager,
  cacheMiddleware,
  invalidateCache,
};