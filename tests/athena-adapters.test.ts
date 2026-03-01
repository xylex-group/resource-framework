import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const createClientMock = vi.fn(() => ({
  from: fromMock,
}));

vi.mock("@xylex-group/athena", () => ({
  Backend: {
    Athena: { type: "athena" },
  },
  createClient: createClientMock,
}));

vi.mock("@/lib/config", () => ({
  APP_CONFIG: {
    athena: {
      db_api_url: "https://athena-db.com",
      standard_client: "railway_direct",
      api_key: "test-key",
    },
  },
}));

describe("Athena adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps fetchDataViaAthena to the Athena SDK query builder", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [{ customer_id: "cust-1" }],
      error: null,
    });
    const offset = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ offset, limit }));
    fromMock.mockReturnValue({ eq, offset, limit });

    const { fetchDataViaAthena } = await import(
      "@/packages/resource-framework/adapters/athena-gateway"
    );

    const result = await fetchDataViaAthena({
      table_name: "customers",
      columns: ["customer_id", "name"],
      conditions: [{ eq_column: "organization_id", eq_value: "org-1" }],
      limit: 10,
      offset: 20,
    }, {
      headers: { "X-Organization-Id": "org-1" },
    });

    expect(createClientMock).toHaveBeenCalledWith(
      "https://athena-db.com",
      "test-key",
      expect.objectContaining({
        client: "railway_direct",
        headers: expect.objectContaining({
          "X-Organization-Id": "org-1",
          "X-Request-Id": expect.any(String),
        }),
      }),
    );
    expect(fromMock).toHaveBeenCalledWith("customers");
    expect(eq).toHaveBeenCalledWith("organization_id", "org-1");
    expect(offset).toHaveBeenCalledWith(20);
    expect(limit).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      data: [{ customer_id: "cust-1" }],
      error: null,
    });
  });

  it("normalizes single-row mutations from the Athena SDK", async () => {
    const select = vi.fn().mockResolvedValue({
      data: [{ customer_id: "cust-1", status: "active" }],
      error: null,
    });
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq, select }));
    fromMock.mockReturnValue({ update });

    const { updateDataViaAthena } = await import(
      "@/packages/resource-framework/adapters/athena-gateway"
    );

    const result = await updateDataViaAthena({
      table_name: "customers",
      x_column: "customer_id",
      x_id: "cust-1",
      update_body: { status: "active" },
    });

    expect(fromMock).toHaveBeenCalledWith("customers");
    expect(update).toHaveBeenCalledWith({ status: "active" });
    expect(eq).toHaveBeenCalledWith("customer_id", "cust-1");
    expect(result).toEqual({
      data: { customer_id: "cust-1", status: "active" },
      error: null,
    });
  });

  it("uses Athena file endpoints for upload and refresh-url", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            url: "https://athena-db.com/files/file.pdf",
            file_url: "https://athena-db.com/files/file.pdf",
            storage_key: "rsf/org-1/customers/cust-1/file.pdf",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          url: "https://athena-db.com/files/file.pdf?token=fresh",
          expiresIn: 3600,
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { refreshFileUrlViaAthena, uploadFileViaAthena } = await import(
      "@/packages/resource-framework/adapters/athena-files"
    );

    const formData = new FormData();
    formData.append("file", new Blob(["hello"], { type: "text/plain" }), "file.txt");

    const uploadResult = await uploadFileViaAthena(formData);
    const refreshResult = await refreshFileUrlViaAthena({
      fileKey: "rsf/org-1/customers/cust-1/file.pdf",
      bucket: "suitsconnect",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://athena-db.com/api/upload",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Request-Id": expect.any(String),
          "Idempotency-Key": expect.any(String),
          "X-Idempotency-Key": expect.any(String),
        }),
        body: formData,
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://athena-db.com/api/files/refresh-url",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Request-Id": expect.any(String),
          "Idempotency-Key": expect.any(String),
          "X-Idempotency-Key": expect.any(String),
        }),
      }),
    );
    expect(uploadResult.storage_key).toBe("rsf/org-1/customers/cust-1/file.pdf");
    expect(refreshResult.url).toContain("token=fresh");

    vi.unstubAllGlobals();
  });
});
