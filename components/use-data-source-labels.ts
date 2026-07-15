"use client";

import { useEffect, useState } from "react";
import { fetchDataViaAthena } from "../adapters/athena-gateway";
import type { ResourceRoute } from "../resource-types";
import type { ColumnConfigObject, ResourceData } from "@/lib/types";

export function useDataSourceLabels({
  data,
  organizationId,
  resource,
  userId,
}: {
  data?: ResourceData;
  organizationId?: string;
  resource: ResourceRoute | null;
  userId?: string;
}): Map<string, string> {
  const [labels, setLabels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!data || !resource || !Array.isArray(resource.columns)) return;

    const fetchLabels = async () => {
      const labelMap = new Map<string, string>();
      const requests = resource.columns!.flatMap((column) => {
        if (typeof column !== "object" || !column.editable?.data_source) return [];

        const config = column as ColumnConfigObject;
        const key = config.column_name;
        const value = data[key];
        if (!value) return [];

        const sourceConfig = config.editable?.data_source;
        const source: {
          label_column?: string;
          table: string;
          value_column?: string;
        } | undefined = typeof sourceConfig === "string"
          ? { table: sourceConfig.split(".")[0] }
          : sourceConfig;
        if (!source) return [];

        return [(async () => {
          const valueColumn = source.value_column || `${source.table}_id`;
          const labelColumn = source.label_column || "name";
          const response = await fetchDataViaAthena({
            table_name: source.table,
            schema: "public",
            conditions: [{
              eq_column: valueColumn,
              eq_value: value as string | number | boolean | null,
            }],
            limit: 1,
          });
          const row = Array.isArray(response.data) ? response.data[0] : undefined;
          if (!response.error && row) {
            labelMap.set(key, String((row as Record<string, unknown>)[labelColumn] || value));
          }
        })()];
      });

      await Promise.allSettled(requests);
      setLabels(labelMap);
    };

    void fetchLabels();
  }, [data, organizationId, resource, userId]);

  return labels;
}
