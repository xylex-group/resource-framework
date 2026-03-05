import type {
  ResourceFormSubmissionConfig,
  ResourceFormSubmissionDestination,
  ResourceFormSubmissionTableDestination,
  ResourceFormSubmissionWebhookDestination,
} from "../types/resource-forms";

type SubmissionRecord = Record<string, unknown>;

export type ResourceFormSubmissionEnvelope = {
  submission_id: string;
  resource_form_id: string;
  slug: string;
  entity: string;
  migration_key: string;
  from_version: number;
  to_version: number;
  destination_type: ResourceFormSubmissionDestination["type"];
  destination_target?: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  raw_payload: SubmissionRecord;
  migrated_payload: SubmissionRecord;
  metadata: SubmissionRecord;
  error_message?: string | null;
  created_at: string;
};

export type ResourceFormSubmissionWriteResult = {
  ok: boolean;
  error?: string;
  data?: unknown;
};

export type ResourceFormSubmissionHandlers = {
  insertRow: (params: {
    table: string;
    schema?: string;
    row: SubmissionRecord;
  }) => Promise<ResourceFormSubmissionWriteResult>;
  postWebhook?: (params: {
    url: string;
    method: "POST" | "PUT";
    headers?: Record<string, string>;
    body: SubmissionRecord;
  }) => Promise<ResourceFormSubmissionWriteResult>;
};

export type ResourceFormSubmissionDispatchResult = {
  ok: boolean;
  status: ResourceFormSubmissionEnvelope["status"];
  destination: ResourceFormSubmissionDestination["type"];
  envelope: ResourceFormSubmissionEnvelope;
  error?: string;
};

const DEFAULT_SUBMISSION_CONFIG: Required<
  Pick<ResourceFormSubmissionConfig, "enabled" | "storeEnvelopeTable" | "storeEnvelopeSchema">
> = {
  enabled: true,
  storeEnvelopeTable: "resource_form_submissions",
  storeEnvelopeSchema: "public",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asPositiveInt = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return fallback;
};

const normalizeDestination = (
  input: unknown,
): ResourceFormSubmissionDestination => {
  if (!isRecord(input) || typeof input.type !== "string") {
    return { type: "none" };
  }

  if (input.type === "table") {
    const table = typeof input.table === "string" ? input.table.trim() : "";
    if (!table) return { type: "none" };
    const destination: ResourceFormSubmissionTableDestination = {
      type: "table",
      table,
      schema: typeof input.schema === "string" ? input.schema : undefined,
      payloadColumn: typeof input.payloadColumn === "string"
        ? input.payloadColumn
        : undefined,
      metadataColumn: typeof input.metadataColumn === "string"
        ? input.metadataColumn
        : undefined,
    };
    return destination;
  }

  if (input.type === "webhook") {
    const url = typeof input.url === "string" ? input.url.trim() : "";
    if (!url) return { type: "none" };
    const destination: ResourceFormSubmissionWebhookDestination = {
      type: "webhook",
      url,
      method: input.method === "PUT" ? "PUT" : "POST",
      headers: isRecord(input.headers)
        ? Object.fromEntries(
            Object.entries(input.headers)
              .filter(([, value]) => typeof value === "string")
              .map(([key, value]) => [key, String(value)]),
          )
        : undefined,
      includeRawPayload: input.includeRawPayload !== false,
      includeMigratedPayload: input.includeMigratedPayload !== false,
    };
    return destination;
  }

  return { type: "none" };
};

export function normalizeResourceFormSubmissionConfig(
  value: unknown,
): Required<
  Pick<ResourceFormSubmissionConfig, "enabled" | "storeEnvelopeTable" | "storeEnvelopeSchema">
> & {
  destination: ResourceFormSubmissionDestination;
} {
  if (!isRecord(value)) {
    return {
      ...DEFAULT_SUBMISSION_CONFIG,
      destination: { type: "none" },
    };
  }

  return {
    enabled: value.enabled !== false,
    storeEnvelopeTable:
      typeof value.storeEnvelopeTable === "string" && value.storeEnvelopeTable.trim().length > 0
        ? value.storeEnvelopeTable
        : DEFAULT_SUBMISSION_CONFIG.storeEnvelopeTable,
    storeEnvelopeSchema:
      typeof value.storeEnvelopeSchema === "string" && value.storeEnvelopeSchema.trim().length > 0
        ? value.storeEnvelopeSchema
        : DEFAULT_SUBMISSION_CONFIG.storeEnvelopeSchema,
    destination: normalizeDestination(value.destination),
  };
}

function makeSubmissionId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}

export function createResourceFormSubmissionEnvelope(params: {
  resourceFormId: string;
  slug: string;
  entity: string;
  migrationKey: string;
  fromVersion: number;
  toVersion: number;
  rawPayload: SubmissionRecord;
  migratedPayload: SubmissionRecord;
  destination: ResourceFormSubmissionDestination;
  metadata?: SubmissionRecord;
}): ResourceFormSubmissionEnvelope {
  const destinationTarget =
    params.destination.type === "table"
      ? params.destination.table
      : params.destination.type === "webhook"
        ? params.destination.url
        : null;

  return {
    submission_id: makeSubmissionId(params.slug || "resource-form"),
    resource_form_id: params.resourceFormId,
    slug: params.slug,
    entity: params.entity,
    migration_key: params.migrationKey,
    from_version: asPositiveInt(params.fromVersion, 1),
    to_version: asPositiveInt(params.toVersion, asPositiveInt(params.fromVersion, 1)),
    destination_type: params.destination.type,
    destination_target: destinationTarget,
    status: params.destination.type === "none" ? "skipped" : "pending",
    raw_payload: { ...params.rawPayload },
    migrated_payload: { ...params.migratedPayload },
    metadata: { ...(params.metadata ?? {}) },
    error_message: null,
    created_at: new Date().toISOString(),
  };
}

async function dispatchToDestination(params: {
  destination: ResourceFormSubmissionDestination;
  envelope: ResourceFormSubmissionEnvelope;
  handlers: ResourceFormSubmissionHandlers;
}): Promise<ResourceFormSubmissionWriteResult> {
  const { destination, envelope, handlers } = params;

  if (destination.type === "none") {
    return { ok: true };
  }

  if (destination.type === "table") {
    const payloadColumn = destination.payloadColumn ?? "payload";
    const metadataColumn = destination.metadataColumn ?? "metadata";
    const row: SubmissionRecord = {
      ...envelope,
      [payloadColumn]: envelope.migrated_payload,
      [metadataColumn]: envelope.metadata,
    };
    return handlers.insertRow({
      table: destination.table,
      schema: destination.schema ?? "public",
      row,
    });
  }

  if (!handlers.postWebhook) {
    return {
      ok: false,
      error: "No webhook dispatcher provided for webhook destination.",
    };
  }

  const body: SubmissionRecord = {
    submission_id: envelope.submission_id,
    resource_form_id: envelope.resource_form_id,
    slug: envelope.slug,
    entity: envelope.entity,
    migration_key: envelope.migration_key,
    from_version: envelope.from_version,
    to_version: envelope.to_version,
    metadata: envelope.metadata,
  };

  if (destination.includeRawPayload !== false) {
    body.raw_payload = envelope.raw_payload;
  }
  if (destination.includeMigratedPayload !== false) {
    body.migrated_payload = envelope.migrated_payload;
  }

  return handlers.postWebhook({
    url: destination.url,
    method: destination.method ?? "POST",
    headers: destination.headers,
    body,
  });
}

export async function submitResourceForm(params: {
  config: unknown;
  rawPayload: SubmissionRecord;
  migratedPayload: SubmissionRecord;
  resourceFormId: string;
  slug: string;
  entity: string;
  migrationKey: string;
  fromVersion: number;
  toVersion: number;
  metadata?: SubmissionRecord;
  handlers: ResourceFormSubmissionHandlers;
}): Promise<ResourceFormSubmissionDispatchResult> {
  const normalized = normalizeResourceFormSubmissionConfig(params.config);
  const envelope = createResourceFormSubmissionEnvelope({
    resourceFormId: params.resourceFormId,
    slug: params.slug,
    entity: params.entity,
    migrationKey: params.migrationKey,
    fromVersion: params.fromVersion,
    toVersion: params.toVersion,
    rawPayload: params.rawPayload,
    migratedPayload: params.migratedPayload,
    destination: normalized.destination,
    metadata: params.metadata,
  });

  if (!normalized.enabled) {
    const skippedEnvelope = { ...envelope, status: "skipped" as const };
    await params.handlers.insertRow({
      table: normalized.storeEnvelopeTable,
      schema: normalized.storeEnvelopeSchema,
      row: skippedEnvelope,
    });
    return {
      ok: true,
      status: "skipped",
      destination: normalized.destination.type,
      envelope: skippedEnvelope,
    };
  }

  const dispatchResult = await dispatchToDestination({
    destination: normalized.destination,
    envelope,
    handlers: params.handlers,
  });

  const finalEnvelope: ResourceFormSubmissionEnvelope = {
    ...envelope,
    status: dispatchResult.ok ? "sent" : "failed",
    error_message: dispatchResult.ok
      ? null
      : (dispatchResult.error ?? "Failed to dispatch submission destination."),
  };

  await params.handlers.insertRow({
    table: normalized.storeEnvelopeTable,
    schema: normalized.storeEnvelopeSchema,
    row: finalEnvelope,
  });

  return {
    ok: dispatchResult.ok,
    status: finalEnvelope.status,
    destination: normalized.destination.type,
    envelope: finalEnvelope,
    error: finalEnvelope.error_message ?? undefined,
  };
}
