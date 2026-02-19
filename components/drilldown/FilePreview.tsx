"use client";

import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthorizedFileUrl } from "@/packages/resource-framework/lightbox/hooks/useAuthorizedFileUrl";

/** Minimal file shape needed for preview; compatible with FileItem from drilldown-file-explorer */
export interface FilePreviewItem {
  id: string;
  name: string;
  url: string;
  type?: string;
  file_name?: string;
  hasValidUrl?: boolean;
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
const VIDEO_EXTS = ["mp4", "avi", "mov", "wmv", "webm", "mkv"];

function getExtAndMime(file: FilePreviewItem) {
  const name = file.file_name ?? file.name;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const mime = (file.type ?? "").toLowerCase();
  return { ext, mime };
}

/**
 * Returns true if the file can be shown as an image or video preview (not just an icon).
 */
export function isPreviewableFile(file: FilePreviewItem): boolean {
  if (!file.url) return false;
  const { ext, mime } = getExtAndMime(file);
  if (IMAGE_EXTS.includes(ext) || mime.startsWith("image/")) return true;
  if (VIDEO_EXTS.includes(ext) || mime.startsWith("video/")) return true;
  return false;
}

function isImageFile(file: FilePreviewItem): boolean {
  const { ext, mime } = getExtAndMime(file);
  return IMAGE_EXTS.includes(ext) || mime.startsWith("image/");
}

function isVideoFile(file: FilePreviewItem): boolean {
  const { ext, mime } = getExtAndMime(file);
  return VIDEO_EXTS.includes(ext) || mime.startsWith("video/");
}

function getFileIcon(file: FilePreviewItem) {
  const { ext, mime } = getExtAndMime(file);
  const name = file.file_name ?? file.name;

  if (
    IMAGE_EXTS.includes(ext) ||
    mime.startsWith("image/")
  ) {
    return <FileImage className="h-5 w-5 text-blue-500 shrink-0" />;
  }
  if (
    ["pdf", "doc", "docx", "txt", "rtf", "odt"].includes(ext) ||
    mime.includes("document") ||
    mime.includes("pdf")
  ) {
    return <FileText className="h-5 w-5 text-red-500 shrink-0" />;
  }
  if (
    ["xls", "xlsx", "csv", "ods"].includes(ext) ||
    mime.includes("spreadsheet") ||
    mime.includes("excel")
  ) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500 shrink-0" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="h-5 w-5 text-yellow-600 shrink-0" />;
  }
  if (VIDEO_EXTS.includes(ext) || mime.startsWith("video/")) {
    return <FileVideo className="h-5 w-5 text-purple-500 shrink-0" />;
  }
  if (
    ["mp3", "wav", "ogg", "flac", "aac"].includes(ext) ||
    mime.startsWith("audio/")
  ) {
    return <FileAudio className="h-5 w-5 text-pink-500 shrink-0" />;
  }
  return <File className="h-5 w-5 text-icon shrink-0" />;
}

export interface FilePreviewProps {
  file: FilePreviewItem;
  variant: "list" | "grid";
  className?: string;
}

/** Helper that keeps an up-to-date, authorized URL for media thumbnails. */
function AuthorizedImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const { authorizedUrl } = useAuthorizedFileUrl(src);

  return (
    <img
      src={authorizedUrl}
      alt={alt ?? ""}
      loading="lazy"
      className={className}
    />
  );
}

function AuthorizedVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const { authorizedUrl } = useAuthorizedFileUrl(src);

  return (
    <video
      src={authorizedUrl}
      muted
      playsInline
      preload="metadata"
      className={className}
    />
  );
}

/**
 * Renders an actual image/video thumbnail when possible, otherwise a type icon.
 * Use variant "list" for compact row thumbnails, "grid" for larger tiles.
 */
export function FilePreview({ file, variant, className }: FilePreviewProps) {
  const canPreview = isPreviewableFile(file) && file.hasValidUrl;
  const isList = variant === "list";

  const sizeClasses = isList
    ? "h-10 w-10 shrink-0 rounded-sm overflow-hidden bg-muted"
    : "aspect-square w-full max-w-30 rounded-sm overflow-hidden bg-muted";

  if (canPreview && isImageFile(file)) {
    return (
      <div className={cn(sizeClasses, className)}>
        <AuthorizedImage
          src={file.url}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (canPreview && isVideoFile(file)) {
    return (
      <div className={cn(sizeClasses, "relative", className)}>
        <AuthorizedVideo
          src={file.url}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted rounded-sm",
        isList ? "h-10 w-10 shrink-0" : "aspect-square w-full max-w-30",
        className,
      )}
    >
      {getFileIcon(file)}
    </div>
  );
}
