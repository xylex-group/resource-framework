/**
 * Tests for lightbox utilities
 */

import { describe, it, expect } from "vitest";
import { detectFileType, isPreviewSupported, canPreview } from "../utils/file-type-detector";
import { formatFileSize, formatDate } from "../utils/format";
import type { LightboxFile } from "../types";

describe("File Type Detection", () => {
  it("should detect image types from MIME", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/file",
      name: "test",
      type: "image/jpeg",
    };
    expect(detectFileType(file)).toBe("image");
  });

  it("should detect video types from MIME", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/file",
      name: "test",
      type: "video/mp4",
    };
    expect(detectFileType(file)).toBe("video");
  });

  it("should detect PDF from MIME", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/file",
      name: "test",
      type: "application/pdf",
    };
    expect(detectFileType(file)).toBe("pdf");
  });

  it("should detect audio from MIME", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/file",
      name: "test",
      type: "audio/mpeg",
    };
    expect(detectFileType(file)).toBe("audio");
  });

  it("should detect image from URL extension", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/image.jpg",
      name: "test",
    };
    expect(detectFileType(file)).toBe("image");
  });

  it("should detect video from URL extension", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/video.mp4",
      name: "test",
    };
    expect(detectFileType(file)).toBe("video");
  });

  it("should detect from filename when URL has no extension", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/storage/abc123",
      name: "document.pdf",
    };
    expect(detectFileType(file)).toBe("pdf");
  });

  it("should return unknown for unrecognized types", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/file.xyz",
      name: "test.xyz",
    };
    expect(detectFileType(file)).toBe("unknown");
  });

  it("should check if preview is supported", () => {
    expect(isPreviewSupported("image")).toBe(true);
    expect(isPreviewSupported("video")).toBe(true);
    expect(isPreviewSupported("pdf")).toBe(true);
    expect(isPreviewSupported("audio")).toBe(true);
    expect(isPreviewSupported("document")).toBe(true);
    expect(isPreviewSupported("unknown")).toBe(false);
  });

  it("should check if file can be previewed", () => {
    const imageFile: LightboxFile = {
      id: "1",
      url: "https://example.com/image.jpg",
      name: "image.jpg",
      type: "image/jpeg",
    };
    expect(canPreview(imageFile)).toBe(true);

    const docFile: LightboxFile = {
      id: "2",
      url: "https://example.com/doc.docx",
      name: "doc.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    expect(canPreview(docFile)).toBe(true);

    const csvFile: LightboxFile = {
      id: "3",
      url: "https://example.com/data.csv",
      name: "data.csv",
      type: "text/csv",
    };
    expect(canPreview(csvFile)).toBe(true);

    const txtFile: LightboxFile = {
      id: "4",
      url: "https://example.com/readme.txt",
      name: "readme.txt",
      type: "text/plain",
    };
    expect(canPreview(txtFile)).toBe(true);
  });
});

describe("Format Utilities", () => {
  it("should format file size correctly", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1048576)).toBe("1 MB");
    expect(formatFileSize(1073741824)).toBe("1 GB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(undefined)).toBe("0 B");
  });

  it("should format dates correctly", () => {
    const dateStr = "2024-01-30T12:00:00Z";
    const formatted = formatDate(dateStr);
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("30");
    expect(formatted).toContain("2024");
  });

  it("should handle invalid dates", () => {
    expect(formatDate("invalid")).toBe("invalid");
    expect(formatDate(undefined)).toBe("");
  });
});

describe("File Extension Detection", () => {
  it("should handle URLs with query parameters", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/image.jpg?token=abc123",
      name: "test",
    };
    expect(detectFileType(file)).toBe("image");
  });

  it("should handle URLs with multiple dots", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/my.image.file.png",
      name: "test",
    };
    expect(detectFileType(file)).toBe("image");
  });

  it("should be case insensitive", () => {
    const file: LightboxFile = {
      id: "1",
      url: "https://example.com/IMAGE.JPG",
      name: "test",
    };
    expect(detectFileType(file)).toBe("image");
  });
});
