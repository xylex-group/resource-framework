"use client";

import { useCallback } from "react";
import { FileQuestion, Download, ExternalLink } from "lucide-react";
import type { LightboxRendererProps } from "../types";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "../utils/format";
import { useAuthorizedFileUrl } from "../hooks/useAuthorizedFileUrl";

/**
 * Fallback renderer for unsupported file types
 * Shows file info and download options with URL refresh support
 */
export function UnsupportedRenderer({ file }: LightboxRendererProps) {
  const { authorizedUrl, isRefreshing, refreshAuthorizedUrl } =
    useAuthorizedFileUrl(file.url);

  const getFreshUrl = useCallback(async () => {
    try {
      return await refreshAuthorizedUrl();
    } catch (error) {
      console.error(
        "[UnsupportedRenderer] Failed to refresh URL, using cached:",
        error,
      );
      return authorizedUrl;
    }
  }, [authorizedUrl, refreshAuthorizedUrl]);

  const handleDownload = useCallback(async () => {
    try {
      const url = await getFreshUrl();
      const { downloadS3File } = await import("../../utils/s3-file-handler");
      await downloadS3File(url, file.name);
    } catch (error) {
      console.error("[UnsupportedRenderer] Download failed:", error);
    }
  }, [file.name, getFreshUrl]);

  const handleOpenNew = async () => {
    const url = await getFreshUrl();
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
      <FileQuestion className="w-16 h-16 stroke-icon opacity-50" />
      <div>
        <div className="text-primary font-medium mb-2">{file.name}</div>
        <div className="text-sm text-secondary mb-1">
          Preview not available for this file type
        </div>
        {file.size && (
          <div className="text-xs text-secondary opacity-70">
            {formatFileSize(file.size)}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          variant="brand"
          size="sm"
          disabled={isRefreshing}
        >
          <Download className="w-4 h-4 stroke-white mr-2" />
          {isRefreshing ? "Refreshing..." : "Download"}
        </Button>
        <Button
          onClick={handleOpenNew}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          <ExternalLink className="w-4 h-4 stroke-icon mr-2" />
          Open in new tab
        </Button>
      </div>
    </div>
  );
}
