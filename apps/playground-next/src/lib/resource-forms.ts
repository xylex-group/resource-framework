import type { ResourceFormRow } from "@xylex-group/resource-framework/resource-types";
import {
  playgroundFormDefinitions,
  playgroundResourceFormRows,
  resolveResourceFormRows,
} from "@xylex-group/resource-framework/demo/playground-forms";
import type { ResolvedResourceForm } from "@xylex-group/resource-framework";

export type PlaygroundResourceFormRow = ResourceFormRow;
export type PlaygroundFormDefinition = (typeof playgroundFormDefinitions)[number];
export type ResolvedPlaygroundResourceForm = ResolvedResourceForm;

export { playgroundFormDefinitions, playgroundResourceFormRows, resolveResourceFormRows };
