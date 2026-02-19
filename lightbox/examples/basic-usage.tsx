"use client";

/**
 * Basic usage examples for the Lightbox module
 * Copy and adapt these examples for your use cases
 */

import { useState } from "react";
import { Lightbox, useLightbox, type LightboxFile } from "../index";
import { Button } from "@/components/ui/button";

// Example 1: Simple image gallery
export function SimpleImageGallery() {
  const { state, openLightbox, closeLightbox } = useLightbox();
  
  const images: LightboxFile[] = [
    {
      id: "1",
      url: "https://picsum.photos/1200/800?random=1",
      name: "Random Image 1.jpg",
      type: "image/jpeg",
      size: 245000,
    },
    {
      id: "2",
      url: "https://picsum.photos/1200/800?random=2",
      name: "Random Image 2.jpg",
      type: "image/jpeg",
      size: 312000,
    },
    {
      id: "3",
      url: "https://picsum.photos/1200/800?random=3",
      name: "Random Image 3.jpg",
      type: "image/jpeg",
      size: 198000,
    },
  ];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Simple image gallery</h3>
      <div className="grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            onClick={() => openLightbox(images, index)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-40 object-cover rounded-sm"
            />
            <div className="text-sm text-secondary mt-2">{image.name}</div>
          </div>
        ))}
      </div>
      
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
      />
    </div>
  );
}

// Example 2: Mixed media files
export function MixedMediaViewer() {
  const { state, openLightbox, closeLightbox } = useLightbox();
  
  const files: LightboxFile[] = [
    {
      id: "img-1",
      url: "https://picsum.photos/1200/800",
      name: "Sample Image.jpg",
      type: "image/jpeg",
      size: 245000,
    },
    {
      id: "vid-1",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      name: "Sample Video.mp4",
      type: "video/mp4",
      size: 5242880,
    },
    {
      id: "pdf-1",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      name: "Sample PDF.pdf",
      type: "application/pdf",
      size: 13264,
    },
  ];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Mixed media viewer</h3>
      <div className="space-y-2">
        {files.map((file, index) => (
          <Button
            key={file.id}
            onClick={() => openLightbox(files, index)}
            variant="outline"
            className="w-full justify-start"
          >
            {file.name}
          </Button>
        ))}
      </div>
      
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
      />
    </div>
  );
}

// Example 3: Single file preview (no navigation)
export function SingleFilePreview() {
  const [isOpen, setIsOpen] = useState(false);
  
  const file: LightboxFile = {
    id: "single",
    url: "https://picsum.photos/1600/900",
    name: "Product Image.jpg",
    type: "image/jpeg",
    size: 425000,
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Single file preview</h3>
      <div className="inline-block">
        <img
          src={file.url}
          alt={file.name}
          onClick={() => setIsOpen(true)}
          className="w-60 h-40 object-cover rounded-sm cursor-zoom-in hover:opacity-90 transition-opacity"
        />
        <div className="text-sm text-secondary mt-2">{file.name}</div>
      </div>
      
      <Lightbox
        files={[file]}
        currentIndex={0}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        showNavigation={false}
        showThumbnails={false}
      />
    </div>
  );
}

// Example 4: With navigation callback
export function GalleryWithTracking() {
  const { state, openLightbox, closeLightbox, navigateToIndex } = useLightbox();
  const [viewHistory, setViewHistory] = useState<string[]>([]);
  
  const files: LightboxFile[] = [
    {
      id: "a",
      url: "https://picsum.photos/1200/800?random=10",
      name: "File A.jpg",
      type: "image/jpeg",
    },
    {
      id: "b",
      url: "https://picsum.photos/1200/800?random=11",
      name: "File B.jpg",
      type: "image/jpeg",
    },
    {
      id: "c",
      url: "https://picsum.photos/1200/800?random=12",
      name: "File C.jpg",
      type: "image/jpeg",
    },
  ];
  
  const handleNavigate = (index: number) => {
    const fileName = files[index].name;
    setViewHistory(prev => [...prev, fileName]);
    navigateToIndex(index);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Gallery with tracking</h3>
      <Button onClick={() => openLightbox(files, 0)} variant="brand">
        Open gallery
      </Button>
      
      {viewHistory.length > 0 && (
        <div className="text-sm text-secondary">
          <div className="font-medium mb-1">View history:</div>
          <div className="space-y-1">
            {viewHistory.map((name, i) => (
              <div key={i}>• {name}</div>
            ))}
          </div>
        </div>
      )}
      
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

// Example 5: Minimal lightbox (no extras)
export function MinimalLightbox() {
  const { state, openLightbox, closeLightbox } = useLightbox();
  
  const file: LightboxFile = {
    id: "minimal",
    url: "https://picsum.photos/1400/900",
    name: "Minimal Preview.jpg",
    type: "image/jpeg",
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Minimal lightbox</h3>
      <Button onClick={() => openLightbox([file], 0)} variant="outline">
        View image (minimal UI)
      </Button>
      
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
        showNavigation={false}
        showThumbnails={false}
        showDownload={false}
        showInfo={false}
      />
    </div>
  );
}

// Combined demo component
export function LightboxExamples() {
  return (
    <div className="space-y-12 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-2">Lightbox examples</h1>
        <p className="text-secondary">
          Various usage examples for the lightbox module
        </p>
      </div>
      
      <SimpleImageGallery />
      <MixedMediaViewer />
      <SingleFilePreview />
      <GalleryWithTracking />
      <MinimalLightbox />
    </div>
  );
}
