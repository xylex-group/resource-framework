"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefreshFileUrlResult } from "../utils/url-refresh";
import { refreshFileUrl } from "../utils/url-refresh";
import { getCachedUrl, setCachedUrl } from "../utils/url-cache";

const REFRESH_LEAD_TIME_MS = 15_000;

function parseExpiresFromQuery(url: string): number | null {
  try {
    const urlObj = new URL(url);
    const values = [
      urlObj.searchParams.get("X-Amz-Expires"),
      urlObj.searchParams.get("x-amz-expires"),
      urlObj.searchParams.get("Expires"),
      urlObj.searchParams.get("expires"),
    ];
    for (const value of values) {
      if (value) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
  } catch (error) {
    console.error("[parseExpiresFromQuery] Failed to parse URL:", error);
  }

  return null;
}

/**
 * Hook that keeps an up-to-date, authorized URL for a file and exposes a refresh helper.
 * Use it inside renderers or toolbars that need to re-authorize expired S3/MinIO links.
 * Uses a global cache to prevent unnecessary re-authentication.
 */
export function useAuthorizedFileUrl(initialUrl: string) {
  // Check cache first
  const cached = getCachedUrl(initialUrl);
  
  const [authorizedUrl, setAuthorizedUrl] = useState(() => {
    if (cached) {
      return cached.authorizedUrl;
    }
    return initialUrl;
  });
  
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    if (cached) {
      return cached.expiresAt;
    }
    const expiresIn = parseExpiresFromQuery(initialUrl);
    return expiresIn ? Date.now() + expiresIn * 1000 : null;
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sourceUrlRef = useRef(initialUrl);

  useEffect(() => {
    sourceUrlRef.current = initialUrl;
    
    // Check cache before updating
    const cached = getCachedUrl(initialUrl);
    if (cached) {
      setAuthorizedUrl(cached.authorizedUrl);
      setExpiresAt(cached.expiresAt);
      return;
    }
    
    // No cache, use initial URL
    setAuthorizedUrl(initialUrl);
    const expiresIn = parseExpiresFromQuery(initialUrl);
    const newExpiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;
    setExpiresAt(newExpiresAt);
    
    // Cache the initial URL
    setCachedUrl(initialUrl, initialUrl, newExpiresAt);
  }, [initialUrl]);

  const refreshAuthorizedUrl = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result: RefreshFileUrlResult = await refreshFileUrl(
        sourceUrlRef.current,
      );
      const newExpiresAt = typeof result.expiresIn === "number" && result.expiresIn > 0
        ? Date.now() + result.expiresIn * 1000
        : (() => {
            const expiresIn = parseExpiresFromQuery(result.url);
            return expiresIn ? Date.now() + expiresIn * 1000 : null;
          })();
      
      setAuthorizedUrl(result.url);
      setExpiresAt(newExpiresAt);
      
      // Update cache with new URL
      setCachedUrl(sourceUrlRef.current, result.url, newExpiresAt);
      
      return result.url;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const now = Date.now();
    const refreshTimeout = expiresAt - now - REFRESH_LEAD_TIME_MS;
    if (refreshTimeout <= 0) {
      refreshAuthorizedUrl();
      return;
    }

    const timer = window.setTimeout(() => {
      refreshAuthorizedUrl();
    }, refreshTimeout);

    return () => {
      window.clearTimeout(timer);
    };
  }, [expiresAt, refreshAuthorizedUrl]);

  return {
    authorizedUrl,
    expiresAt,
    isRefreshing,
    refreshAuthorizedUrl,
  };
}
