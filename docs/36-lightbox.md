# Lightbox Module

## Overview

The Lightbox module provides a comprehensive, reusable file preview system for the resource framework. It supports multiple file types with dedicated renderers, keyboard navigation, and a modern UI that integrates seamlessly with the design system.

## Architecture

### Module Structure

```
lightbox/
├── types.ts                      # Type definitions
├── index.ts                      # Public API exports
├── README.md                     # Module documentation
├── renderer-registry.tsx         # Renderer registration system
├── components/
│   ├── Lightbox.tsx             # Main lightbox component
│   ├── LightboxNavigation.tsx   # Previous/Next controls
│   ├── LightboxToolbar.tsx      # Action buttons (download, info, close)
│   ├── LightboxInfo.tsx         # File metadata panel
│   └── LightboxThumbnails.tsx   # Thumbnail strip
├── renderers/
│   ├── index.ts                 # Renderer exports
│   ├── ImageRenderer.tsx        # Image preview
│   ├── VideoRenderer.tsx        # Video player
│   ├── PdfRenderer.tsx          # PDF viewer
│   ├── AudioRenderer.tsx        # Audio player
│   └── UnsupportedRenderer.tsx  # Fallback renderer
├── hooks/
│   └── useLightbox.ts          # State management hook
├── utils/
│   ├── file-type-detector.ts   # File type detection
│   └── format.ts                # Formatting utilities
└── examples/
    └── basic-usage.tsx          # Usage examples
```

### Core Concepts

1. **File Type Detection**: Automatically determines file type from MIME type or extension
2. **Renderer Registry**: Maps file types to appropriate renderer components
3. **State Management**: Hook-based state management for opening, closing, and navigation
4. **Extensibility**: Easy to add custom renderers for new file types

## Components

### Lightbox

The main component that orchestrates the entire preview experience.

```tsx
import { Lightbox } from "@/packages/resource-framework/lightbox";

<Lightbox
  files={files}
  currentIndex={0}
  isOpen={true}
  onClose={() => {}}
  onNavigate={(index) => {}}
  showNavigation={true}
  showThumbnails={true}
  showDownload={true}
  showInfo={true}
/>
```

**Features:**
- Full-screen overlay
- Keyboard navigation (arrows, escape)
- File info panel (toggle with 'i' key)
- Download and external link options
- Thumbnail strip for multi-file viewing
- Navigation controls

### LightboxNavigation

Previous/Next navigation controls with file counter.

```tsx
import { LightboxNavigation } from "@/packages/resource-framework/lightbox";

<LightboxNavigation
  currentIndex={0}
  totalFiles={5}
  onPrevious={() => {}}
  onNext={() => {}}
/>
```

### LightboxToolbar

Action buttons toolbar (download, info, external link, close).

```tsx
import { LightboxToolbar } from "@/packages/resource-framework/lightbox";

<LightboxToolbar
  file={file}
  onClose={() => {}}
  onToggleInfo={() => {}}
  showDownload={true}
  showInfo={true}
  infoVisible={false}
/>
```

### LightboxInfo

Metadata panel showing file details.

```tsx
import { LightboxInfo } from "@/packages/resource-framework/lightbox";

<LightboxInfo
  file={file}
  isVisible={true}
/>
```

**Displays:**
- File name
- File type
- MIME type
- File size
- Created date
- Modified date
- Full URL

### LightboxThumbnails

Thumbnail strip for quick navigation.

```tsx
import { LightboxThumbnails } from "@/packages/resource-framework/lightbox";

<LightboxThumbnails
  files={files}
  currentIndex={0}
  onSelect={(index) => {}}
/>
```

## Renderers

### ImageRenderer

Displays images with loading states and error handling.

**Supported formats:**
- JPEG, PNG, GIF, WebP, SVG, BMP, ICO, AVIF

**Features:**
- Lazy loading
- Loading spinner
- Error fallback
- Object-contain scaling

### VideoRenderer

Full-featured video player with controls.

**Supported formats:**
- MP4, WebM, OGG, MOV, AVI, MKV

**Features:**
- Play/pause
- Seek backward/forward
- Timeline scrubbing
- Volume control
- Time display

### PdfRenderer

PDF viewer with iframe embedding.

**Features:**
- Embedded PDF viewer
- Download button
- Open in new tab
- Error fallback

### AudioRenderer

Audio player with native controls.

**Supported formats:**
- MP3, WAV, OGG, M4A, AAC, FLAC

**Features:**
- Native audio controls
- Visual representation
- File info display

### UnsupportedRenderer

Fallback for unsupported file types.

**Features:**
- File information display
- Download button
- Open in new tab button

## Hooks

### useLightbox

State management hook for lightbox functionality.

```tsx
import { useLightbox } from "@/packages/resource-framework/lightbox";

const {
  state,              // { isOpen, currentIndex, files }
  openLightbox,       // (files, startIndex) => void
  closeLightbox,      // () => void
  navigateToIndex,    // (index) => void
  navigateNext,       // () => void
  navigatePrevious,   // () => void
  updateFiles,        // (files) => void
} = useLightbox();
```

**State interface:**
```typescript
interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
  files: LightboxFile[];
}
```

## Utilities

### detectFileType

Automatically detects file type from MIME type or file extension.

```tsx
import { detectFileType } from "@/packages/resource-framework/lightbox";

const fileType = detectFileType(file);
// Returns: "image" | "video" | "pdf" | "audio" | "document" | "unknown"
```

**Detection priority:**
1. MIME type (if provided)
2. File extension from URL
3. File extension from name

### canPreview / isPreviewSupported

Check if a file type can be previewed.

```tsx
import { canPreview, isPreviewSupported } from "@/packages/resource-framework/lightbox";

const supported = canPreview(file);           // boolean
const typeSupported = isPreviewSupported("image"); // boolean
```

### formatFileSize

Format bytes to human-readable size.

```tsx
import { formatFileSize } from "@/packages/resource-framework/lightbox";

formatFileSize(1024000); // "1000 KB"
formatFileSize(5242880); // "5 MB"
```

### formatDate

Format date string to readable format.

```tsx
import { formatDate } from "@/packages/resource-framework/lightbox";

formatDate("2024-01-30T12:00:00Z"); // "Jan 30, 2024, 12:00 PM"
```

## Re-authorizing Signed URLs

Preview URLs that point to S3/MinIO often expire after a short time. The lightbox exposes both a helper and a hook
to refresh those links when necessary:

```tsx
import {
  refreshFileUrl,
  useAuthorizedFileUrl,
} from "@/packages/resource-framework/lightbox";

function PreviewActions({ file }: { file: LightboxFile }) {
  const {
    authorizedUrl,
    isRefreshing,
    refreshAuthorizedUrl,
  } = useAuthorizedFileUrl(file.url);

  const download = async () => {
    const fresh = await refreshAuthorizedUrl().catch(() => authorizedUrl);
    await fetch(fresh, { cache: "no-store" });
    // save blob ...
  };

  return (
    <button disabled={isRefreshing} onClick={download}>
      Download fresh file
    </button>
  );
}
```

`refreshFileUrl` is the low-level API that hits `/api/files/refresh-url` and returns a newly signed URL; `useAuthorizedFileUrl`
wraps it in a hook that keeps the current URL in sync with the active file, surfaces `isRefreshing`, and exposes a `refreshAuthorizedUrl`
helper you can call before downloads, new-tab navigation, or when a renderer reports a 403/expired error. Do **not** cache the
authorized URLs longer than the preview session—always refresh them again before a new action.

## Renderer Registry

### getRendererForFile

Get the appropriate renderer for a file.

```tsx
import { getRendererForFile } from "@/packages/resource-framework/lightbox";

const Renderer = getRendererForFile(file);
```

### registerRenderer

Register a custom renderer for a file type.

```tsx
import { registerRenderer } from "@/packages/resource-framework/lightbox";

const CustomRenderer = ({ file, isActive, onLoad, onError }) => {
  return <div>Custom preview for {file.name}</div>;
};

registerRenderer("custom", CustomRenderer);
```

## Types

### LightboxFile

```typescript
interface LightboxFile {
  id: string;              // Unique identifier
  url: string;             // File URL (required)
  name: string;            // Display name (required)
  type?: string;           // MIME type (optional but recommended)
  size?: number;           // File size in bytes (optional)
  thumbnail?: string;      // Thumbnail URL (optional)
  created_at?: string;     // Creation date (optional)
  updated_at?: string;     // Last modified date (optional)
}
```

### LightboxProps

```typescript
interface LightboxProps {
  files: LightboxFile[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  showNavigation?: boolean;      // default: true
  showThumbnails?: boolean;      // default: true
  showDownload?: boolean;        // default: true
  showInfo?: boolean;            // default: true
  className?: string;
}
```

### LightboxRendererProps

```typescript
interface LightboxRendererProps {
  file: LightboxFile;
  isActive: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}
```

## Integration Examples

### File Explorer Widget Integration

```tsx
import { Lightbox, useLightbox, type LightboxFile } from "@/packages/resource-framework/lightbox";

function FileExplorerWithPreview({ files }) {
  const { state, openLightbox, closeLightbox } = useLightbox();
  
  const handleFileClick = (file, index) => {
    const lightboxFiles: LightboxFile[] = files.map(f => ({
      id: f.file_id,
      url: f.url,
      name: f.file_name,
      type: f.mime_type,
      size: f.file_size,
      created_at: f.created_at,
      updated_at: f.updated_at,
    }));
    
    openLightbox(lightboxFiles, index);
  };
  
  return (
    <>
      <DrilldownFileExplorer
        files={files}
        onFileClick={handleFileClick}
      />
      
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
      />
    </>
  );
}
```

### Chat Images Integration

```tsx
function ChatMessage({ message }) {
  const { state, openLightbox, closeLightbox } = useLightbox();
  
  const images = message.attachments.filter(a => 
    a.type?.startsWith("image")
  );
  
  const handleImageClick = (index) => {
    const lightboxFiles: LightboxFile[] = images.map(img => ({
      id: img.id,
      url: img.url,
      name: img.filename,
      type: img.type,
      size: img.size,
    }));
    
    openLightbox(lightboxFiles, index);
  };
  
  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {images.map((img, index) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.filename}
            onClick={() => handleImageClick(index)}
            className="w-24 h-24 object-cover rounded-sm cursor-pointer hover:opacity-90"
          />
        ))}
      </div>
      
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
      />
    </>
  );
}
```

### Single Image Preview

```tsx
function ProductImage({ imageUrl, imageName }) {
  const { state, openLightbox, closeLightbox } = useLightbox();
  
  const handleViewImage = () => {
    openLightbox([{
      id: "product-image",
      url: imageUrl,
      name: imageName,
      type: "image/jpeg",
    }], 0);
  };
  
  return (
    <>
      <img
        src={imageUrl}
        alt={imageName}
        onClick={handleViewImage}
        className="cursor-zoom-in"
      />
      
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
        showNavigation={false}
        showThumbnails={false}
      />
    </>
  );
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← | Previous file |
| → | Next file |
| Escape | Close lightbox |
| i | Toggle info panel |

## Styling

The lightbox follows the project's design system:

- **Overlay**: `bg-black/90` for dark background
- **Controls**: Semi-transparent with backdrop blur
- **Buttons**: `variant="icon_v2"` and `size="icon_v2"`
- **Icons**: `w-5 h-5 stroke-icon` from lucide-react
- **Borders**: `rounded-sm` for consistent rounding
- **Text**: `text-primary` and `text-secondary` for hierarchy

## Performance

- **Lazy Loading**: Images load only when active
- **Conditional Preload**: Videos preload based on active state
- **Efficient Rendering**: Only active renderer is mounted
- **Event Cleanup**: Keyboard listeners removed on unmount
- **Thumbnail Optimization**: Can use separate thumbnail URLs

## Accessibility

- Full keyboard navigation support
- ARIA labels on all interactive elements
- Focus management
- Screen reader friendly
- Proper semantic HTML structure

## Best Practices

1. **Provide MIME Types**: Always include `type` in LightboxFile for accurate detection
2. **Use Thumbnails**: Provide `thumbnail` URLs for faster loading in strips
3. **Include Metadata**: Add `size`, `created_at`, etc. for better info display
4. **Handle Errors**: Implement `onError` callbacks for tracking failures
5. **Lazy Load**: Only open lightbox when user initiates action
6. **Cleanup**: Let the hook manage state cleanup on unmount

## Extending the Module

### Creating a Custom Renderer

```tsx
import { registerRenderer, type LightboxRendererProps } from "@/packages/resource-framework/lightbox";

function CustomRenderer({ file, isActive, onLoad, onError }: LightboxRendererProps) {
  // Your custom rendering logic
  return (
    <div className="custom-preview">
      <h3>{file.name}</h3>
      {/* Custom preview UI */}
    </div>
  );
}

// Register for a specific file type
registerRenderer("custom", CustomRenderer);
```

### Adding New File Type Detection

Modify `utils/file-type-detector.ts` to add new MIME types or extensions:

```typescript
const NEW_TYPE_EXTENSIONS = ["ext1", "ext2"];
const NEW_TYPE_MIME_TYPES = ["application/x-new"];
```

## Future Enhancements

Potential future additions:
- Zoom controls for images
- Image rotation
- Full-screen mode toggle
- Slideshow with auto-advance
- Touch gesture support for mobile
- Image comparison view
- Annotation tools
- Print functionality
- Batch download
- Share options

## See Also

- [File Explorer Widget](./20-file-explorer-widget.md)
- [Drilldown Layout](./21-drilldown-layout.md)
- [Components](./06-components.md)
