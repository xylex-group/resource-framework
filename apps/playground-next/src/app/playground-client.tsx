"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  refreshFileUrlViaAthena,
  uploadFileViaAthena,
  useApiClient,
} from "@xylex-group/resource-framework";
import { useUserStore } from "../lib/stores";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

type PlaygroundRow = Record<string, unknown>;

export function PlaygroundClient() {
  const user = useUserStore((state) => state.user);
  const storageS3Id = process.env.NEXT_PUBLIC_ATHENA_STORAGE_S3_ID ?? "";
  const [tableName, setTableName] = useState("customers");
  const [idColumn, setIdColumn] = useState("resource_id");
  const [refreshFileId, setRefreshFileId] = useState("");
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

    try {
      if (!storageS3Id) {
        throw new Error("NEXT_PUBLIC_ATHENA_STORAGE_S3_ID is not configured.");
      }
      const result = await uploadFileViaAthena({
        s3_id: storageS3Id,
        files: file,
        fileName: file.name,
        organizationId: user.organization_id,
        prefixPath: `rsf/${user.organization_id}/${tableName}/playground`,
      });
      const uploaded = result.files[0];
      if (!uploaded) {
        throw new Error("Athena storage returned no uploaded file.");
      }
      setUploadMessage(
        `Uploaded ${file.name} -> ${uploaded.storage_key}`,
      );
      setRefreshFileId(uploaded.file.id);
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
        fileId: refreshFileId,
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
        <Card style={{ padding: 32 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <span
              style={{
                font: "600 0.75rem var(--font-mono)",
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
        </Card>

        <section
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <Card style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Dataset</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>Table</div>
                <Input
                  value={tableName}
                  onChange={(event) => setTableName(event.target.value)}
                />
              </label>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>ID column</div>
                <Input
                  value={idColumn}
                  onChange={(event) => setIdColumn(event.target.value)}
                />
              </label>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>Sample name</div>
                <Input
                  value={sampleName}
                  onChange={(event) => setSampleName(event.target.value)}
                />
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Button onPress={handleInsert}>Insert sample</Button>
                <Button onPress={handleUpdateFirst}>Update first</Button>
                <Button variant="destructive" onPress={handleDeleteFirst}>Delete first</Button>
                <Button variant="outline" onPress={() => void mutate()}>Refetch</Button>
              </div>
              <div style={{ color: isError ? "var(--warning)" : "var(--muted)" }}>
                {isLoading ? "Loading..." : (error ?? (uploadMessage || "Ready"))}
              </div>
            </div>
          </Card>

          <Card style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Files</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>Upload test file</div>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                />
              </label>
              <label>
                <div style={{ marginBottom: 6, color: "var(--muted)" }}>Athena file ID</div>
                <Input
                  value={refreshFileId}
                  onChange={(event) => setRefreshFileId(event.target.value)}
                />
              </label>
              <Button
                onPress={handleRefreshUrl}
                disabled={!refreshFileId}
              >
                Refresh signed URL
              </Button>
              <div
                style={{
                  font: "0.82rem var(--font-mono)",
                  color: refreshMessage ? "var(--foreground)" : "var(--muted)",
                  overflowWrap: "anywhere",
                }}
              >
                {refreshMessage || "No refresh result yet"}
              </div>
            </div>
          </Card>
        </section>

        <Card style={{ padding: 24 }}>
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
              background: "var(--foreground)",
              color: "var(--background)",
              overflowX: "auto",
              font: "0.85rem/1.55 var(--font-mono)",
            }}
          >
            {JSON.stringify(rows, null, 2)}
          </pre>
        </Card>
      </div>
    </main>
  );
}
