"use client";

/**
 * Example: Automatic URL Refresh for Expired S3 URLs
 *
 * This example demonstrates how the lightbox automatically handles expired
 * S3/MinIO presigned URLs without requiring manual intervention.
 */

import { useState } from "react";
import { Lightbox, type LightboxFile, useLightbox } from "../index";
import { Button } from "@/components/ui/button";

export function UrlRefreshExample() {
  const { state, openLightbox, closeLightbox } = useLightbox();

  // Example files with potentially expired URLs
  const exampleFiles: LightboxFile[] = [
    {
      id: "1",
      name: "video-demo.mp4",
      url:
        "https://console-production-a53c.up.railway.app/suitsconnect/rsf/ItQJWB0mMgEjNkJlvDTFhryyqJMpU8Ml/customers/85cd83b7-5298-4fa7-9b25-2760b887ab85/shell_be_your_waiter_for_tonight_X-Ujzu0uqk4.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
      type: "video/mp4",
      size: 5242880, // 5 MB
    },
    {
      id: "2",
      name: "image-demo.jpg",
      url:
        "https://console-production-a53c.up.railway.app/suitsconnect/rsf/org123/images/demo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
      type: "image/jpeg",
      size: 1048576, // 1 MB
    },
    {
      id: "3",
      name: "document-demo.pdf",
      url:
        "https://console-production-a53c.up.railway.app/suitsconnect/rsf/org123/documents/demo.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
      type: "application/pdf",
      size: 2097152, // 2 MB
    },
  ];

  const handleOpenFile = (index: number) => {
    openLightbox(exampleFiles, index);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-primary">
          Automatic URL Refresh Demo
        </h2>
        <p className="text-secondary">
          Click any file below to open it in the lightbox. If the URL has
          expired, the system will automatically refresh it and load the file.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exampleFiles.map((file, index) => (
          <div
            key={file.id}
            className="border border-border rounded-sm p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="font-medium text-primary">{file.name}</div>
                <div className="text-xs text-secondary">
                  {file.type} • {(file.size! / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleOpenFile(index)}
              variant="brand"
              size="sm"
              className="w-full"
            >
              Open in lightbox
            </Button>
          </div>
        ))}
      </div>

      <div className="border border-border rounded-sm p-4 bg-background space-y-3">
        <h3 className="font-semibold text-primary">How It Works:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-secondary">
          <li>
            When you click a file, the lightbox opens and attempts to load it
          </li>
          <li>
            If the URL has expired (AccessDenied error), the renderer detects
            this
          </li>
          <li>
            The system automatically calls the Athena-backed refresh endpoint
            via{" "}
            <code className="text-xs bg-hover px-1 py-0.5 rounded">
              refreshFileUrlViaAthena()
            </code>{" "}
            to get a fresh URL
          </li>
          <li>
            The file is loaded again with the new URL - all without user
            intervention
          </li>
          <li>
            If the refresh fails, an error message is displayed with download
            options
          </li>
        </ol>
      </div>

      <div className="border border-border rounded-sm p-4 bg-background space-y-3">
        <h3 className="font-semibold text-primary">Supported File Types:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-secondary">
          <div>✓ Videos (MP4, WebM, etc.)</div>
          <div>✓ Images (JPG, PNG, GIF, etc.)</div>
          <div>✓ Audio (MP3, WAV, etc.)</div>
          <div>✓ PDFs</div>
        </div>
      </div>

      {/* Lightbox Component */}
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
        onNavigate={(_index) => {
          // Optional: handle navigation
        }}
        showNavigation
        showThumbnails
        showDownload
        showInfo
      />
    </div>
  );
}

/**
 * Example: Simulating an Expired URL
 *
 * For testing purposes, you can simulate an expired URL by:
 * 1. Modifying the timestamp in the URL query parameters
 * 2. Changing the signature to make it invalid
 * 3. Using a URL that's actually expired
 */
export function SimulateExpiredUrlExample() {
  const [urlStatus, setUrlStatus] = useState<"valid" | "expired" | "refreshed">(
    "valid",
  );

  const simulateExpiredUrl = () => {
    setUrlStatus("expired");
    // In a real scenario, this would be detected automatically
    // when the file fails to load
  };

  const simulateRefresh = () => {
    setUrlStatus("refreshed");
    // This simulates what happens automatically in the renderers
  };

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-primary">
          URL Lifecycle Simulation
        </h2>
        <p className="text-secondary">
          This demonstrates the URL refresh lifecycle.
        </p>
      </div>

      <div className="border border-border rounded-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-primary">URL Status:</div>
            <div className="text-sm text-secondary mt-1">
              {urlStatus === "valid" && "URL is valid and can load the file"}
              {urlStatus === "expired" &&
                "URL has expired (AccessDenied error)"}
              {urlStatus === "refreshed" &&
                "URL has been refreshed and is valid again"}
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-sm text-sm font-medium ${
              urlStatus === "valid"
                ? "bg-green-100 text-green-800"
                : urlStatus === "expired"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {urlStatus.toUpperCase()}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={simulateExpiredUrl}
            variant="outline"
            size="sm"
            disabled={urlStatus === "expired"}
          >
            Simulate expiry
          </Button>
          <Button
            onClick={simulateRefresh}
            variant="brand"
            size="sm"
            disabled={urlStatus !== "expired"}
          >
            Refresh URL
          </Button>
          <Button
            onClick={() => setUrlStatus("valid")}
            variant="outline"
            size="sm"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="text-xs text-secondary">
        Note: In the actual implementation, the expiry detection and refresh
        happen automatically without user interaction.
      </div>
    </div>
  );
}
