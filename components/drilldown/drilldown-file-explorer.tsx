"use client";

import React, { DragEvent, useCallback, useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  Eye,
  Grid,
  List,
  Loader2,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DrilldownSection } from "./drilldown-section";
import { FilePreview } from "./FilePreview";
import { useNotification } from "@/hooks/use-notifications";
import {
  Lightbox,
  type LightboxFile,
  refreshFileUrl,
  useLightbox,
} from "../../lightbox";
import { CLOSE_USER_POPOVER_EVENT } from "@/lib/events/popover-events";
import { isDownloadAllowed } from "../../lightbox/utils/file-download";

export interface FileItem {
  id: string;
  name: string;
  url: string;
  file_name?: string;
  file_url?: string;
  size?: number;
  type?: string;
  created_at?: string;
  updated_at?: string;
  hasValidUrl?: boolean;
  downloadAllowed?: boolean;
}

export interface DrilldownFileExplorerProps {
  title?: string;
  files?: FileItem[];
  isLoading?: boolean;
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (fileId: string) => Promise<void>;
  onDownload?: (file: FileItem) => void;
  onPreview?: (file: FileItem) => void;
  uploadDir?: string;
  organizationId?: string;
  resourceId?: string;
  resourceType?: string;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  allowUpload?: boolean;
  allowDelete?: boolean;
  emptyMessage?: string;
  className?: string;
  disableSectionWrapper?: boolean;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
};

const isValidHttpUrl = (url?: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

interface FileListRowProps {
  file: FileItem & { hasValidUrl?: boolean };
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onOpenInNewTab: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
  allowDelete: boolean;
  deletingId: string | null;
  formatFileSize: (bytes?: number) => string;
  formatDate: (dateString?: string) => string;
  downloadAllowed: boolean;
}

function FileListRow({
  file,
  onPreview,
  onDownload,
  onOpenInNewTab,
  onDelete,
  allowDelete,
  deletingId,
  formatFileSize,
  formatDate,
  downloadAllowed,
}: FileListRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPreview(file);
        }
      }}
      onDoubleClick={() => onPreview(file)}
      className="flex items-center justify-between rounded-sm border bg-card p-3 hover:bg-hover transition-colors cursor-pointer"
    >
      <div className="flex min-w-0 items-center gap-3">
        <FilePreview file={file} variant="list" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-primary">
            {file.name}
          </p>
          <p className="text-xs text-secondary">
            {formatFileSize(file.size)} • {formatDate(file.created_at)}
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon_v2"
            className="h-8 w-8 shrink-0"
            disabled={deletingId === file.id}
            onClick={(e) => e.stopPropagation()}
          >
            {deletingId === file.id
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!file.hasValidUrl}
            onClick={() => onPreview(file)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!file.hasValidUrl || !downloadAllowed}
            onClick={() => onDownload(file)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!file.hasValidUrl}
            onClick={() => onOpenInNewTab(file)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in new tab
          </DropdownMenuItem>
          {allowDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(file.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface FileGridTileProps {
  file: FileItem & { hasValidUrl?: boolean };
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
  allowDelete: boolean;
  deletingId: string | null;
  formatFileSize: (bytes?: number) => string;
  downloadAllowed: boolean;
}

function FileGridTile({
  file,
  onPreview,
  onDownload,
  onDelete,
  allowDelete,
  deletingId,
  formatFileSize,
  downloadAllowed,
}: FileGridTileProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPreview(file);
        }
      }}
      onDoubleClick={() => onPreview(file)}
      className="group relative flex flex-col items-center rounded-sm border bg-card p-4 hover:bg-hover transition-colors cursor-pointer"
    >
      <div className="mb-2 w-full flex justify-center">
        <FilePreview file={file} variant="grid" />
      </div>
      <p className="text-xs font-medium text-primary text-center truncate w-full">
        {file.name}
      </p>
      <p className="text-xs text-secondary mt-1">{formatFileSize(file.size)}</p>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          variant="secondary"
          size="icon_v2"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDownload(file);
          }}
          disabled={!file.hasValidUrl || !downloadAllowed}
        >
          <Download className="h-3 w-3" />
        </Button>
        {allowDelete && (
          <Button
            variant="secondary"
            size="icon_v2"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(file.id);
            }}
            disabled={deletingId === file.id}
          >
            {deletingId === file.id
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Trash2 className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}

export function DrilldownFileExplorer({
  title = "Files",
  files = [],
  isLoading = false,
  onUpload,
  onDelete,
  onDownload,
  onPreview,
  uploadDir: _uploadDir,
  organizationId: _organizationId,
  resourceId: _resourceId,
  resourceType: _resourceType,
  maxFileSize = 20,
  acceptedTypes,
  allowUpload = true,
  allowDelete = true,
  emptyMessage = "No files attached",
  className,
  disableSectionWrapper = false,
}: DrilldownFileExplorerProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { notification } = useNotification();
  const { state: lightboxState, openLightbox, closeLightbox } = useLightbox();
  const dispatchCloseUserPopovers = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(CLOSE_USER_POPOVER_EVENT));
  }, []);

  const getAuthorizedUrl = useCallback(async (url: string) => {
    try {
      const refreshed = await refreshFileUrl(url);
      return refreshed.url;
    } catch (error) {
      console.error("[DrilldownFileExplorer] refreshFileUrl failed:", error);
      return url;
    }
  }, []);

  const downloadBlob = useCallback(async (url: string, filename: string) => {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, []);

  const filesWithValidity = useMemo(
    () =>
      files.map((file) => ({
        ...file,
        hasValidUrl: isValidHttpUrl(file.url),
        downloadAllowed: isDownloadAllowed(file),
      })),
    [files],
  );

  // Convert files to lightbox format
  const lightboxFiles: LightboxFile[] = useMemo(
    () =>
      filesWithValidity.map((file) => ({
        id: file.id,
        name: file.file_name || file.name,
        url: file.url,
        type: file.type,
        size: file.size,
        created_at: file.created_at,
        updated_at: file.updated_at,
        thumbnail: file.url,
      })),
    [filesWithValidity],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (allowUpload) {
      setIsDragging(true);
    }
  }, [allowUpload]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // real mature
  const handleUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0 || !onUpload) return;

      const filesToUpload: File[] = [];

      for (const file of Array.from(fileList)) {
        if (file.size > maxFileSize * 1024 * 1024) {
          notification({
            message: `${file.name} exceeds ${maxFileSize}MB limit`,
            success: false,
          });
          continue;
        }
        filesToUpload.push(file);
      }

      if (filesToUpload.length === 0) return;

      setIsUploading(true);
      try {
        await onUpload(filesToUpload);
        notification({
          message: `${filesToUpload.length} file${
            filesToUpload.length > 1 ? "s" : ""
          } uploaded`,
          success: true,
        });
      } catch (error) {
        notification({
          message: "Failed to upload files",
          success: false,
        });
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
        setIsDragging(false);
      }
    },
    [onUpload, maxFileSize, notification],
  );

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleUpload(e.target.files);
      e.target.value = "";
    },
    [handleUpload],
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      if (!onDelete) return;

      setDeletingId(fileId);
      try {
        await onDelete(fileId);
        notification({
          message: "File deleted",
          success: true,
        });
      } catch (error) {
        notification({
          message: "Failed to delete file",
          success: false,
        });
        console.error("Delete error:", error);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete, notification],
  );

  const handleDownload = useCallback(
    async (file: FileItem) => {
      if (!file.hasValidUrl) {
        notification({
          message: "File URL is not valid",
          success: false,
        });
        return;
      }

      if (file.downloadAllowed === false) {
        notification({
          message: "Downloading .htm files is disabled",
          success: false,
        });
        return;
      }

      if (onDownload) {
        onDownload(file);
        return;
      }

      try {
        const url = await getAuthorizedUrl(file.url);
        await downloadBlob(url, file.name);
      } catch (error) {
        console.error("[DrilldownFileExplorer] Download failed:", error);
        notification({
          message: "Download failed",
          description: error instanceof Error ? error.message : "Unknown error",
          success: false,
        });
      }
    },
    [downloadBlob, getAuthorizedUrl, notification, onDownload],
  );

  const handlePreview = useCallback(
    (file: FileItem) => {
      if (!file.hasValidUrl) {
        notification({
          message: "File URL is not valid",
          success: false,
        });
        return;
      }

      if (onPreview) {
        onPreview(file);
      } else {
        // Default preview behavior - open in lightbox
        const fileIndex = lightboxFiles.findIndex((f) => f.id === file.id);
        if (fileIndex !== -1) {
          dispatchCloseUserPopovers();
          openLightbox(lightboxFiles, fileIndex);
        } else {
          // Fallback to opening in new tab if file not found
          window.open(file.url, "_blank");
        }
      }
    },
    [
      notification,
      onPreview,
      lightboxFiles,
      openLightbox,
      dispatchCloseUserPopovers,
    ],
  );

  const handleOpenInNewTab = useCallback(
    async (file: FileItem) => {
      if (!file.hasValidUrl) {
        notification({
          message: "File URL is not valid",
          success: false,
        });
        return;
      }
      const url = await getAuthorizedUrl(file.url);
      window.open(url, "_blank");
    },
    [getAuthorizedUrl, notification],
  );

  const isEmpty = !isLoading && filesWithValidity.length === 0;
  const contentClassName = cn(
    "space-y-4",
    disableSectionWrapper ? className : undefined,
  );

  const content = (
    <div className={contentClassName}>
      {/* Header with view toggle and upload button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon_v2"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="h-8 w-8 transition-colors hover:bg-hover"
            aria-label={viewMode === "list"
              ? "Switch to grid view"
              : "Switch to list view"}
          >
            {viewMode === "list"
              ? <List className="h-4 w-4 stroke-icon" />
              : <Grid className="h-4 w-4 stroke-icon" />}
          </Button>
          <span className="text-sm text-secondary ml-2">
            {filesWithValidity.length}{" "}
            file{filesWithValidity.length !== 1 ? "s" : ""}
          </span>
        </div>

        {allowUpload && onUpload && (
          <div className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              accept={acceptedTypes?.join(",")}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={isUploading}
              aria-hidden
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="gap-2 transition-colors hover:bg-hover"
            >
              {isUploading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Upload className="h-4 w-4 stroke-icon" />}
              Upload
            </Button>
          </div>
        )}
      </div>

      {/* Drop zone */}
      {allowUpload && onUpload && (
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Drop files to upload"
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed p-6 text-center transition-[border-color,background-color] duration-200",
            isDragging
              ? "border-brand bg-brand/10"
              : "border-border bg-card hover:border-brand/50 hover:bg-brand/5",
            isUploading && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            accept={acceptedTypes?.join(",")}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={isUploading}
            aria-hidden
          />

          {isUploading
            ? (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            )
            : (
              <>
                <Upload className="h-6 w-6 text-icon mb-2" />
                <div className="text-sm text-secondary">
                  Drop files here or click to upload
                </div>
                <div className="text-xs text-secondary mt-1">
                  Max {maxFileSize}MB per file
                </div>
              </>
            )}
        </div>
      )}

      {/* File list */}
      {isLoading
        ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        )
        : filesWithValidity.length > 0
        ? (
          viewMode === "list"
            ? (
              <div className="space-y-1">
                {filesWithValidity.map((file) => (
                  <FileListRow
                    key={file.id}
                    file={file}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onOpenInNewTab={handleOpenInNewTab}
                    onDelete={handleDelete}
                    allowDelete={!!(allowDelete && onDelete)}
                    deletingId={deletingId}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate}
                    downloadAllowed={file.downloadAllowed ?? false}
                  />
                ))}
              </div>
            )
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filesWithValidity.map((file) => (
                  <FileGridTile
                    key={file.id}
                    file={file}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    allowDelete={!!(allowDelete && onDelete)}
                    deletingId={deletingId}
                    formatFileSize={formatFileSize}
                    downloadAllowed={file.downloadAllowed ?? false}
                  />
                ))}
              </div>
            )
        )
        : (
          !allowUpload && (
            <div className="text-center py-8 text-secondary text-sm">
              {emptyMessage}
            </div>
          )
        )}
    </div>
  );

  if (disableSectionWrapper) {
    return (
      <>
        {content}
        <Lightbox
          files={lightboxState.files}
          currentIndex={lightboxState.currentIndex}
          isOpen={lightboxState.isOpen}
          onClose={closeLightbox}
          onNavigate={(_index) => {
            // Navigation is handled by the lightbox internally
          }}
          showNavigation={false}
          showThumbnails={false}
          showDownload
          showInfo
        />
      </>
    );
  }

  return (
    <>
      <DrilldownSection
        title={title}
        loading={isLoading}
        empty={isEmpty && !allowUpload}
        empty_message={emptyMessage}
        className={className}
      >
        {content}
      </DrilldownSection>
      <Lightbox
        files={lightboxState.files}
        currentIndex={lightboxState.currentIndex}
        isOpen={lightboxState.isOpen}
        onClose={closeLightbox}
        onNavigate={(_index) => {
          // Navigation is handled by the lightbox internally
        }}
        showNavigation={false}
        showThumbnails={false}
        showDownload
        showInfo
      />
    </>
  );
}
