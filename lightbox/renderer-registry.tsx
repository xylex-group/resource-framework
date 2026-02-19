"use client";

import type { FileType, FileRenderer, LightboxFile } from "./types";
import { ImageRenderer } from "./renderers/ImageRenderer";
import { VideoRenderer } from "./renderers/VideoRenderer";
import { PdfRenderer } from "./renderers/PdfRenderer";
import { AudioRenderer } from "./renderers/AudioRenderer";
import { DocumentRenderer } from "./renderers/DocumentRenderer";
import { UnsupportedRenderer } from "./renderers/UnsupportedRenderer";
import { detectFileType } from "./utils/file-type-detector";

/**
 * Registry mapping file types to their renderers
 */
const RENDERER_REGISTRY: Record<FileType, FileRenderer> = {
  image: ImageRenderer,
  video: VideoRenderer,
  pdf: PdfRenderer,
  audio: AudioRenderer,
  document: DocumentRenderer,
  unknown: UnsupportedRenderer,
};

/**
 * Get the appropriate renderer component for a file
 */
export function getRendererForFile(file: LightboxFile): FileRenderer {
  const fileType = detectFileType(file);
  return RENDERER_REGISTRY[fileType];
}

/**
 * Register a custom renderer for a file type
 */
export function registerRenderer(fileType: FileType, renderer: FileRenderer): void {
  RENDERER_REGISTRY[fileType] = renderer;
}

/**
 * Get all registered renderers
 */
export function getRegisteredRenderers(): Record<FileType, FileRenderer> {
  return { ...RENDERER_REGISTRY };
}
