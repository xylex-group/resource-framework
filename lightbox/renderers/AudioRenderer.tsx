"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Music } from "lucide-react";
import type { LightboxRendererProps } from "../types";
import { useAuthorizedFileUrl } from "../hooks/useAuthorizedFileUrl";

/**
 * Audio renderer for lightbox
 * Simple audio player with native controls and automatic URL refresh for expired URLs
 */
export function AudioRenderer({
  file,
  isActive,
  onLoad,
  onError
}: LightboxRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { authorizedUrl, isRefreshing, refreshAuthorizedUrl } =
    useAuthorizedFileUrl(file.url);

  const resetViewerState = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
  }, []);

  // Reset URL when file changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      resetViewerState();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [file.url, resetViewerState]);

  const handleLoadedData = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = async () => {
    if (isRefreshing) {
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(`Failed to load audio: ${file.name}`));
      return;
    }

    try {
      console.log(
        "[AudioRenderer] Audio failed to load, attempting to refresh URL...",
      );
      await refreshAuthorizedUrl();
      setIsLoading(true);
      setHasError(false);
    } catch (refreshError) {
      console.error("[AudioRenderer] Failed to refresh URL:", refreshError);
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(`Failed to load audio: ${file.name}`));
    }
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-secondary">
        <Music className="w-12 h-12 stroke-icon opacity-50" />
        <div className="text-sm">Failed to load audio</div>
        <div className="text-xs opacity-70">{file.name}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-6 px-8">
      {(isLoading || isRefreshing) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 stroke-icon animate-spin" />
            {isRefreshing && (
              <div className="text-xs text-secondary">Refreshing URL...</div>
            )}
          </div>
        </div>
      )}
      <Music className="w-16 h-16 stroke-icon opacity-70" />
      <div className="text-center">
        <div className="text-primary font-medium mb-1">{file.name}</div>
        {file.size && (
          <div className="text-xs text-secondary">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        )}
      </div>
      <audio
        key={authorizedUrl}
        src={authorizedUrl}
        controls
        className="w-full max-w-md"
        preload={isActive ? "auto" : "none"}
        onLoadedData={handleLoadedData}
        onError={handleError}
      />
    </div>
  );
}
