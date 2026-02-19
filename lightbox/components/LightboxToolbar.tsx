"use client";

import { useCallback } from "react";
import { Download, ExternalLink, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LightboxFile } from "../types";
import { cn } from "@/lib/utils";
import { useAuthorizedFileUrl } from "../hooks/useAuthorizedFileUrl";
import { isDownloadAllowed } from "../utils/file-download";

interface LightboxToolbarProps {
  file: LightboxFile;
  onClose: () => void;
  onToggleInfo?: () => void;
  showDownload?: boolean;
  showInfo?: boolean;
  infoVisible?: boolean;
  className?: string;
}

/**
 * Toolbar with actions for lightbox
 * Download, info, external link, and close buttons with URL refresh support
 */
export function LightboxToolbar({
  file,
  onClose,
  onToggleInfo,
  showDownload = true,
  showInfo = true,
  infoVisible = false,
  className,
}: LightboxToolbarProps) {
  const { authorizedUrl, isRefreshing, refreshAuthorizedUrl } =
    useAuthorizedFileUrl(file.url);
  const downloadAllowed = isDownloadAllowed(file);

  const getFreshUrl = useCallback(async () => {
    try {
      return await refreshAuthorizedUrl();
    } catch (error) {
      console.error(
        "[LightboxToolbar] Failed to refresh URL, falling back to cached URL:",
        error,
      );
      return authorizedUrl;
    }
  }, [authorizedUrl, refreshAuthorizedUrl]);

  const handleDownload = async () => {
    if (!downloadAllowed) {
      return;
    }
    const url = await getFreshUrl();

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      console.error("[LightboxToolbar] Download failed:", downloadError);
    }
  };

  const handleOpenNew = async () => {
    const url = await getFreshUrl();
    window.open(url, "_blank");
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showDownload && (
        <Button
          onClick={handleDownload}
          variant="icon_v2"
          size="icon_v2"
          className="hover:bg-hover backdrop-blur-sm"
          aria-label="Download file"
          disabled={isRefreshing || !downloadAllowed}
        >
          <Download className="w-5 h-5 stroke-icon" />
        </Button>
      )}
      <Button
        onClick={handleOpenNew}
        variant="icon_v2"
        size="icon_v2"
        className=" hover:bg-hover backdrop-blur-sm"
        aria-label="Open in new tab"
        disabled={isRefreshing}
      >
        <ExternalLink className="w-5 h-5 stroke-icon" />
      </Button>
      {showInfo && onToggleInfo && (
        <Button
          onClick={onToggleInfo}
          variant="icon_v2"
          size="icon_v2"
          className={cn(
            "hover:bg-hover backdrop-blur-sm",
            infoVisible && "bg-hover",
          )}
          aria-label="Toggle file info"
        >
          <Info className="w-5 h-5 stroke-icon" />
        </Button>
      )}
      <div className="w-px h-5 bg-border mx-1" />
      <Button
        onClick={onClose}
        variant="icon_v2"
        size="icon_v2"
        className=" hover:bg-hover backdrop-blur-sm "
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5 stroke-icon" />
      </Button>
    </div>
  );
}
