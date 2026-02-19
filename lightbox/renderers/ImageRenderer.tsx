"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { LightboxRendererProps } from "../types";
import { cn } from "@/lib/utils";
import { useAuthorizedFileUrl } from "../hooks/useAuthorizedFileUrl";

/**
 * Image renderer for lightbox
 * Handles image loading states and display with automatic URL refresh for expired URLs
 * Uses dimension checking to ensure the image is valid before hiding the loader
 */
export function ImageRenderer({
  file,
  isActive,
  onLoad,
  onError
}: LightboxRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasValidSize, setHasValidSize] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { authorizedUrl, isRefreshing, refreshAuthorizedUrl } =
    useAuthorizedFileUrl(file.url);

  const resetViewerState = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setHasValidSize(false);
  }, []);

  // Reset URL when file changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      resetViewerState();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [file.url, resetViewerState]);

  // Check image dimensions to confirm it's valid
  const checkImageSize = useCallback((img: HTMLImageElement) => {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setHasValidSize(true);
      setIsLoading(false);
      onLoad?.();
      return true;
    }
    return false;
  }, [onLoad]);

  const handleLoad = () => {
    if (imgRef.current) {
      checkImageSize(imgRef.current);
    }
  };

  // Fallback: poll for dimensions if load event doesn't fire reliably
  useEffect(() => {
    if (!imgRef.current || hasValidSize || hasError || isRefreshing) return;

    const img = imgRef.current;
    const pollInterval = setInterval(() => {
      if (checkImageSize(img)) {
        clearInterval(pollInterval);
      }
    }, 100);

    // Stop polling after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [authorizedUrl, hasValidSize, hasError, isRefreshing, checkImageSize]);

  const handleError = async () => {
    // If we're already refreshing, don't try again
    if (isRefreshing) {
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(`Failed to load image: ${file.name}`));
      return;
    }

    try {
      console.log("[ImageRenderer] Image failed to load, attempting to refresh URL...");
      await refreshAuthorizedUrl();
      console.log("[ImageRenderer] Successfully refreshed URL");
      setIsLoading(true);
      setHasError(false);
      setHasValidSize(false);
    } catch (refreshError) {
      console.error("[ImageRenderer] Failed to refresh URL:", refreshError);
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(`Failed to load image: ${file.name}`));
    }
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-secondary">
        <div className="text-sm">Failed to load image</div>
        <div className="text-xs opacity-70">{file.name}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {(!hasValidSize || isRefreshing) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 stroke-icon animate-spin" />
            {isRefreshing && (
              <div className="text-xs text-secondary">Refreshing URL...</div>
            )}
          </div>
        </div>
      )}
      <img
        ref={imgRef}
        key={authorizedUrl}
        src={authorizedUrl}
        alt={file.name}
        className={cn(
          "max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-200",
          (!hasValidSize || isRefreshing) ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={isActive ? "eager" : "lazy"}
      />
    </div>
  );
}
