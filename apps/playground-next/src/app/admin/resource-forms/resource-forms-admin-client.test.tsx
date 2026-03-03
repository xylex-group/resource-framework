// @vitest-environment jsdom

import React, { type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createResourceFormRow, defineResourceForm } from "@xylex-group/resource-framework";
import { playgroundFormDefinitions } from "../../../lib/resource-forms";
import { ResourceFormsAdminClient } from "./resource-forms-admin-client";

const mockUseApiClient = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("@xylex-group/resource-framework", async () => {
  const actual = await vi.importActual<typeof import("@xylex-group/resource-framework")>(
    "@xylex-group/resource-framework",
  );

  return {
    ...actual,
    useApiClient: (...args: unknown[]) => mockUseApiClient(...args),
  };
});

describe("ResourceFormsAdminClient", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUseApiClient.mockReset();
  });

  it("saves existing rows through update with explicit version lineage", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const mutate = vi.fn().mockResolvedValue(undefined);

    const existingRow = createResourceFormRow(
      defineResourceForm({
        id: "contact",
        title: "Contact intake form",
        schemaVersion: 2,
        migrationKey: "contact",
        schema: {
          entity: "contact",
          steps: {
            details: [
              {
                key: "first_name",
                label: "First name",
                type: "text",
                required: true,
              },
            ],
          },
        },
      }),
    );

    mockUseApiClient.mockReturnValue({
      data: [existingRow],
      isLoading: false,
      isError: false,
      error: null,
      insert: vi.fn(),
      insertMany: vi.fn(),
      update,
      mutate,
    });

    render(<ResourceFormsAdminClient />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Contact intake v4" },
    });
    fireEvent.change(screen.getByLabelText("Schema version"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Migration key"), {
      target: { value: "contact" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save row" }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledTimes(1);
    });

    expect(update).toHaveBeenCalledWith(
      "resource_form_id",
      existingRow.resource_form_id,
      expect.objectContaining({
        title: "Contact intake v4",
        schema_version: 4,
        migration_key: "contact",
      }),
    );
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Updated contact.")).toBeTruthy();
  });

  it("seeds canonical definitions through insertMany with versioned rows", async () => {
    const insertMany = vi.fn().mockResolvedValue(undefined);
    const mutate = vi.fn().mockResolvedValue(undefined);

    mockUseApiClient.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      insert: vi.fn(),
      insertMany,
      update: vi.fn(),
      mutate,
    });

    render(<ResourceFormsAdminClient />);
    fireEvent.click(screen.getByRole("button", { name: "Seed canonical definitions" }));

    await waitFor(() => {
      expect(insertMany).toHaveBeenCalledTimes(1);
    });

    const [rows] = insertMany.mock.calls[0] as [Array<Record<string, unknown>>];
    expect(rows).toHaveLength(playgroundFormDefinitions.length);
    expect(rows.every((row) => row.schema_version === 1)).toBe(true);
    expect(rows.map((row) => row.migration_key)).toEqual(["contact", "kyc", "checkout"]);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Seeded canonical playground definitions.")).toBeTruthy();
  });
});
