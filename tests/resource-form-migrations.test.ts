import { describe, expect, it } from "vitest";

import {
  defineResourceFormSubmissionMigrationRegistry,
  migrateResolvedResourceFormSubmission,
  migrateResourceFormSubmission,
  planResourceFormSubmissionMigration,
} from "@/utils/resource-form-migrations";

const registry = defineResourceFormSubmissionMigrationRegistry({
  contact: [
    {
      fromVersion: 1,
      toVersion: 2,
      transform: (payload) => {
        const next = { ...payload };
        if (typeof next.name === "string" && next.name.trim().length > 0) {
          const [firstName = "", ...rest] = next.name.trim().split(/\s+/);
          next.first_name = firstName;
          next.last_name = rest.join(" ");
          delete next.name;
        }
        return next;
      },
    },
    {
      fromVersion: 2,
      toVersion: 3,
      transform: (payload) => {
        const next = { ...payload };
        if (typeof next.email === "string") {
          next.email_address = next.email;
          delete next.email;
        }
        return next;
      },
    },
    {
      fromVersion: 3,
      toVersion: 2,
      transform: (payload) => {
        const next = { ...payload };
        if (typeof next.email_address === "string") {
          next.email = next.email_address;
          delete next.email_address;
        }
        return next;
      },
    },
    {
      fromVersion: 2,
      toVersion: 1,
      transform: (payload) => {
        const next = { ...payload };
        const first = typeof next.first_name === "string" ? next.first_name.trim() : "";
        const last = typeof next.last_name === "string" ? next.last_name.trim() : "";
        next.name = [first, last].filter(Boolean).join(" ").trim();
        delete next.first_name;
        delete next.last_name;
        return next;
      },
    },
  ],
});

describe("resource form submission migrations", () => {
  it("plans a deterministic upgrade path across sequential versions", () => {
    const plan = planResourceFormSubmissionMigration({
      registry,
      migrationKey: "contact",
      fromVersion: 1,
      toVersion: 3,
    });

    expect(plan.map((step) => `${step.fromVersion}->${step.toVersion}`)).toEqual([
      "1->2",
      "2->3",
    ]);
  });

  it("upgrades payloads across multiple versions", () => {
    const migrated = migrateResourceFormSubmission({
      registry,
      migrationKey: "contact",
      fromVersion: 1,
      toVersion: 3,
      payload: {
        name: "Taylor Rivera",
        email: "taylor@example.com",
      },
    });

    expect(migrated).toEqual({
      first_name: "Taylor",
      last_name: "Rivera",
      email_address: "taylor@example.com",
    });
  });

  it("downgrades payloads deterministically when reverse steps exist", () => {
    const migrated = migrateResolvedResourceFormSubmission({
      registry,
      form: {
        migrationKey: "contact",
        schemaVersion: 3,
      },
      toVersion: 1,
      payload: {
        first_name: "Taylor",
        last_name: "Rivera",
        email_address: "taylor@example.com",
      },
    });

    expect(migrated).toEqual({
      name: "Taylor Rivera",
      email: "taylor@example.com",
    });
  });

  it("throws when a migration path is missing", () => {
    expect(() =>
      migrateResourceFormSubmission({
        registry,
        migrationKey: "contact",
        fromVersion: 1,
        toVersion: 4,
        payload: {},
      })).toThrow('Missing resource form submission migration for "contact" at version 3.');
  });
});
