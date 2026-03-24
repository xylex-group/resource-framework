"use client";

/**
 * Example: Integrating Lightbox with File Explorer Widget
 * Shows how to add file preview functionality to the file explorer
 */

import { useMemo, useState } from "react";
import { Lightbox, useLightbox, type LightboxFile } from "../index";
import type { FileItem } from "../../components/drilldown/drilldown-file-explorer";

interface FileExplorerWithLightboxProps {
  files: FileItem[];
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (fileId: string) => Promise<void>;
}

/**
 * File Explorer with integrated lightbox preview
 * Click any file to preview it in the lightbox
 */
export function FileExplorerWithLightbox({
  files,
  onUpload,
  onDelete,
}: FileExplorerWithLightboxProps) {
  const { state, openLightbox, closeLightbox } = useLightbox();
  const [, setSelectedFileId] = useState<string | null>(null);
  // Convert FileItem[] to LightboxFile[]
  const lightboxFiles: LightboxFile[] = useMemo(() => {
    return files.map(file => ({
      id: file.id,
      url: file.url,
      name: file.file_name || file.name,
      type: file.type,
      size: file.size,
      created_at: file.created_at,
      updated_at: file.updated_at,
      thumbnail: file.url, // Could use a separate thumbnail URL if available
    }));
  }, [files]);

  // Handle file click - open lightbox at clicked file
  const handleFileClick = (fileId: string) => {
    const index = lightboxFiles.findIndex(f => f.id === fileId);
    if (index !== -1) {
      openLightbox(lightboxFiles, index);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {files.map(file => (
          <FileCard
            key={file.id}
            file={file}
            onClick={() => handleFileClick(file.id)}
            onDelete={onDelete ? () => onDelete(file.id) : undefined}
          />
        ))}
      </div>

      {/* Upload Area */}
      {onUpload && (
        <div className="border-2 border-dashed border-border rounded-sm p-8 text-center">
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                onUpload(files);
              }
            }}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-secondary hover:text-primary transition-colors"
          >
            Click to upload files or drag and drop
          </label>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={() => {
          closeLightbox();
          setSelectedFileId(null);
        }}
        onNavigate={(index) => {
          const newFileId = lightboxFiles[index]?.id;
          if (newFileId) {
            setSelectedFileId(newFileId);
          }
        }}
      />
    </div>
  );
}

/**
 * Individual file card component
 */
function FileCard({
  file,
  onClick,
  onDelete,
}: {
  file: FileItem;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const isImage = file.type?.startsWith("image/");

  return (
    <div className="group relative border border-border rounded-sm overflow-hidden hover:border-brand transition-colors">
      {/* Preview */}
      <div
        onClick={onClick}
        className="aspect-square bg-hover cursor-pointer flex items-center justify-center overflow-hidden"
      >
        {isImage ? (
          <img
            src={file.url}
            alt={file.file_name || file.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="text-center p-4">
            <div className="text-4xl mb-2">[FILE]</div>
            <div className="text-xs text-secondary truncate">
              {file.type?.split("/")[1] || "file"}
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-2 border-t border-border">
        <div className="text-xs text-primary truncate" title={file.file_name || file.name}>
          {file.file_name || file.name}
        </div>
        {file.size && (
          <div className="text-xs text-secondary">
            {(file.size / 1024).toFixed(0)} KB
          </div>
        )}
      </div>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete ${file.file_name || file.name}?`)) {
              onDelete();
            }
          }}
          className="absolute top-2 right-2 w-6 h-6 bg-background/80 hover:bg-hover backdrop-blur-sm rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="text-xs">x</span>
        </button>
      )}
    </div>
  );
}

/**
 * Example: Using with Resource Framework Widget
 */
export function FileExplorerWidgetWithLightbox() {
  const { state, openLightbox, closeLightbox } = useLightbox();

  // This would typically come from the widget's data
  const files: FileItem[] = [
    {
      id: "1",
      name: "document.pdf",
      file_name: "document.pdf",
      url: "https://example.com/document.pdf",
      type: "application/pdf",
      size: 245000,
      created_at: "2024-01-30T12:00:00Z",
    },
    {
      id: "2",
      name: "image.jpg",
      file_name: "image.jpg",
      url: "https://picsum.photos/800/600",
      type: "image/jpeg",
      size: 312000,
      created_at: "2024-01-30T12:00:00Z",
    },
  ];

  const lightboxFiles: LightboxFile[] = files.map((file, index) => ({
    id: file.id,
    url: file.url,
    name: file.file_name ?? file.name ?? `File ${index + 1}`,
    type: file.type,
    size: file.size,
    created_at: file.created_at,
  }));

  return (
    <div>
      <h2 className="text-xl font-semibold text-primary mb-4">Files</h2>
      
      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={file.id}
            onClick={() => openLightbox(lightboxFiles, index)}
            className="p-3 border border-border rounded-sm hover:border-brand cursor-pointer transition-colors"
          >
            <div className="text-sm text-primary">{file.file_name}</div>
            <div className="text-xs text-secondary">{file.type}</div>
          </div>
        ))}
      </div>

      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
      />
    </div>
  );
}

