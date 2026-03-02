import type { ResourceFormRow } from "@rf/resource-types";
import {
  playgroundFormDefinitions,
  playgroundResourceFormRows,
  resolveResourceFormRows,
} from "@rf/demo/playground-forms";
import type { ResolvedResourceForm } from "@rf/utils/resource-forms";

export type DemoResourceFormRow = ResourceFormRow;
export type DemoResourceFormDefinition = (typeof playgroundFormDefinitions)[number];
export type ResolvedDemoResourceForm = ResolvedResourceForm;

export { playgroundFormDefinitions, playgroundResourceFormRows, resolveResourceFormRows };
