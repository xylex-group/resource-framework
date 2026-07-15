import { describe, expect, it } from "vitest";

import {
  compactCreatePayload,
  extractCreatedRow,
  getMissingRequiredFields,
} from "../utils/create-resource";

describe("create resource helpers", () => {
  it("preserves Athena column names and meaningful falsey values", () => {
    expect(compactCreatePayload({
      first_name: "Alex",
      empty: "",
      absent: undefined,
      nullable: null,
      active: false,
      count: 0,
    })).toEqual({
      first_name: "Alex",
      nullable: null,
      active: false,
      count: 0,
    });
  });

  it("reports only actually missing required values", () => {
    expect(getMissingRequiredFields({
      name: "  ",
      active: false,
      count: 0,
    }, ["name", "active", "count"])).toEqual(["name"]);
  });

  it("normalizes direct, array, and Athena envelope responses", () => {
    const row = { demo_contact_id: "contact-1", first_name: "Alex" };
    expect(extractCreatedRow(row)).toEqual(row);
    expect(extractCreatedRow([row])).toEqual(row);
    expect(extractCreatedRow({ data: [row] })).toEqual(row);
    expect(extractCreatedRow(null)).toBeNull();
  });
});
