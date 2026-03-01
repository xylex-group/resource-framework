# Sonner Notifications

Toast notification system using Sonner for user feedback.

## Overview

The resource framework uses [Sonner](https://sonner.emilkowal.ski/) for toast notifications. All notifications follow a consistent style and behavior pattern defined in the framework's notification utilities.

## Basic Usage

```typescript
import { useNotification } from "@/packages/resource-framework/hooks/useNotification";

function MyComponent() {
  const { notification } = useNotification();

  const handleAction = async () => {
    try {
      await someAction();
      notification({
        message: "Action completed successfully",
        success: true,
      });
    } catch (error) {
      notification({
        message: "Action failed",
        success: false,
      });
    }
  };

  return <button onClick={handleAction}>Do something</button>;
}
```

## Notification Options

```typescript
interface UseNotificationOptions {
  message: string;              // Toast message content
  icon?: ReactNode;             // Custom icon (optional)
  idempotencyKey?: string;      // Prevent duplicate toasts
  success?: boolean;            // Success state (default: true)
}
```

### Message

The main content displayed in the toast.

```typescript
notification({
  message: "Customer created successfully",
  success: true,
});
```

### Custom Icon

Override the default information icon.

```typescript
import { CheckCircle } from "lucide-react";

notification({
  message: "File uploaded",
  icon: <CheckCircle className="w-4 h-4 stroke-icon" />,
  success: true,
});
```

### Idempotency Key

Prevent duplicate toasts when the same action is triggered multiple times.

```typescript
notification({
  message: "Loading data",
  idempotencyKey: "data-loading",
  success: true,
});
```

### Success State

Controls the visual style of the notification (currently applies consistent styling).

```typescript
// Success notification
notification({
  message: "Operation completed",
  success: true,
});

// Error notification
notification({
  message: "Operation failed",
  success: false,
});
```

## Toast Styling

All toasts use consistent styling defined in the notification configuration:

- **Height**: 43px fixed height
- **Border**: Rounded with `rounded-sm`
- **Text**: Primary text color with medium font weight
- **Duration**: 3000ms (3 seconds)
- **Icon**: Information icon by default
- **Dismissible**: Close button with X icon

## File Upload Status Toast

The framework provides a specialized upload status notification that tracks multiple concurrent file uploads.

### Usage

```typescript
import { uploadFileViaAthena } from "@/packages/resource-framework/adapters";
import { useFileUploadStatus } from "@/packages/resource-framework/notifications/upload-status";

function FileUploader() {
  const { startUpload, finishUpload } = useFileUploadStatus();

  const handleUpload = async (files: File[]) => {
    const uploadId = startUpload(files.length);

    try {
      for (const file of files) {
        await uploadFile(file);
      }
    } finally {
      finishUpload(uploadId);
    }
  };

  return <input type="file" onChange={(e) => handleUpload(Array.from(e.target.files))} />;
}
```

### Behavior

The upload status toast automatically:

- **Shows count**: Displays "1 file uploading" or "2 files uploading"
- **Aggregates**: Multiple concurrent uploads increment the counter
- **Auto-dismisses**: When all uploads complete, the toast dismisses
- **Persists**: Stays visible while any upload is in progress

### Example: File Explorer Widget

```typescript
import { useFileUploadStatus } from "@/packages/resource-framework/notifications/upload-status";

function FileExplorerWidget() {
  const { startUpload, finishUpload } = useFileUploadStatus();

  const handleUpload = async (selectedFiles: File[]) => {
    const uploadId = startUpload(selectedFiles.length);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        await uploadFileViaAthena(formData);
      }
    } finally {
      finishUpload(uploadId);
    }
  };

  return <FileExplorer onUpload={handleUpload} />;
}
```

## Advanced Patterns

### Updating Toast Content

```typescript
import { toast } from "sonner";

const toastId = toast("Processing...");

// Update the toast later
toast.success("Processing complete!", { id: toastId });
```

### Loading Toast

```typescript
import { toast } from "sonner";

const toastId = toast.loading("Uploading files...");

try {
  await uploadFiles();
  toast.success("Upload complete!", { id: toastId });
} catch (error) {
  toast.error("Upload failed", { id: toastId });
}
```

### Promise Toast

```typescript
import { toast } from "sonner";

toast.promise(uploadFiles(), {
  loading: "Uploading...",
  success: "Upload complete!",
  error: "Upload failed",
});
```

## Toast Configuration

Global toast configuration is defined in `components/ui/sonner.tsx`:

```typescript
<Toaster
  position="bottom-right"
  theme={theme}
  toastOptions={{
    classNames: {
      toast: "group-[.toaster]:bg-background...",
      description: "group-[.toast]:text-muted-foreground",
      actionButton: "group-[.toast]:data-[button]:h-8...",
      cancelButton: "group-[.toast]:data-[button]:h-8...",
    },
  }}
/>
```

## Best Practices

1. **Use consistent messages**: Keep notification messages concise and actionable
2. **Handle errors**: Always show notifications for failed actions
3. **Avoid spam**: Use idempotency keys for repeated actions
4. **Provide context**: Include relevant details in error messages
5. **Success feedback**: Confirm successful actions with positive notifications

### Good Examples

```typescript
// Good: Clear and concise
notification({
  message: "Invoice created successfully",
  success: true,
});

// Good: Specific error with context
notification({
  message: "Failed to upload file: File too large",
  success: false,
});

// Good: Using idempotency
notification({
  message: "Saving changes",
  idempotencyKey: "save-changes",
  success: true,
});
```

### Bad Examples

```typescript
// Bad: Too verbose
notification({
  message: "The customer record has been successfully created in the database",
  success: true,
});

// Bad: Not specific enough
notification({
  message: "Error",
  success: false,
});

// Bad: No idempotency for repeated action
setInterval(() => {
  notification({ message: "Auto-save", success: true });
}, 1000); // Creates spam
```

## Integration with Error Handling

Combine notifications with error boundaries and try-catch blocks:

```typescript
import { useNotification } from "@/packages/resource-framework/hooks/useNotification";

function DataForm() {
  const { notification } = useNotification();

  const handleSubmit = async (data) => {
    try {
      await saveData(data);
      notification({
        message: "Data saved successfully",
        success: true,
      });
    } catch (error) {
      notification({
        message: `Failed to save: ${error.message}`,
        success: false,
      });
      console.error("Save error:", error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## See Also

- [Error Handling](./28-error-handling.md)
- [Hooks](./05-hooks.md)
- [File Explorer Widget](./20-file-explorer-widget.md)
