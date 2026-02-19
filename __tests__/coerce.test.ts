import { describe, expect, it } from "vitest";

import { coerceByDatatype } from "@/packages/resource-framework/utils/coerce";

describe("coerceByDatatype", () => {
  it("returns a number when the datatype is number and the value is numeric", () => {
    expect(coerceByDatatype("123", "number")).toBe(123);
    expect(coerceByDatatype("123.45", "number")).toBeCloseTo(123.45);
  });

  it("returns the original value when number coercion fails", () => {
    const input = "abc";
    expect(coerceByDatatype(input, "number")).toBe(input);
  });

  it("coerces boolean-like strings", () => {
    expect(coerceByDatatype("true", "boolean")).toBe(true);
    expect(coerceByDatatype("1", "boolean")).toBe(true);
    expect(coerceByDatatype("false", "boolean")).toBe(false);
  });

  it("keeps empty strings or nullish values untouched", () => {
    expect(coerceByDatatype("", "number")).toBe("");
    expect(coerceByDatatype(null, "boolean")).toBeNull();
  });

  it("returns the original value for unsupported datatypes", () => {
    const value = { foo: "bar" };
    expect(coerceByDatatype(value, "json")).toBe(value);
  });
});
