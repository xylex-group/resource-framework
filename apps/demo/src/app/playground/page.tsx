"use client";

import { ResourceFormsRuntime } from "@/components/resource-forms/resource-forms-runtime";

export default function PlaygroundPage() {
  return (
    <ResourceFormsRuntime
      eyebrow="Playground"
      title="Table-backed form playground"
      description="The old static playground definitions are now persisted as `resource_forms` rows, then resolved back into full `EntityFormV2` experiences at runtime."
    />
  );
}
