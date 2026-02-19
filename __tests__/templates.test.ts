import { describe, expect, it } from "vitest";

import { safeTemplate } from "@/packages/resource-framework/utils/templates";

describe("safeTemplate", () => {
  it("replaces tokens with provided values", () => {
    const result = safeTemplate("Hello {{name}}!", { name: "Ada" });
    expect(result).toBe("Hello Ada!");
  });

  it("supports nested keys using dot notation", () => {
    const template = "{{user.first_name}} {{user.last_name}}";
    const value = safeTemplate(template, {
      user: { first_name: "Katherine", last_name: "Johnson" },
    });
    expect(value).toBe("Katherine Johnson");
  });

  it("strips missing or undefined tokens and trims whitespace", () => {
    const value = safeTemplate("{{foo}} - {{bar}}", { foo: "exists" });
    expect(value).toBe("exists -");
  });

  it("returns the raw string when no tokens are present", () => {
    expect(safeTemplate("no tokens", {})).toBe("no tokens");
  });
});
