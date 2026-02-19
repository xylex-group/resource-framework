/**
 * Utility functions for handling expired S3/MinIO URLs
 */

/**
 * Extract the file key (object path) from an S3/MinIO URL
 * Preserves URL encoding to avoid double-encoding issues
 *
 * Examples:
 * - https://console-production-a53c.up.railway.app/suitsconnect/rsf/org123/customers/file.mp4?X-Amz-...
 *   -> rsf/org123/customers/file.mp4
 * - https://s3.amazonaws.com/bucket/path/to/file.jpg?...
 *   -> path/to/file.jpg
 * - https://s3.../bucket/file%20name.pdf -> file%20name.pdf (preserves encoding)
 */
export function extractFileKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Get the pathname and decode it
    // URL.pathname behavior differs between browser and Node.js
    // In Node.js it may not decode automatically, so we decode explicitly
    let path = decodeURIComponent(urlObj.pathname);

    // Remove leading slash
    if (path.startsWith("/")) {
      path = path.slice(1);
    }

    // If the path starts with a bucket name, remove it
    // Common pattern: /bucketName/key or bucketName/key
    const segments = path.split("/");

    // For URLs like /suitsconnect/rsf/..., remove the bucket name
    if (segments.length > 1) {
      // Check if first segment looks like a bucket name (common bucket names)
      const possibleBucket = segments[0];
      if (
        possibleBucket &&
        (possibleBucket.includes("connect") ||
          possibleBucket.includes("bucket") ||
          possibleBucket.includes("storage"))
      ) {
        // Remove the bucket name and return the rest
        path = segments.slice(1).join("/");
      }
    }

    // The path is now decoded and ready to be used with MinIO client
    // MinIO's presignedGetObject will handle encoding when generating the presigned URL
    return path || null;
  } catch (error) {
    console.error("[extractFileKey] Failed to parse URL:", error);
    return null;
  }
}

/**
 * Extract bucket name from URL if present
 */
export function extractBucketName(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length > 0) {
      const possibleBucket = segments[0];
      if (
        possibleBucket &&
        (possibleBucket.includes("connect") ||
          possibleBucket.includes("bucket") ||
          possibleBucket.includes("storage"))
      ) {
        return possibleBucket;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

interface RefreshApiResponse {
  success?: boolean;
  url?: string;
  expiresIn?: number;
}

interface RefreshResult {
  url: string;
  expiresIn?: number;
}

const EXPIRE_HEADER_KEYS = [
  "x-amz-expires",
  "x-amz-expire",
  "x-amz-expiration",
];

const EXPIRE_QUERY_KEYS = [
  "X-Amz-Expires",
  "x-amz-expires",
  "Expires",
  "expires",
];

function parseExpiresValue(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const normalized = parseInt(value, 10);
  if (Number.isFinite(normalized) && normalized > 0) {
    return normalized;
  }

  return null;
}

function extractExpiresFromUrl(url: string): number | null {
  try {
    const urlObj = new URL(url);
    for (const key of EXPIRE_QUERY_KEYS) {
      const param = urlObj.searchParams.get(key);
      const parsed = parseExpiresValue(param);
      if (parsed) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("[extractExpiresFromUrl] Failed to parse URL:", error);
  }

  return null;
}

/**
 * Refresh an expired S3/MinIO URL by calling the refresh API
 */
export async function refreshFileUrl(
  originalUrl: string,
): Promise<RefreshResult> {
  const fileKey = extractFileKey(originalUrl);

  if (!fileKey) {
    console.error(
      "[refreshFileUrl] Could not extract file key from URL:",
      originalUrl,
    );
    throw new Error("Could not extract file key from URL");
  }

  const bucket = extractBucketName(originalUrl);

  console.log(
    "[refreshFileUrl] Refreshing URL with fileKey:",
    fileKey,
    "bucket:",
    bucket,
  );

  const response = await fetch("/api/files/refresh-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileKey,
      bucket,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("[refreshFileUrl] API error:", error);
    throw new Error(error.message || "Failed to refresh URL");
  }

  const data = (await response.json()) as RefreshApiResponse;

  if (!data.success || !data.url) {
    console.error("[refreshFileUrl] Invalid API response:", data);
    throw new Error("Invalid response from refresh API");
  }

  console.log("[refreshFileUrl] Successfully refreshed URL");

  const headerExpires = EXPIRE_HEADER_KEYS.reduce<number | null>(
    (prev, key) => prev ?? parseExpiresValue(response.headers.get(key)),
    null,
  );

  const expiresIn =
    headerExpires ??
    parseExpiresValue(data.expiresIn?.toString()) ??
    extractExpiresFromUrl(data.url);

  return {
    url: data.url,
    expiresIn: expiresIn ?? undefined,
  };
}

/**
 * Check if an error is an S3 access denied or expired URL error
 */
export type RefreshFileUrlResult = RefreshResult;

export function isExpiredUrlError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  return (
    lowerMessage.includes("access denied") ||
    lowerMessage.includes("expired") ||
    lowerMessage.includes("request has expired") ||
    lowerMessage.includes("403") ||
    lowerMessage.includes("accessdenied")
  );
}

/**
 * Check if a fetch response indicates an expired URL
 */
export function isExpiredUrlResponse(response: Response): boolean {
  if (response.status === 403) {
    return true;
  }

  // Check content type - S3 errors are usually XML
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("xml") && !response.ok) {
    return true;
  }

  return false;
}
