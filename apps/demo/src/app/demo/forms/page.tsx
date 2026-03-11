"use client";

import { ResourceFormsRuntime } from "@/components/resource-forms/resource-forms-runtime";

export default function DemoFormsPage() {
  return (
    <ResourceFormsRuntime
      eyebrow="Demo route"
      title="Resource forms table demo"
      description="This route reads the demo app's mock resource_forms rows and renders each persisted schema end-to-end through the shared form runtime."
    />
  );
}
