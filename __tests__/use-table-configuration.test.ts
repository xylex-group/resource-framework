import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { ResourceRoute } from "@/packages/resource-framework/resource-types";
import { useTableConfiguration } from "@/packages/resource-framework/hooks/useTableConfiguration";

const createResource = (overrides: Partial<ResourceRoute> = {}): ResourceRoute => ({
  table: "customers",
  columns: [
    "name",
    {
      column_name: "amount",
      cell_value_mask_label: "Amount {{currency}}",
    },
  ],
  idColumn: "id",
  avatar_column: "avatar_url",
  ...overrides,
});

const decodeEntity = (value: string) =>
  value.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

const evaluateHook = (props: Parameters<typeof useTableConfiguration>) => {
  const Component = () => {
    const result = useTableConfiguration(...props);
    return React.createElement("pre", null, JSON.stringify(result));
  };
  const markup = renderToStaticMarkup(React.createElement(Component));
  const content = decodeEntity(
    markup.replace(/^<pre>/, "").replace(/<\/pre>$/, ""),
  );
  return JSON.parse(content);
};

describe("useTableConfiguration", () => {
  it("uses rows_per_page from context settings when valid", () => {
    const output = evaluateHook([
      "customers",
      createResource(),
      { rows_per_page: "50" },
      true,
    ]);
    expect(output.limit).toBe(50);
  });

  it("falls back to the default limit when settings are missing", () => {
    const output = evaluateHook([
      "customers",
      createResource(),
      undefined,
      true,
    ]);
    expect(output.limit).toBe(100);
  });

  it("gathers referenced columns and required meta columns", () => {
    const resource = createResource({
      columns: [
        "name",
        { column_name: "amount", cell_value_mask_label: "Currency {{currency}}" },
        { column_name: "hidden", hidden: true },
      ],
    });

    const output = evaluateHook([
      "customers",
      resource,
      undefined,
      true,
    ]);

    expect(output.columns).toEqual(
      expect.arrayContaining(["name", "amount", "currency", "id", "avatar_url"]),
    );
  });

  it("respects the force_no_cache flag and experimental toggle", () => {
    const cacheResult = evaluateHook([
      "customers",
      { ...createResource(), force_no_cache: true },
      undefined,
      false,
    ]);
    expect(cacheResult.noCache).toBe(true);

    const experimentalResult = evaluateHook([
      "customers",
      createResource(),
      undefined,
      true,
    ]);
    expect(experimentalResult.noCache).toBe(false);
  });
});
