import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedUrl,
  setCachedUrl,
  clearCachedUrl,
  clearAllCachedUrls,
  getCacheStats,
} from "../url-cache";

describe("url-cache", () => {
  beforeEach(() => {
    clearAllCachedUrls();
  });

  describe("setCachedUrl and getCachedUrl", () => {
    it("should cache and retrieve a URL", () => {
      const originalUrl = "https://example.com/file.pdf?old=params";
      const authorizedUrl = "https://example.com/file.pdf?X-Amz-Signature=abc";
      const expiresAt = Date.now() + 3600000; // 1 hour from now

      setCachedUrl(originalUrl, authorizedUrl, expiresAt);
      const cached = getCachedUrl(originalUrl);

      expect(cached).toBeTruthy();
      expect(cached?.authorizedUrl).toBe(authorizedUrl);
      expect(cached?.expiresAt).toBe(expiresAt);
    });

    it("should return null for non-existent cache entry", () => {
      const cached = getCachedUrl("https://example.com/nonexistent.pdf");
      expect(cached).toBeNull();
    });

    it("should return null for expired cache entry", () => {
      const originalUrl = "https://example.com/file.pdf";
      const authorizedUrl = "https://example.com/file.pdf?X-Amz-Signature=abc";
      const expiresAt = Date.now() - 1000; // Expired 1 second ago

      setCachedUrl(originalUrl, authorizedUrl, expiresAt);
      const cached = getCachedUrl(originalUrl);

      expect(cached).toBeNull();
    });

    it("should use pathname as cache key (ignoring query params)", () => {
      const url1 = "https://example.com/file.pdf?old=params";
      const url2 = "https://example.com/file.pdf?new=params";
      const authorizedUrl = "https://example.com/file.pdf?X-Amz-Signature=abc";
      const expiresAt = Date.now() + 3600000;

      setCachedUrl(url1, authorizedUrl, expiresAt);
      const cached = getCachedUrl(url2);

      expect(cached).toBeTruthy();
      expect(cached?.authorizedUrl).toBe(authorizedUrl);
    });

    it("should handle null expiresAt", () => {
      const originalUrl = "https://example.com/file.pdf";
      const authorizedUrl = "https://example.com/file.pdf?token=xyz";

      setCachedUrl(originalUrl, authorizedUrl, null);
      const cached = getCachedUrl(originalUrl);

      expect(cached).toBeTruthy();
      expect(cached?.authorizedUrl).toBe(authorizedUrl);
      expect(cached?.expiresAt).toBeNull();
    });
  });

  describe("clearCachedUrl", () => {
    it("should clear a specific cached URL", () => {
      const url1 = "https://example.com/file1.pdf";
      const url2 = "https://example.com/file2.pdf";
      const expiresAt = Date.now() + 3600000;

      setCachedUrl(url1, url1 + "?auth=1", expiresAt);
      setCachedUrl(url2, url2 + "?auth=2", expiresAt);

      clearCachedUrl(url1);

      expect(getCachedUrl(url1)).toBeNull();
      expect(getCachedUrl(url2)).toBeTruthy();
    });
  });

  describe("clearAllCachedUrls", () => {
    it("should clear all cached URLs", () => {
      const url1 = "https://example.com/file1.pdf";
      const url2 = "https://example.com/file2.pdf";
      const expiresAt = Date.now() + 3600000;

      setCachedUrl(url1, url1 + "?auth=1", expiresAt);
      setCachedUrl(url2, url2 + "?auth=2", expiresAt);

      clearAllCachedUrls();

      expect(getCachedUrl(url1)).toBeNull();
      expect(getCachedUrl(url2)).toBeNull();
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", () => {
      const url1 = "https://example.com/file1.pdf";
      const url2 = "https://example.com/file2.pdf";
      const expiresAt = Date.now() + 3600000;

      setCachedUrl(url1, url1 + "?auth=1", expiresAt);
      setCachedUrl(url2, url2 + "?auth=2", expiresAt);

      const stats = getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty("key");
      expect(stats.entries[0]).toHaveProperty("expiresAt");
      expect(stats.entries[0]).toHaveProperty("timestamp");
    });

    it("should return empty stats when cache is empty", () => {
      const stats = getCacheStats();

      expect(stats.size).toBe(0);
      expect(stats.entries).toHaveLength(0);
    });
  });
});
