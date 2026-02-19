/**
 * File type detection utilities
 */

import type { FileType, LightboxFile } from "../types";

const IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"
];
const VIDEO_EXTENSIONS = [
  "mp4", "webm", "ogg", "mov", "avi", "mkv", "flv", "wmv"
];
const AUDIO_EXTENSIONS = [
  "mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"
];
const PDF_EXTENSIONS = ["pdf"];
const DOCUMENT_EXTENSIONS = [
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf"
];

const IMAGE_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", 
  "image/svg+xml", "image/bmp", "image/x-icon", "image/avif"
];
const VIDEO_MIME_TYPES = [
  "video/mp4", "video/webm", "video/ogg", "video/quicktime",
  "video/x-msvideo", "video/x-matroska", "video/x-flv"
];
const AUDIO_MIME_TYPES = [
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
  "audio/aac", "audio/flac", "audio/x-ms-wma"
];
const PDF_MIME_TYPES = ["application/pdf"];
const DOCUMENT_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/rtf"
];

/**
 * Extract file extension from URL or filename
 */
function getFileExtension(url: string): string {
  const pathname = url.split("?")[0];
  const parts = pathname.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Detect file type from MIME type
 */
function detectFromMimeType(mimeType: string): FileType | null {
  const mime = mimeType.toLowerCase();
  
  if (IMAGE_MIME_TYPES.includes(mime)) return "image";
  if (VIDEO_MIME_TYPES.includes(mime)) return "video";
  if (AUDIO_MIME_TYPES.includes(mime)) return "audio";
  if (PDF_MIME_TYPES.includes(mime)) return "pdf";
  if (DOCUMENT_MIME_TYPES.includes(mime)) return "document";
  
  return null;
}

/**
 * Detect file type from file extension
 */
function detectFromExtension(extension: string): FileType | null {
  const ext = extension.toLowerCase();
  
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (AUDIO_EXTENSIONS.includes(ext)) return "audio";
  if (PDF_EXTENSIONS.includes(ext)) return "pdf";
  if (DOCUMENT_EXTENSIONS.includes(ext)) return "document";
  
  return null;
}

/**
 * Main file type detector
 */
export function detectFileType(file: LightboxFile): FileType {
  // Try MIME type first
  if (file.type) {
    const typeFromMime = detectFromMimeType(file.type);
    if (typeFromMime) return typeFromMime;
  }
  
  // Try extension from URL
  const extension = getFileExtension(file.url);
  if (extension) {
    const typeFromExt = detectFromExtension(extension);
    if (typeFromExt) return typeFromExt;
  }
  
  // Try extension from name
  if (file.name) {
    const nameExtension = getFileExtension(file.name);
    if (nameExtension) {
      const typeFromNameExt = detectFromExtension(nameExtension);
      if (typeFromNameExt) return typeFromNameExt;
    }
  }
  
  return "unknown";
}

/**
 * Check if file type is supported for preview
 * Now includes document types (docx, csv, txt)
 */
export function isPreviewSupported(fileType: FileType): boolean {
  return ["image", "video", "pdf", "audio", "document"].includes(fileType);
}

/**
 * Check if file can be previewed
 */
export function canPreview(file: LightboxFile): boolean {
  const fileType = detectFileType(file);
  return isPreviewSupported(fileType);
}
