/**
 * Centralized managed storage file handler with automatic re-authentication
 * 
 * This module provides utilities for fetching files from managed storage with automatic
 * handling of expired URLs (403 errors). It can be used across the resource-framework
 * for consistent file access patterns.
 */

import { refreshFileUrl, isExpiredUrlResponse } from "../lightbox/utils/url-refresh";

export interface FetchFileOptions {
  /**
   * Maximum number of retry attempts for 403 errors
   * @default 1
   */
  maxRetries?: number;
  
  /**
   * Custom headers to include in the fetch request
   */
  headers?: HeadersInit;
  
  /**
   * Cache control setting
   * @default "no-store"
   */
  cache?: RequestCache;
  
  /**
   * Callback called before each retry attempt
   */
  onRetry?: (attempt: number) => void;
  
  /**
   * Callback called when URL is refreshed
   */
  onUrlRefresh?: (newUrl: string) => void;
}

export interface FetchFileResult<T = unknown> {
  data: T;
  url: string;
  wasRefreshed: boolean;
}

/**
 * Fetch a file from managed storage with automatic re-authentication on 403 errors
 * 
 * @param url - The initial managed storage URL (may be expired)
 * @param options - Fetch options
 * @returns Response object
 * 
 * @example
 * ```ts
 * const response = await fetchAuthorizedFile('https://s3.../file.pdf');
 * const blob = await response.blob();
 * ```
 */
export async function fetchAuthorizedFile(
  url: string,
  options: FetchFileOptions = {}
): Promise<Response> {
  const {
    maxRetries = 1,
    headers,
    cache = "no-store",
    onRetry,
    onUrlRefresh,
  } = options;

  let currentUrl = url;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        headers,
        cache,
      });

      // Check if the response indicates an expired URL
      if (isExpiredUrlResponse(response) && attempt < maxRetries) {
        console.log(`[fetchAuthorizedFile] Got 403 on attempt ${attempt + 1}, refreshing URL...`);
        
        onRetry?.(attempt + 1);
        
        // Refresh the URL
        const refreshResult = await refreshFileUrl(url);
        currentUrl = refreshResult.url;
        
        onUrlRefresh?.(currentUrl);
        
        attempt++;
        continue;
      }

      return response;
    } catch (error) {
      // Network errors or other fetch failures
      if (attempt < maxRetries) {
        console.log(`[fetchAuthorizedFile] Fetch failed on attempt ${attempt + 1}, retrying...`);
        onRetry?.(attempt + 1);
        attempt++;
        continue;
      }
      
      throw error;
    }
  }

  throw new Error("Failed to fetch file after maximum retries");
}

/**
 * Fetch a file as text with automatic re-authentication
 * 
 * @example
 * ```ts
 * const text = await fetchAuthorizedFileAsText('https://s3.../file.txt');
 * console.log(text);
 * ```
 */
export async function fetchAuthorizedFileAsText(
  url: string,
  options?: FetchFileOptions
): Promise<FetchFileResult<string>> {
  const response = await fetchAuthorizedFile(url, options);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }
  
  const text = await response.text();
  
  return {
    data: text,
    url: response.url,
    wasRefreshed: response.url !== url,
  };
}

/**
 * Fetch a file as ArrayBuffer with automatic re-authentication
 * 
 * @example
 * ```ts
 * const buffer = await fetchAuthorizedFileAsArrayBuffer('https://s3.../file.docx');
 * // Process buffer...
 * ```
 */
export async function fetchAuthorizedFileAsArrayBuffer(
  url: string,
  options?: FetchFileOptions
): Promise<FetchFileResult<ArrayBuffer>> {
  const response = await fetchAuthorizedFile(url, options);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  
  return {
    data: arrayBuffer,
    url: response.url,
    wasRefreshed: response.url !== url,
  };
}

/**
 * Fetch a file as Blob with automatic re-authentication
 * 
 * @example
 * ```ts
 * const blob = await fetchAuthorizedFileAsBlob('https://s3.../image.jpg');
 * const objectUrl = URL.createObjectURL(blob);
 * ```
 */
export async function fetchAuthorizedFileAsBlob(
  url: string,
  options?: FetchFileOptions
): Promise<FetchFileResult<Blob>> {
  const response = await fetchAuthorizedFile(url, options);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }
  
  const blob = await response.blob();
  
  return {
    data: blob,
    url: response.url,
    wasRefreshed: response.url !== url,
  };
}

/**
 * Fetch a JSON file with automatic re-authentication
 * 
 * @example
 * ```ts
 * const data = await fetchAuthorizedFileAsJson<MyType>('https://s3.../data.json');
 * console.log(data.property);
 * ```
 */
export async function fetchAuthorizedFileAsJson<T = unknown>(
  url: string,
  options?: FetchFileOptions
): Promise<FetchFileResult<T>> {
  const response = await fetchAuthorizedFile(url, options);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }
  
  const json = await response.json() as T;
  
  return {
    data: json,
    url: response.url,
    wasRefreshed: response.url !== url,
  };
}

/**
 * Download a file from managed storage with automatic re-authentication
 * Triggers a browser download with the specified filename
 * 
 * @example
 * ```ts
 * await downloadAuthorizedFile('https://s3.../file.pdf', 'document.pdf');
 * ```
 */
export async function downloadAuthorizedFile(
  url: string,
  filename: string,
  options?: FetchFileOptions
): Promise<void> {
  const result = await fetchAuthorizedFileAsBlob(url, options);
  
  const blobUrl = URL.createObjectURL(result.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

/**
 * Check if a URL is accessible (returns 200) with automatic re-authentication
 * Useful for validating file existence before attempting to display/download
 * 
 * @example
 * ```ts
 * const isValid = await validateAuthorizedFileUrl('https://s3.../file.pdf');
 * if (isValid) {
 *   // Proceed with displaying the file
 * }
 * ```
 */
export async function validateAuthorizedFileUrl(
  url: string,
  options?: FetchFileOptions
): Promise<boolean> {
  try {
    const response = await fetchAuthorizedFile(url, {
      ...options,
      cache: "no-cache",
    });
    return response.ok;
  } catch (error) {
    console.error("[validateAuthorizedFileUrl] Validation failed:", error);
    return false;
  }
}
