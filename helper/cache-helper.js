/**
 * Simple in-memory TTL-based caching helper.
 */
class CacheHelper {
  constructor(maxItems = 2000) {
    this.cache = new Map();
    this.maxItems = maxItems;
  }

  /**
   * Set a value in the cache with a TTL (Time To Live).
   * @param {string} key
   * @param {any} value
   * @param {number} ttlMs TTL in milliseconds. Defaults to 24 hours (86,400,000ms).
   */
  set(key, value, ttlMs = 86400000) {
    // Basic eviction policy: remove oldest if limit reached
    if (this.cache.size >= this.maxItems && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache if it hasn't expired.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Clear the cache.
   */
  clear() {
    this.cache.clear();
  }
}

module.exports = new CacheHelper();
