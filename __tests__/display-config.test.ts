import { describe, expect, it } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";

import { generateDisplayConfig } from "@/packages/resource-framework/utils/display-config";
import type { TableRowData } from "@/packages/resource-framework/resource-types";

describe("generateDisplayConfig", () => {
  it("produces toggles for every column and uses header fallbacks", () => {
    const columns = [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "balance" },
      {
        id: "custom_column",
        meta: { headerText: "Custom Header" },
        header: "Should be ignored in favor of meta",
      },
    ];

    const config = generateDisplayConfig(columns as Array<ColumnDef<TableRowData>>);
    expect(config.some((entry) => entry.value === "show_name")).toBe(true);
    expect(config.some((entry) => entry.value === "show_balance")).toBe(true);
    expect(config.some((entry) => entry.value === "show_custom_column")).toBe(
      true,
    );
  });

  it("includes sort options for sortable columns", () => {
    const columns = [
      { accessorKey: "name", header: "Name", enableSorting: true },
      { accessorKey: "hidden", header: "Hidden", enableSorting: false },
    ];

    const config = generateDisplayConfig(columns as Array<ColumnDef<TableRowData>>);
    const sortEntry = config.find(
      (entry) => entry.type === "sort" && entry.value === "sort_by",
    );
    expect(sortEntry).toBeDefined();
    if (sortEntry?.type !== "sort") {
      throw new Error("expected sort entry");
    }
    expect(sortEntry.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "name_asc" }),
        expect.objectContaining({ value: "name_desc" }),
      ]),
    );
  });

  it("always appends display rows per page defaults", () => {
    const config = generateDisplayConfig([]);
    const rowsEntry = config.find(
      (entry) =>
        entry.type === "rows_per_page" && entry.value === "rows_per_page",
    );
    expect(rowsEntry).toBeDefined();
    if (rowsEntry?.type !== "rows_per_page") {
      throw new Error("expected rows_per_page entry");
    }
    expect(rowsEntry.defaultValue).toBe("25");
    expect(rowsEntry.options.length).toBeGreaterThan(0);
  });
});
