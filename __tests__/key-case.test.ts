import { describe, expect, it } from "vitest";

import {
  getValueByKeyCase,
  getValueByPathCase,
  toCamelCase,
  toSnakeCase,
} from "@/packages/resource-framework/utils/key-case";

describe("key-case utilities", () => {
  it("converts snake case to camel case", () => {
    expect(toCamelCase("first_name")).toBe("firstName");
    expect(toCamelCase("alreadyCamelCase")).toBe("alreadyCamelCase");
  });

  it("converts mixed strings to snake case", () => {
    expect(toSnakeCase("FirstName")).toBe("_first_name");
    expect(toSnakeCase("space separated")).toBe("space_separated");
  });

  it("finds values using different casing styles", () => {
    const data = { firstName: "Ada", last_name: "Lovelace" };
    expect(getValueByKeyCase(data, "first_name")).toBe("Ada");
    expect(getValueByKeyCase(data, "lastName")).toBe("Lovelace");
    expect(getValueByKeyCase(data, "unknown")).toBeUndefined();
  });

  it("walks dot-paths to resolve nested values", () => {
    const input = {
      user: {
        profile: {
          display_name: "Grace Hopper",
        },
      },
    };
    expect(getValueByPathCase(input, "user.profile.display_name")).toBe(
      "Grace Hopper",
    );
  });

  it("returns undefined for missing paths or empty inputs", () => {
    expect(getValueByPathCase(null, "nope")).toBeUndefined();
    expect(getValueByPathCase({ foo: "bar" }, "")).toBeUndefined();
  });
});
