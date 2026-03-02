"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { LightboxRendererProps } from "../types";
import { Button } from "@/components/ui/button";
import { useAuthorizedFileUrl } from "../hooks/useAuthorizedFileUrl";
import { isExpiredUrlError } from "../utils/url-refresh";

/**
 * PDF renderer for lightbox
 * Uses iframe with fallback options and automatic URL refresh for expired URLs
 */
export function PdfRenderer({
  file,
  isActive: _isActive,
  onLoad,
  onError,
}: LightboxRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [authorizationError, setAuthorizationError] = useState<string | null>(
    null,
  );
  const {
    authorizedUrl: pdfUrl,
    isRefreshing,
    refreshAuthorizedUrl,
  } = useAuthorizedFileUrl(file.url);

  // Reset URL when file changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasError(false);
      setIsLoading(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [file.url]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleRetry = async () => {
    setHasError(false);
    setIsLoading(true);
    setAuthorizationError(null);
    try {
      await refreshAuthorizedUrl();
    } catch (retryError) {
      setAuthorizationError(
        isExpiredUrlError(retryError)
          ? "You are not authorized to view this file"
          : "Failed to re-authorize PDF access",
      );
      setHasError(true);
      setIsLoading(false);
      onError?.(
        retryError instanceof Error
          ? retryError
          : new Error(String(retryError)),
      );
    }
  };

  const handleError = async () => {
    if (isRefreshing) {
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(`Failed to load PDF: ${file.name}`));
      return;
    }

    try {
      console.log(
        "[PdfRenderer] PDF failed to load, attempting to refresh URL...",
      );
      await refreshAuthorizedUrl();
      console.log("[PdfRenderer] Successfully refreshed URL");
      setIsLoading(true);
      setHasError(false);
      setAuthorizationError(null);
    } catch (refreshError) {
      console.error("[PdfRenderer] Failed to refresh URL:", refreshError);
      setIsLoading(false);
      setHasError(true);
      setAuthorizationError(
        isExpiredUrlError(refreshError)
          ? "You are not authorized to view this file"
          : `Failed to load PDF: ${file.name}`,
      );
      onError?.(
        refreshError instanceof Error
          ? refreshError
          : new Error(String(refreshError)),
      );
    }
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-secondary">
        <div className="text-sm">Failed to load PDF</div>
        <div className="text-xs opacity-70">
          {authorizationError || file.name}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRetry}
            variant="brand"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col p-4">
      {(isLoading || isRefreshing) && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 stroke-icon animate-spin" />
            {isRefreshing && (
              <div className="text-xs text-secondary">Refreshing URL...</div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <iframe
          key={pdfUrl}
          src={`${pdfUrl}#zoom=100`}
          className="w-full h-full border-0 rounded-sm"
          title={file.name}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
}
