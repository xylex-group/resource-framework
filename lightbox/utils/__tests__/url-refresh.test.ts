/**
 * Tests for URL refresh utilities
 */

import { describe, it, expect } from "vitest";
import { extractFileKey, extractBucketName } from "../url-refresh";

describe("extractFileKey", () => {
  it("should extract file key from standard S3 URL", () => {
    const url = "https://bucket.s3.amazonaws.com/path/to/file.pdf?X-Amz-Signature=...";
    const key = extractFileKey(url);
    expect(key).toBe("path/to/file.pdf");
  });

  it("should extract file key from MinIO URL with bucket in path", () => {
    const url = "https://minio.example.com/suitsconnect/rsf/org123/file.pdf?X-Amz-Signature=...";
    const key = extractFileKey(url);
    expect(key).toBe("rsf/org123/file.pdf");
  });

  it("should handle URL-encoded filenames correctly", () => {
    const url = "https://bucket.s3.amazonaws.com/suitsconnect/rsf/org/Arctic%20Ventures%20B.V.csv?X-Amz-Signature=...";
    const key = extractFileKey(url);
    // URL.pathname automatically decodes, so we should get the decoded version
    expect(key).toBe("rsf/org/Arctic Ventures B.V.csv");
  });

  it("should handle multiple encoded spaces", () => {
    const url = "https://bucket.s3.amazonaws.com/suitsconnect/path/to/file%20with%20spaces.txt?X-Amz-Signature=...";
    const key = extractFileKey(url);
    expect(key).toBe("path/to/file with spaces.txt");
  });

  it("should handle special characters", () => {
    const url = "https://bucket.s3.amazonaws.com/suitsconnect/path/file%20-%20name%202024.csv?X-Amz-Signature=...";
    const key = extractFileKey(url);
    expect(key).toBe("path/file - name 2024.csv");
  });

  it("should return null for invalid URLs", () => {
    const key = extractFileKey("not-a-valid-url");
    expect(key).toBeNull();
  });

  it("should handle URLs without bucket prefix", () => {
    const url = "https://s3.amazonaws.com/path/to/file.pdf?X-Amz-Signature=...";
    const key = extractFileKey(url);
    expect(key).toBe("path/to/file.pdf");
  });
});

describe("extractBucketName", () => {
  it("should extract bucket name from URL", () => {
    const url = "https://minio.example.com/suitsconnect/rsf/org123/file.pdf";
    const bucket = extractBucketName(url);
    expect(bucket).toBe("suitsconnect");
  });

  it("should return null if no bucket pattern found", () => {
    const url = "https://s3.amazonaws.com/path/to/file.pdf";
    const bucket = extractBucketName(url);
    expect(bucket).toBeNull();
  });

  it("should handle bucket names with 'storage' in them", () => {
    const url = "https://minio.example.com/mystorage/path/to/file.pdf";
    const bucket = extractBucketName(url);
    expect(bucket).toBe("mystorage");
  });
});
