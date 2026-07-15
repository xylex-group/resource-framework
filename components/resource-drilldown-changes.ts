import { buildColumnsFromRegistry } from "../constructors/column-registry";
import type { LeanColumnSpec, ResourceRoute } from "../resource-types";
import { coerceByDatatype } from "../utils/coerce";
import type { FormStateData, ResourceData } from "@/lib/types";

export interface PendingChange {
  field: string;
  newValue: unknown;
  oldValue: unknown;
}

export function calculatePendingChanges({
  columns,
  data,
  formState,
  isEditing,
}: {
  columns?: ResourceRoute["columns"];
  data?: ResourceData;
  formState: FormStateData;
  isEditing: boolean;
}): { pendingChangesCount: number; pendingChangesList: PendingChange[] } {
  if (!isEditing || !data) {
    return { pendingChangesCount: 0, pendingChangesList: [] };
  }

  const specs: Array<LeanColumnSpec<ResourceData>> = [];
  if (columns) {
    for (const [columnName, column] of Object.entries(columns)) {
      if (typeof column === "object" && column !== null) {
        specs.push({ key: columnName, ...column } as LeanColumnSpec<ResourceData>);
      }
    }
  }

  const datatypeByKey = new Map<string, string | undefined>();
  const labelByKey = new Map<string, string>();
  buildColumnsFromRegistry<ResourceData>(specs).forEach((column) => {
    const definition = column as {
      accessorKey?: string;
      id?: string;
      meta?: { datatype?: string; headerText?: string };
    };
    const key = definition.accessorKey || definition.id;
    if (!key) return;
    datatypeByKey.set(key, definition.meta?.datatype);
    if (definition.meta?.headerText) {
      labelByKey.set(key, definition.meta.headerText);
    }
  });

  const pendingChangesList = Object.keys(formState).flatMap<PendingChange>((key) => {
    const datatype = datatypeByKey.get(key);
    const newValue = coerceByDatatype(formState[key], datatype);
    const oldValue = coerceByDatatype(data[key], datatype);
    if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return [];

    return [{
      field: labelByKey.get(key) || key.replace(/_/g, " "),
      newValue,
      oldValue,
    }];
  });

  return {
    pendingChangesCount: pendingChangesList.length,
    pendingChangesList,
  };
}
