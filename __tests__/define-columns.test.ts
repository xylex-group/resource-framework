import { describe, expect, it } from "vitest";

import { defineColumns } from "@/packages/resource-framework/constructors/define-columns";
import type { ResourceFieldSpec } from "@/packages/resource-framework/resource-types";

describe("defineColumns", () => {
  it("deduplicates specs by column_name and respects the first entry", () => {
    const specs: ResourceFieldSpec[] = [
      { column_name: "price", field_type: "number", data_source: { table: "orders", column: "price" }, data_type: "number" },
      { column_name: "price", field_type: "text", data_type: "string" },
      { column_name: "custom_flag", field_type: "boolean", data_type: "boolean" },
    ];

    const columns = defineColumns(specs);
    expect(columns.length).toBe(2);
    expect(columns[0].column_name).toBe("price");
    expect(columns[1].column_name).toBe("custom_flag");
  });

  it("resolves editable metadata from field_type and editor data_source overrides", () => {
    const specs: ResourceFieldSpec[] = [
      {
        column_name: "status",
        field_type: "select",
        data_type: "string",
        editor: { data_source: { table: "status_values", column: "value" } },
        editable: { data_source: { table: "unused", column: "x" } },
        update_table: "orders",
        update_column: "status",
        options: [{ value: "active", label: "Active" }],
      },
    ];

    const [statusColumn] = defineColumns(specs);
    expect(statusColumn.editable?.type).toBe("select");
    const dataSource = statusColumn.editable?.data_source;
    if (typeof dataSource === "string" || !dataSource) {
      throw new Error("expected editable data_source object");
    }
    expect(dataSource.table).toBe("status_values");
    expect(statusColumn.editable?.update_table).toBe("orders");
    expect(statusColumn.editable?.options).toEqual([{ value: "active", label: "Active" }]);
  });

  it("falls back to default editor types when field_type is missing", () => {
    const specs: ResourceFieldSpec[] = [
      {
        column_name: "closed",
        data_type: "string",
      },
    ];

    const [column] = defineColumns(specs);
    expect(column.editable?.type).toBe("select");
  });
});
