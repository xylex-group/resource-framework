"use client";

import { FileIcon } from "lucide-react";
import type { LightboxFile } from "../types";
import { detectFileType } from "../utils/file-type-detector";
import { cn } from "@/lib/utils";

interface LightboxThumbnailsProps {
  files: LightboxFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

/**
 * Thumbnail strip for lightbox
 * Shows all files with visual indication of current selection
 */
export function LightboxThumbnails({
  files,
  currentIndex,
  onSelect,
  className,
}: LightboxThumbnailsProps) {
  if (files.length <= 1) {
    return null;
  }

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {files.map((file, index) => {
        const fileType = detectFileType(file);
        const isActive = index === currentIndex;
        const isImage = fileType === "image";

        return (
          <button
            key={file.id}
            onClick={() => onSelect(index)}
            className={cn(
              "shrink-0 w-16 h-16 rounded-sm border-2 overflow-hidden transition-all",
              "hover:border-brand focus:outline-none focus:border-brand",
              isActive 
                ? "border-brand ring-2 ring-brand/20" 
                : "border-border"
            )}
            aria-label={`View ${file.name}`}
          >
            {isImage ? (
              <img
                src={file.thumbnail || file.url}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-hover">
                <FileIcon className="w-6 h-6 stroke-icon" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
