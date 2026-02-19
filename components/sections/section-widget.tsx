"use client";

import type { DrilldownSectionWidgetSpec } from "@/packages/resource-framework/resource-types";
import { getSectionWidgetRenderer } from "./widgets";

function getWidgetKey(spec: DrilldownSectionWidgetSpec, index: number) {
  return spec.id ? `${spec.id}` : `${spec.type}-${index}`;
}

export function SectionWidgetGroup({
  widgets,
  entity,
}: {
  widgets?: DrilldownSectionWidgetSpec[];
  entity: Record<string, unknown>;
}) {
  if (!widgets || widgets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {widgets.map((spec, idx) => {
        const Renderer = getSectionWidgetRenderer(spec.type);
        if (!Renderer) {
          return null;
        }

        return (
          <Renderer
            key={getWidgetKey(spec, idx)}
            spec={spec}
            entity={entity}
          />
        );
      })}
    </div>
  );
}
