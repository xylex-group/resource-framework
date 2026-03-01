"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  refreshFileUrlViaAthena,
  uploadFileViaAthena,
} from "@xylex-group/resource-framework/adapters/athena-files";
import { useApiClient } from "@xylex-group/resource-framework/hooks/use-api-client";
import { useUserStore } from "@/lib/stores";

type PlaygroundRow = Record<string, unknown>;

const sectionStyle: React.CSSProperties = {
  backdropFilter: "blur(18px)",
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 24px 60px rgba(30, 28, 26, 0.08)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.74)",
  padding: "12px 14px",
  font: "inherit",
  color: "var(--ink)",
};

const buttonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--line)",
  padding: "12px 18px",
  font: "600 0.95rem var(--font-sans)",
  background: "var(--ink)",
  color: "#fff",
  cursor: "pointer",
};

export function PlaygroundClient() {
  const user = useUserStore((state) => state.user);
  const [tableName, setTableName] = useState("customers");
  const [idColumn, setIdColumn] = useState("resource_id");
  const [refreshKey, setRefreshKey] = useState("");
  const [refreshBucket, setRefreshBucket] = useState("suitsconnect");
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [refreshMessage, setRefreshMessage] = useState<string>("");
  const [sampleName, setSampleName] = useState("Playground Resource");

  const { data, isLoading, isError, error, insert, update, remove, mutate } =
    useApiClient<PlaygroundRow>({
      table: tableName,
      single: false,
      limit: 10,
    });

  const rows = useMemo(
    () => (Array.isArray(data) ? data : data ? [data] : []),
    [data],
  );

  async function handleInsert() {
    const result = await insert({
      name: sampleName,
      organization_id: user.organization_id,
    } as Partial<PlaygroundRow>).catch((insertError: unknown) => {
      setUploadMessage(
        insertError instanceof Error ? insertError.message : String(insertError),
      );
      return null;
    });

    if (result) {
      setUploadMessage(`Inserted into ${tableName}`);
    }
  }

  async function handleUpdateFirst() {
    const first = rows[0];
    const idValue = first?.[idColumn];
    if (!idValue) {
      setUploadMessage(`No row with ${idColumn} available in current result set`);
      return;
    }

    await update(idColumn, String(idValue), {
      updated_at: new Date().toISOString(),
    }).then(() => {
      setUploadMessage(`Updated ${String(idValue)}`);
    }).catch((updateError: unknown) => {
      setUploadMessage(
        updateError instanceof Error ? updateError.message : String(updateError),
      );
    });
  }

  async function handleDeleteFirst() {
    const first = rows[0];
    const idValue = first?.[idColumn];
    if (!idValue) {
      setUploadMessage(`No row with ${idColumn} available in current result set`);
      return;
    }

    await remove(idColumn, String(idValue)).then(() => {
      setUploadMessage(`Deleted ${String(idValue)}`);
    }).catch((removeError: unknown) => {
      setUploadMessage(
        removeError instanceof Error ? removeError.message : String(removeError),
      );
    });
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", "playground");
    formData.append("resolvedOrganizationId", user.organization_id);
    formData.append(
      "objectPath",
      `rsf/${user.organization_id}/${tableName}/playground`,
    );

    try {
      const result = await uploadFileViaAthena(formData);
      setUploadMessage(
        `Uploaded ${file.name} -> ${result.storage_key ?? result.url ?? "ok"}`,
      );
      if (result.storage_key) {
        setRefreshKey(result.storage_key);
      }
    } catch (uploadError) {
      setUploadMessage(
        uploadError instanceof Error ? uploadError.message : String(uploadError),
      );
    } finally {
      event.target.value = "";
    }
  }

  async function handleRefreshUrl() {
    try {
      const result = await refreshFileUrlViaAthena({
        fileKey: refreshKey,
        bucket: refreshBucket,
      });
      setRefreshMessage(result.url ?? "No URL returned");
    } catch (refreshError) {
      setRefreshMessage(
        refreshError instanceof Error ? refreshError.message : String(refreshError),
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px 80px",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <section style={{ ...sectionStyle, padding: 32 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <span
              style={{
                font: "600 0.75rem var(--font-mono)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              Next.js Playground
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2.4rem, 5vw, 4.4rem)",
                lineHeight: 0.96,
              }}
            >
              Athena adapter smoke bench
            </h1>
            <p style={{ margin: 0, maxWidth: 760, color: "var(--muted)", lineHeight: 1.6 }}>
              This app is intentionally small: it exercises the Athena-backed CRUD helpers,
              `useApiClient`, file upload, and signed URL refresh with just the host config
              and user store the framework requires.
            </p>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Dataset</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>Table</div>
                <input
                  style={inputStyle}
                  value={tableName}
                  onChange={(event) => setTableName(event.target.value)}
                />
              </label>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>ID column</div>
                <input
                  style={inputStyle}
                  value={idColumn}
                  onChange={(event) => setIdColumn(event.target.value)}
                />
              </label>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>Sample name</div>
                <input
                  style={inputStyle}
                  value={sampleName}
                  onChange={(event) => setSampleName(event.target.value)}
                />
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button style={buttonStyle} onClick={handleInsert}>Insert sample</button>
                <button style={buttonStyle} onClick={handleUpdateFirst}>Update first</button>
                <button style={buttonStyle} onClick={handleDeleteFirst}>Delete first</button>
                <button style={buttonStyle} onClick={() => void mutate()}>Refetch</button>
              </div>
              <div style={{ color: isError ? "var(--warning)" : "var(--muted)" }}>
                {isLoading ? "Loading..." : (error ?? (uploadMessage || "Ready"))}
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Files</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>Upload test file</div>
                <input
                  style={inputStyle}
                  type="file"
                  onChange={handleFileUpload}
                />
              </label>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>File key</div>
                <input
                  style={inputStyle}
                  value={refreshKey}
                  onChange={(event) => setRefreshKey(event.target.value)}
                />
              </label>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>Bucket</div>
                <input
                  style={inputStyle}
                  value={refreshBucket}
                  onChange={(event) => setRefreshBucket(event.target.value)}
                />
              </label>
              <button style={buttonStyle} onClick={handleRefreshUrl}>
                Refresh signed URL
              </button>
              <div
                style={{
                  font: "0.82rem var(--font-mono)",
                  color: refreshMessage ? "var(--ink)" : "var(--muted)",
                  overflowWrap: "anywhere",
                }}
              >
                {refreshMessage || "No refresh result yet"}
              </div>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0 }}>Rows</h2>
            <span style={{ color: "var(--muted)", font: "0.84rem var(--font-mono)" }}>
              user={user.user_id} org={user.organization_id}
            </span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: 18,
              borderRadius: 18,
              background: "rgba(30, 28, 26, 0.92)",
              color: "#f8f4ea",
              overflowX: "auto",
              font: "0.85rem/1.55 var(--font-mono)",
            }}
          >
            {JSON.stringify(rows, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
