import "./file-explorer-widget";
import "./json-widget";
import "./table-widget";
import "./chart-widget";

export {
  getSectionWidgetRenderer,
  registerSectionWidget,
} from "./registry";
export type {
  SectionWidgetRenderer,
  SectionWidgetRendererProps,
} from "./registry";
