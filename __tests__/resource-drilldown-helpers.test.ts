import { describe, expect, it } from "vitest";

import {
  getDrilldownTitle,
  getSectionGridClass,
  isEmptyValue,
} from "@/packages/resource-framework/components/resource_drilldown_helpers";

describe("resource drilldown helpers", () => {
  it("returns sensible grid classes for known column counts", () => {
    expect(getSectionGridClass(1)).toBe("grid-cols-1");
    expect(getSectionGridClass(3)).toBe("grid-cols-1 sm:grid-cols-3");
    expect(getSectionGridClass(4)).toBe("grid-cols-1 sm:grid-cols-4");
    expect(getSectionGridClass(999)).toBe("grid-cols-1 sm:grid-cols-2");
  });

  it("identifies empty values correctly", () => {
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue("")).toBe(true);
    expect(isEmptyValue("   ")).toBe(true);
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue({})).toBe(true);
    expect(isEmptyValue("foo")).toBe(false);
    expect(isEmptyValue([1])).toBe(false);
    expect(isEmptyValue({ foo: "bar" })).toBe(false);
  });

  it("resolves drilldown titles via template or fallback values", () => {
    const titleFromTemplate = getDrilldownTitle({
      drilldownTitle: () => "Invoice {{invoice_number}}",
      data: { invoice_number: "INV-1" },
      resourceName: "invoices",
    });
    expect(String(titleFromTemplate)).toContain("INV-1");

    const fallbackTitle = getDrilldownTitle({
      data: null,
      resourceLabel: "Customers",
      resourceName: "customers",
    });
    expect(fallbackTitle).toBe("Customers");
  });
});
