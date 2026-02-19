/**
 * Lightbox module types
 * Defines the structure for file preview lightbox system
 */

export type FileType = 
  | "image" 
  | "video" 
  | "pdf" 
  | "audio"
  | "document"
  | "unknown";

export interface LightboxFile {
  id: string;
  url: string;
  name: string;
  type?: string; // MIME type
  size?: number;
  thumbnail?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
  files: LightboxFile[];
}

export interface LightboxRendererProps {
  file: LightboxFile;
  isActive: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface LightboxProps {
  files: LightboxFile[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  showNavigation?: boolean;
  showThumbnails?: boolean;
  showDownload?: boolean;
  showInfo?: boolean;
  className?: string;
}

export type FileTypeDetector = (file: LightboxFile) => FileType;
export type FileRenderer = React.ComponentType<LightboxRendererProps>;
