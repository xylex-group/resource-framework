/**
 * Lightbox Module
 * Comprehensive file preview system for the resource framework
 * 
 * Features:
 * - Multiple file type support (images, videos, PDFs, audio)
 * - Keyboard navigation (arrows, escape, i for info)
 * - Thumbnail strip for multi-file viewing
 * - File information panel
 * - Download and external link options
 * - Extensible renderer system
 * 
 * Usage:
 * ```tsx
 * import { Button } from "@/components/ui/button";
 * import { Lightbox, useLightbox } from "@/packages/resource-framework/lightbox";
 * 
 * function MyComponent() {
 *   const { state, openLightbox, closeLightbox } = useLightbox();
 *   
 *   const handleOpenImage = () => {
 *     openLightbox([{
 *       id: "1",
 *       url: "https://example.com/image.jpg",
 *       name: "My Image",
 *       type: "image/jpeg"
 *     }], 0);
 *   };
 *   
 *   return (
 *     <>
 *       <Button onPress={handleOpenImage}>View Image</Button>
 *       <Lightbox
 *         files={state.files}
 *         currentIndex={state.currentIndex}
 *         isOpen={state.isOpen}
 *         onClose={closeLightbox}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

// Main component
export { Lightbox } from "./components/Lightbox";

// Sub-components for custom implementations
export { LightboxNavigation } from "./components/LightboxNavigation";
export { LightboxToolbar } from "./components/LightboxToolbar";
export { LightboxInfo } from "./components/LightboxInfo";
export { LightboxThumbnails } from "./components/LightboxThumbnails";

// Renderers
export {
  ImageRenderer,
  VideoRenderer,
  PdfRenderer,
  AudioRenderer,
  UnsupportedRenderer,
} from "./renderers";

// Hooks
export { useLightbox } from "./hooks/useLightbox";

// Utilities
export { detectFileType, canPreview, isPreviewSupported } from "./utils/file-type-detector";
export { formatFileSize, formatDate } from "./utils/format";
export { refreshFileUrl } from "./utils/url-refresh";

// Registry
export { getRendererForFile, registerRenderer, getRegisteredRenderers } from "./renderer-registry";

// Types
export type {
  FileType,
  LightboxFile,
  LightboxState,
  LightboxRendererProps,
  LightboxProps,
  FileTypeDetector,
  FileRenderer,
} from "./types";
