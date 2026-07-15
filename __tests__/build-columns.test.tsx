import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type React from "react";
import type { CellContext } from "@tanstack/react-table";

import { buildColumnsFromRegistry } from "@/packages/resource-framework/constructors/column-registry";

describe("buildColumnsFromRegistry", () => {
  it("applies labelTemplate as header text when provided", () => {
    const columns = buildColumnsFromRegistry([
      { key: "foo_bar", label: "Custom label" },
    ]);

    const firstColumn = columns[0];
    if (!firstColumn) {
      throw new Error("expected at least one column");
    }
    expect(firstColumn.meta?.headerText).toBe("Custom label");
  });

  it("renders masked links with tokens resolved", () => {
    const columns = buildColumnsFromRegistry([
      {
        key: "customer",
        href: "/customers/{{customer.id}}",
        cell_value_mask_label: "Customer {{customer.id}}",
      },
    ]);

    const column = columns[0];
    if (!column) {
      throw new Error("expected at least one column");
    }
    const cellRenderer = column.cell;
    if (typeof cellRenderer !== "function") {
      throw new Error("expected column.cell to be callable");
    }
    const cell = cellRenderer({
      row: { original: { customer: { id: "123" } } },
    } as unknown as CellContext<{ customer: { id: string } }, unknown>);
    const markup = renderToStaticMarkup(cell as React.ReactElement);

    expect(markup).toContain("Customer 123");
    expect(markup).toContain('data-slot="button"');
    expect(markup).toContain('type="button"');
  });

  it("honors viewHook/viewRender overrides", () => {
    const columns = buildColumnsFromRegistry([
      {
        key: "name",
        viewHook: () => "hook-result",
        viewRender: (viewResult: unknown) => <span>{String(viewResult)}</span>,
      },
    ]);

    const column = columns[0];
    if (!column) {
      throw new Error("expected at least one column");
    }
    const cellRenderer = column.cell;
    if (typeof cellRenderer !== "function") {
      throw new Error("expected column.cell to be callable");
    }
    const cell = (cellRenderer as (
      ctx: { row: { original: { name: string } } },
    ) => React.ReactNode)({
      row: { original: { name: "ignored" } },
    } as unknown as CellContext<{ name: string }, unknown>);
    const markup = renderToStaticMarkup(cell as React.ReactElement);

    expect(markup).toContain("hook-result");
  });
});
