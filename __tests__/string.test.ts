import { describe, expect, it } from "vitest";

import { prettyString } from "@/packages/resource-framework/utils/string";

describe("prettyString", () => {
  it("turns snake case into capitalized words", () => {
    expect(prettyString("first_name")).toBe("First Name");
  });

  it("splits camel case and trims underscores", () => {
    expect(prettyString("checkoutTotal")).toBe("Checkout Total");
  });

  it("forces uppercase when requested", () => {
    expect(prettyString("order_status", true)).toBe("ORDER STATUS");
  });

  it("returns an empty string for falsy inputs", () => {
    expect(prettyString("")).toBe("");
    expect(prettyString(null as unknown as string)).toBe("");
  });
});
