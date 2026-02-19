"use client";

/**
 * Example: Integrating Lightbox with Chat Messages
 * Shows how to preview images and files from chat messages
 */

import { Lightbox, useLightbox, type LightboxFile } from "../index";
import { formatFileSize } from "../utils/format";
import { detectFileType } from "../utils/file-type-detector";

interface ChatAttachment {
  id: string;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
}

interface ChatMessage {
  id: string;
  content: string;
  attachments: ChatAttachment[];
  sender: string;
  timestamp: string;
}

interface ChatMessageWithLightboxProps {
  message: ChatMessage;
}

/**
 * Chat message component with lightbox preview for attachments
 */
export function ChatMessageWithLightbox({ message }: ChatMessageWithLightboxProps) {
  const { state, openLightbox, closeLightbox } = useLightbox();

  // Convert attachments to lightbox files
  const lightboxFiles: LightboxFile[] = message.attachments.map(attachment => ({
    id: attachment.id,
    url: attachment.url,
    name: attachment.filename,
    type: attachment.mime_type,
    size: attachment.size,
    created_at: message.timestamp,
  }));

  // Separate images from other files for different display
  const images = message.attachments.filter(a => 
    a.mime_type.startsWith("image/")
  );
  const otherFiles = message.attachments.filter(a => 
    !a.mime_type.startsWith("image/")
  );

  const handleImageClick = (attachmentId: string) => {
    const index = lightboxFiles.findIndex(f => f.id === attachmentId);
    if (index !== -1) {
      openLightbox(lightboxFiles, index);
    }
  };

  const handleFileClick = (attachmentId: string) => {
    const index = lightboxFiles.findIndex(f => f.id === attachmentId);
    if (index !== -1) {
      openLightbox(lightboxFiles, index);
    }
  };

  return (
    <div className="space-y-3">
      {/* Message content */}
      <div className="bg-hover rounded-sm p-3">
        <div className="text-xs text-secondary mb-1">
          {message.sender} · {new Date(message.timestamp).toLocaleString()}
        </div>
        <div className="text-sm text-primary">{message.content}</div>
      </div>

      {/* Image attachments - displayed as thumbnail grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(image => (
            <div
              key={image.id}
              onClick={() => handleImageClick(image.id)}
              className="relative w-32 h-32 rounded-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-border group"
            >
              <img
                src={image.url}
                alt={image.filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs">View</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other file attachments - displayed as list */}
      {otherFiles.length > 0 && (
        <div className="space-y-2">
          {otherFiles.map(file => (
            <FileAttachment
              key={file.id}
              attachment={file}
              onClick={() => handleFileClick(file.id)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        files={state.files}
        currentIndex={state.currentIndex}
        isOpen={state.isOpen}
        onClose={closeLightbox}
      />
    </div>
  );
}

/**
 * File attachment component
 */
function FileAttachment({
  attachment,
  onClick,
}: {
  attachment: ChatAttachment;
  onClick: () => void;
}) {
  const fileType = detectFileType({
    id: attachment.id,
    url: attachment.url,
    name: attachment.filename,
    type: attachment.mime_type,
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return "📄";
      case "video": return "🎥";
      case "audio": return "🎵";
      case "document": return "📝";
      default: return "📎";
    }
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 border border-border rounded-sm hover:border-brand cursor-pointer transition-colors"
    >
      <div className="text-2xl">{getFileIcon(fileType)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-primary truncate">{attachment.filename}</div>
        <div className="text-xs text-secondary">
          {formatFileSize(attachment.size)} · {attachment.mime_type}
        </div>
      </div>
      <div className="text-xs text-secondary">View</div>
    </div>
  );
}

/**
 * Example: Full chat conversation with multiple messages
 */
export function ChatConversationWithLightbox() {
  const messages: ChatMessage[] = [
    {
      id: "1",
      content: "Here are the design mockups",
      sender: "John Doe",
      timestamp: "2024-01-30T10:00:00Z",
      attachments: [
        {
          id: "img1",
          url: "https://picsum.photos/800/600?random=1",
          filename: "mockup-1.jpg",
          mime_type: "image/jpeg",
          size: 245000,
        },
        {
          id: "img2",
          url: "https://picsum.photos/800/600?random=2",
          filename: "mockup-2.jpg",
          mime_type: "image/jpeg",
          size: 312000,
        },
      ],
    },
    {
      id: "2",
      content: "And here's the project specification",
      sender: "Jane Smith",
      timestamp: "2024-01-30T10:15:00Z",
      attachments: [
        {
          id: "pdf1",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          filename: "specification.pdf",
          mime_type: "application/pdf",
          size: 425000,
        },
      ],
    },
    {
      id: "3",
      content: "Demo video of the prototype",
      sender: "John Doe",
      timestamp: "2024-01-30T11:00:00Z",
      attachments: [
        {
          id: "vid1",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          filename: "prototype-demo.mp4",
          mime_type: "video/mp4",
          size: 5242880,
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <h2 className="text-xl font-semibold text-primary mb-4">Project discussion</h2>
      {messages.map(message => (
        <ChatMessageWithLightbox key={message.id} message={message} />
      ))}
    </div>
  );
}

/**
 * Example: Images-only chat message (simplified)
 */
export function ImageOnlyChatMessage({ images }: { images: ChatAttachment[] }) {
  const { state, openLightbox, closeLightbox } = useLightbox();

  const lightboxFiles: LightboxFile[] = images.map(img => ({
    id: img.id,
    url: img.url,
    name: img.filename,
    type: img.mime_type,
    size: img.size,
  }));

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <img
            key={image.id}
            src={image.url}
            alt={image.filename}
            onClick={() => openLightbox(lightboxFiles, index)}
            className="w-full aspect-square object-cover rounded-sm cursor-pointer hover:opacity-90 transition-opacity"
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
