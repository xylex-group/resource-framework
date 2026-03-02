"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { LightboxRendererProps } from "../types";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@/components/ui/video-player";
import { useAuthorizedFileUrl } from "../hooks/useAuthorizedFileUrl";

/**
 * Video renderer for lightbox
 * Includes full video player controls and automatic URL refresh for expired URLs
 */
export function VideoRenderer({
  file,
  isActive,
  onLoad,
  onError,
  onClose,
}: LightboxRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const maxMediaHeight = "calc(100vh - 8rem)";
  const {
    authorizedUrl: videoUrl,
    isRefreshing,
    refreshAuthorizedUrl,
  } = useAuthorizedFileUrl(file.url);

  // Reset UI state when the source file changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasError(false);
      setIsLoading(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [file.url]);

  const handleLoadedData = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = async () => {
    if (isRefreshing) {
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(`Failed to load video: ${file.name}`));
      return;
    }

    try {
      console.log(
        "[VideoRenderer] Video failed to load, attempting to refresh URL...",
      );
      await refreshAuthorizedUrl();
      console.log("[VideoRenderer] Successfully refreshed URL");
      setIsLoading(true);
      setHasError(false);
    } catch (refreshError) {
      console.error("[VideoRenderer] Failed to refresh URL:", refreshError);
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(`Failed to load video: ${file.name}`));
    }
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-secondary">
        <div className="text-sm">Failed to load video</div>
        <div className="text-xs opacity-70">{file.name}</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full flex items-center justify-center p-4"
      style={{ maxHeight: maxMediaHeight }}
    >
      {(isLoading || isRefreshing) && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 stroke-icon animate-spin" />
            {isRefreshing && (
              <div className="text-xs text-secondary">Refreshing URL...</div>
            )}
          </div>
        </div>
      )}
      <VideoPlayer
        className="max-w-full max-h-full cursor-default rounded-md"
        style={{
          width: "fit-content",
          height: "fit-content",
          maxWidth: "100%",
          maxHeight: maxMediaHeight,
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      >
        <VideoPlayerContent
          key={videoUrl}
          crossOrigin=""
          preload={isActive ? "auto" : "none"}
          slot="media"
          src={videoUrl}
          controls={false}
          className="object-contain rounded-md"
          style={{
            maxWidth: "100%",
            maxHeight: maxMediaHeight,
          }}
          onLoadedData={handleLoadedData}
          onError={handleError}
        />
        <VideoPlayerControlBar className="max-h-16">
          <VideoPlayerPlayButton noTooltip />
          {/* <VideoPlayerSeekBackwardButton /> */}
          {/* <VideoPlayerSeekForwardButton /> */}
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay
            showDuration
            className="text-white dark:text-secondary"
          />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>
    </div>
  );
}
