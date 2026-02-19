"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { defaultNotificationConfig, getCloseAction } from "./config";
import { Upload } from "lucide-react";

interface UploadTracker {
  count: number;
  toastId: string | number | null;
}

// Global state to track active uploads
let uploadTracker: UploadTracker = {
  count: 0,
  toastId: null,
};

/**
 * Generate a unique upload ID
 */
function generateUploadId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Update the upload status toast with the current count
 */
function updateUploadToast(count: number) {
  const message = count === 1 
    ? "1 file uploading" 
    : `${count} files uploading`;

  if (uploadTracker.toastId) {
    // Update existing toast
    toast(message, {
      ...defaultNotificationConfig,
      icon: <Upload className="w-4 h-4 stroke-icon animate-pulse" />,
      action: getCloseAction(() => toast.dismiss(uploadTracker.toastId!)),
      id: uploadTracker.toastId,
      duration: Number.POSITIVE_INFINITY, // Keep showing while uploading
    });
  } else {
    // Create new toast
    uploadTracker.toastId = toast(message, {
      ...defaultNotificationConfig,
      icon: <Upload className="w-4 h-4 stroke-icon animate-pulse" />,
      action: getCloseAction(() => toast.dismiss()),
      duration: Number.POSITIVE_INFINITY,
    });
  }
}

/**
 * Hook for tracking file upload status across multiple concurrent uploads
 * 
 * @example
 * ```tsx
 * const { startUpload, finishUpload } = useFileUploadStatus();
 * 
 * const handleUpload = async (files: File[]) => {
 *   const uploadId = startUpload(files.length);
 *   try {
 *     for (const file of files) {
 *       await uploadFile(file);
 *     }
 *   } finally {
 *     finishUpload(uploadId);
 *   }
 * };
 * ```
 */
export function useFileUploadStatus() {
  const activeUploadsRef = useRef<Map<string, number>>(new Map());

  const startUpload = useCallback((fileCount: number = 1) => {
    const uploadId = generateUploadId();
    
    // Track this upload batch
    activeUploadsRef.current.set(uploadId, fileCount);
    
    // Update global count
    uploadTracker.count += fileCount;
    
    // Update toast
    updateUploadToast(uploadTracker.count);
    
    return uploadId;
  }, []);

  const finishUpload = useCallback((uploadId: string) => {
    const fileCount = activeUploadsRef.current.get(uploadId);
    
    if (fileCount) {
      // Remove this upload batch
      activeUploadsRef.current.delete(uploadId);
      
      // Update global count
      uploadTracker.count = Math.max(0, uploadTracker.count - fileCount);
      
      if (uploadTracker.count === 0) {
        // All uploads complete, dismiss toast
        if (uploadTracker.toastId) {
          toast.dismiss(uploadTracker.toastId);
          uploadTracker.toastId = null;
        }
      } else {
        // Still uploading, update count
        updateUploadToast(uploadTracker.count);
      }
    }
  }, []);

  return {
    startUpload,
    finishUpload,
  };
}

/**
 * Direct API for managing upload status without hooks
 * Useful for non-React contexts
 */
export const uploadStatus = {
  start: (fileCount: number = 1): string => {
    const uploadId = generateUploadId();
    uploadTracker.count += fileCount;
    updateUploadToast(uploadTracker.count);
    return uploadId;
  },
  
  finish: (uploadId: string, fileCount: number = 1): void => {
    uploadTracker.count = Math.max(0, uploadTracker.count - fileCount);
    
    if (uploadTracker.count === 0) {
      if (uploadTracker.toastId) {
        toast.dismiss(uploadTracker.toastId);
        uploadTracker.toastId = null;
      }
    } else {
      updateUploadToast(uploadTracker.count);
    }
  },
  
  getCount: (): number => uploadTracker.count,
};
