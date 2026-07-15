"use client";

import { useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface UploadedFile {
  fileKey: string;
  url: string;
}

export interface FileUploadZoneFormProps {
  organizationId: string;
  projectId: string;
  onUploadedAction: (files: UploadedFile[]) => void;
}

export default function FileUploadZoneForm({
  organizationId,
  projectId,
  onUploadedAction,
}: FileUploadZoneFormProps) {
  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      onUploadedAction([
        {
          fileKey: `${organizationId}-${projectId}-${file.name}`,
          url: previewUrl,
        },
      ]);
    },
    [organizationId, projectId, onUploadedAction],
  );

  return (
    <div className="space-y-2 rounded-sm border border-dashed border-slate-700 p-3 text-sm text-slate-200">
      <p>Drag & drop a file or click to upload.</p>
      <label className="inline-flex cursor-pointer items-center gap-2">
        <Input type="file" className="hidden" onChange={handleUpload} />
        <Button variant="ghost" type="button">
          Choose file
        </Button>
      </label>
    </div>
  );
}
