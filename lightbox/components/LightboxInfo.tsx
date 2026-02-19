"use client";

import type { LightboxFile } from "../types";
import { formatDate, formatFileSize } from "../utils/format";
import { detectFileType } from "../utils/file-type-detector";
import { cn } from "@/lib/utils";

interface LightboxInfoProps {
  file: LightboxFile;
  isVisible: boolean;
  className?: string;
}

/**
 * File information panel for lightbox
 * Displays metadata about the current file
 */
export function LightboxInfo({
  file,
  isVisible,
  className,
}: LightboxInfoProps) {
  if (!isVisible) {
    return null;
  }

  const fileType = detectFileType(file);

  return (
    <div
      className={cn(
        "absolute right-0 top-0 bottom-0 w-80 bg-background border-l border-border p-4 overflow-y-auto",
        "transition-transform duration-200",
        isVisible ? "translate-x-0" : "translate-x-full",
        className,
      )}
    >
      <div className="space-y-4">
        <div>
          <div className="text-xs text-secondary mb-1">File name</div>
          <div className="text-sm text-primary wrap-break-word">
            {file.name}
          </div>
        </div>

        <div>
          <div className="text-xs text-secondary mb-1">Type</div>
          <div className="text-sm text-primary capitalize">{fileType}</div>
        </div>

        {file.type && (
          <div>
            <div className="text-xs text-secondary mb-1">MIME type</div>
            <div className=" text-primary font-mono text-xs">{file.type}</div>
          </div>
        )}

        {file.size && (
          <div>
            <div className="text-xs text-secondary mb-1">Size</div>
            <div className="text-sm text-primary">
              {formatFileSize(file.size)}
            </div>
          </div>
        )}

        {file.created_at && (
          <div>
            <div className="text-xs text-secondary mb-1">Created</div>
            <div className="text-sm text-primary">
              {formatDate(file.created_at)}
            </div>
          </div>
        )}

        {file.updated_at && (
          <div>
            <div className="text-xs text-secondary mb-1">Modified</div>
            <div className="text-sm text-primary">
              {formatDate(file.updated_at)}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-secondary mb-1">URL</div>
          <div className="text-xs text-primary break-all font-mono opacity-70">
            {file.url}
          </div>
        </div>
      </div>
    </div>
  );
}
