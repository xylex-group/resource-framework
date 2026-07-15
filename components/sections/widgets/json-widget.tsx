"use client";

import { JsonBlock } from "@/components/json/json-block";
import {
  registerSectionWidget,
  type SectionWidgetRendererProps,
} from "./registry";

const FALLBACK_TITLE = "Raw payload";

function JsonSectionWidget({ spec, entity }: SectionWidgetRendererProps) {
  if (spec.type !== "json") {
    return null;
  }
  const props = spec.props ?? {};
  const title =
    typeof props.title === "string" ? props.title : FALLBACK_TITLE;
  const description =
    typeof props.description === "string" ? props.description : "";
  const blockClassName =
    typeof props.blockClassName === "string" ? props.blockClassName : "";

  return (
    <div className="space-y-2 rounded-sm border border-muted bg-background p-4">
      {title && (
        <div className="text-sm font-semibold text-primary">{title}</div>
      )}
      {description && (
        <p className="text-xs text-secondary">{description}</p>
      )}
      <JsonBlock data={entity} className={blockClassName} />
    </div>
  );
}

registerSectionWidget("json", JsonSectionWidget);
