"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LightboxProps } from "../types";
import { detectFileType } from "../utils/file-type-detector";
import { getRendererForFile } from "../renderer-registry";
import { LightboxToolbar } from "./LightboxToolbar";
import { LightboxInfo } from "./LightboxInfo";
import { cn } from "@/lib/utils";
import { useViewStore } from "@/lib/zustand";
import { LightboxScrollContext } from "../context/scroll-context";

/**
 * Main Lightbox component
 * Full-featured file preview modal with navigation, info panel, and thumbnails
 */
export function Lightbox({
  files,
  currentIndex,
  isOpen,
  onClose,
  onNavigate: _onNavigate,
  showNavigation: _showNavigation = true,
  showThumbnails: _showThumbnails = true,
  showDownload = true,
  showInfo = true,
  className,
}: LightboxProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const headerRightOffset = showInfo && infoVisible
    ? "calc(1rem + 20rem)"
    : "1rem";
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Memoize the context value to prevent unnecessary re-renders
  const scrollContextValue = useMemo(() => ({ setHasScrolled }), []);

  const { setIsInLightbox, setIsInPopover, setIsInUserPopover } =
    useViewStore();

  useEffect(() => {
    setIsInLightbox(isOpen);
    if (isOpen) {
      setIsInPopover(false);
      setIsInUserPopover(false);
    }
  }, [isOpen, setIsInLightbox, setIsInPopover, setIsInUserPopover]);

  // Sync activeIndex with currentIndex prop
  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  const currentFile = files[activeIndex];
  const fileType = currentFile ? detectFileType(currentFile) : "unknown";
  const isImage = fileType === "image";
  const isVideo = fileType === "video";
  const handleMediaClick = useCallback(() => {
    if (isImage) {
      onClose();
    }
  }, [isImage, onClose]);
  const handleMediaDoubleClick = useCallback(() => {
    if (isVideo) {
      onClose();
    }
  }, [isVideo, onClose]);

  const handleDialogEscapeKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (showInfo && infoVisible) {
        event.preventDefault();
        event.stopPropagation();
        setInfoVisible(false);
      }
    },
    [infoVisible, showInfo],
  );

  const handleToggleInfo = useCallback(() => {
    setInfoVisible((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      switch (e.key) {
        case "i":
        case "I":
          if (showInfo) {
            e.preventDefault();
            handleToggleInfo();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showInfo, handleToggleInfo]);

  // Reset info panel when closing
  useEffect(() => {
    if (!isOpen) {
      setInfoVisible(false);
    }
  }, [isOpen]);

  if (!currentFile) {
    return null;
  }

  const Renderer = getRendererForFile(currentFile);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-foreground" />
        <DialogContent
          forceFullScreen
          onEscapeKeyDown={handleDialogEscapeKeyDown}
          className={cn(
            "p-0 bg-background border-0 shadow-none [&>button]:hidden",
            className,
          )}
        >
          <DialogTitle className="sr-only">Lightbox preview</DialogTitle>
          <div className="w-full h-screen max-h-screen flex flex-col">
            {/* Header with toolbar */}
            <div
              className={cn(
                "absolute top-0 left-0 z-50 flex items-center justify-between gap-3 px-4 py-4 transition-colors",
                hasScrolled &&
                  "border-b border-border bg-background/95 backdrop-blur-sm",
              )}
              style={{ right: headerRightOffset }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-primary font-medium truncate max-w-md">
                  {currentFile.name}
                </div>
              </div>
              <LightboxToolbar
                file={currentFile}
                onClose={onClose}
                onToggleInfo={showInfo ? handleToggleInfo : undefined}
                showDownload={showDownload}
                showInfo={showInfo}
                infoVisible={infoVisible}
              />
            </div>

            {/* Main content area */}
            <div className="flex-1 flex items-center justify-center relative pt-14 overflow-hidden min-h-0">
              <div
                className={cn(
                  "w-full h-full max-h-full flex items-center justify-center transition-all duration-200 overflow-hidden",
                  infoVisible && showInfo ? "mr-80" : "",
                  (isImage || isVideo) && "cursor-pointer",
                )}
                onClick={handleMediaClick}
                onDoubleClick={handleMediaDoubleClick}
              >
                <LightboxScrollContext.Provider value={scrollContextValue}>
                  <Renderer
                    file={currentFile}
                    isActive={true}
                    onLoad={() => {}}
                    onError={(error) =>
                      console.error("Lightbox render error:", error)}
                    onClose={onClose}
                  />
                </LightboxScrollContext.Provider>
              </div>

              {/* Info panel */}
              {showInfo && (
                <LightboxInfo
                  file={currentFile}
                  isVisible={infoVisible}
                  className="z-50"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
