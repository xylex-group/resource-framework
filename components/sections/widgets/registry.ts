"use client";

import type { ComponentType } from "react";
import type { DrilldownSectionWidgetSpec } from "@/packages/resource-framework/resource-types";

export type SectionWidgetRendererProps = {
  spec: DrilldownSectionWidgetSpec;
  entity: Record<string, unknown>;
};

export type SectionWidgetRenderer = ComponentType<SectionWidgetRendererProps>;

const widgetRegistry: Record<string, SectionWidgetRenderer> = {};

export function registerSectionWidget(
  type: string,
  renderer: SectionWidgetRenderer
): void {
  widgetRegistry[type] = renderer;
}

export function getSectionWidgetRenderer(
  type: string
): SectionWidgetRenderer | undefined {
  return widgetRegistry[type];
}
