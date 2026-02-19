/**
 * Global cache for authorized file URLs
 * Prevents unnecessary re-authentication of S3/MinIO URLs
 */

interface CachedUrl {
  authorizedUrl: string;
  expiresAt: number | null;
  timestamp: number;
}

const urlCache = new Map<string, CachedUrl>();

/**
 * Extract a cache key from a URL (removes query params to get base URL)
 */
function getCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // Use pathname as cache key (without query params)
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Get cached URL if it exists and hasn't expired
 */
export function getCachedUrl(originalUrl: string): CachedUrl | null {
  const key = getCacheKey(originalUrl);
  const cached = urlCache.get(key);

  if (!cached) {
    return null;
  }

  // Check if expired
  if (cached.expiresAt && cached.expiresAt < Date.now()) {
    urlCache.delete(key);
    return null;
  }

  return cached;
}

/**
 * Store URL in cache
 */
export function setCachedUrl(
  originalUrl: string,
  authorizedUrl: string,
  expiresAt: number | null,
): void {
  const key = getCacheKey(originalUrl);
  urlCache.set(key, {
    authorizedUrl,
    expiresAt,
    timestamp: Date.now(),
  });
}

/**
 * Clear a specific URL from cache
 */
export function clearCachedUrl(originalUrl: string): void {
  const key = getCacheKey(originalUrl);
  urlCache.delete(key);
}

/**
 * Clear all cached URLs
 */
export function clearAllCachedUrls(): void {
  urlCache.clear();
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats() {
  return {
    size: urlCache.size,
    entries: Array.from(urlCache.entries()).map(([key, value]) => ({
      key,
      expiresAt: value.expiresAt,
      timestamp: value.timestamp,
    })),
  };
}
