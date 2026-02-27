"use client";

import { Button } from "../ui/button";
import { useCallback } from "react";

export default function FileUploadZone() {
  const handleUpload = useCallback(() => {
    alert("Upload simulated");
  }, []);

  return (
    <div className="rounded-sm border border-dashed border-slate-700 p-6 text-sm text-slate-400">
      <p className="mb-2">Drop files here to upload.</p>
      <Button variant="ghost" onClick={handleUpload}>
        Pick a file
      </Button>
    </div>
  );
}
