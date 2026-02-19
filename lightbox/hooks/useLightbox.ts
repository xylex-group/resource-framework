import { useState, useCallback } from "react";
import type { LightboxFile, LightboxState } from "../types";

/**
 * Hook for managing lightbox state
 * Provides open, close, and navigation functions
 */
export function useLightbox(initialFiles: LightboxFile[] = []) {
  const [state, setState] = useState<LightboxState>({
    isOpen: false,
    currentIndex: 0,
    files: initialFiles,
  });

  const openLightbox = useCallback(
    (files: LightboxFile[], startIndex: number = 0) => {
      setState({
        isOpen: true,
        currentIndex: startIndex,
        files,
      });
    },
    [],
  );

  const closeLightbox = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const navigateToIndex = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentIndex: index,
    }));
  }, []);

  const navigateNext = useCallback(() => {
    setState((prev) => {
      const newIndex = Math.min(prev.currentIndex + 1, prev.files.length - 1);
      return { ...prev, currentIndex: newIndex };
    });
  }, []);

  const navigatePrevious = useCallback(() => {
    setState((prev) => {
      const newIndex = Math.max(prev.currentIndex - 1, 0);
      return { ...prev, currentIndex: newIndex };
    });
  }, []);

  const updateFiles = useCallback((files: LightboxFile[]) => {
    setState((prev) => ({
      ...prev,
      files,
      currentIndex: Math.min(prev.currentIndex, files.length - 1),
    }));
  }, []);

  return {
    state,
    openLightbox,
    closeLightbox,
    navigateToIndex,
    navigateNext,
    navigatePrevious,
    updateFiles,
  };
}
