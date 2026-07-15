"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DrilldownFileExplorer,
  type FileItem as DrilldownFileItem,
} from "../../drilldown/drilldown-file-explorer";
import {
  useApiClient,
  UseApiClientMultiReturn,
  UseApiClientSingleReturn,
} from "../../../hooks/use-api-client";
import {
  resolveTemplate,
  resolveTemplateValue as resolveTemplateValueNew,
} from "../../../templating";
import type { TemplateContext } from "../../../templating/types";
import {
  registerSectionWidget,
  type SectionWidgetRendererProps,
} from "./registry";
import type {
  FileExplorerWidgetSpec,
  TableWidgetCondition,
} from "../../../resource-types";
import { Container } from "@/components/ui/container";
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/lib/stores";
import {
  refreshFileUrlViaAthena,
  uploadFileViaAthena,
} from "../../../adapters/athena-files";
import { useFileUploadStatus } from "../../../notifications";

type FileRow = Record<string, unknown> & {
  file_id?: string;
  id?: string;
  filename?: string;
  name?: string;
  url?: string;
  file_url?: string;
  s3_bucket?: string;
  size?: number | string;
  mime_type?: string;
  mimeType?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

const DEFAULT_TABLE = "files";
const DEFAULT_COLUMNS = [
  "file_id",
  "filename",
  "name",
  "s3_bucket",
  "url",
  "size",
  "mime_type",
  "created_at",
  "updated_at",
];
const DEFAULT_FILE_ID_COLUMN = "file_id";
const DEFAULT_RESOURCE_COLUMN = "resource_id";
const DEFAULT_ORGANIZATION_COLUMN = "organization_id";

/**
 * Build template context from entity and user data.
 */
const buildTemplateContext = (
  entity: Record<string, unknown>,
  user: Record<string, unknown> | undefined,
  columns?: string[],
  idColumn?: string,
): TemplateContext => {
  return {
    entity,
    user: user || {},
    columns,
    idColumn,
  };
};

const buildConditions = (
  conditions: TableWidgetCondition[] | undefined,
  context: TemplateContext,
): TableWidgetCondition[] => {
  if (!conditions || conditions.length === 0) {
    return [];
  }
  const built = conditions.map((condition) => {
    const resolved = {
      eq_column: condition.eq_column,
      eq_value: resolveTemplateValueNew(condition.eq_value, context) ?? null,
    };

    return resolved;
  });
  return built;
};

const mapFileRows = (
  rows: FileRow[],
  fileIdColumn: string,
): DrilldownFileItem[] => {
  return rows.map((row, index) => {
    const rawId = row[fileIdColumn] ??
      row.id ??
      row.filename ??
      row.name ??
      row.url ??
      `file-${index}`;
    const id = rawId ? String(rawId) : `file-${index}`;
    const name = String(row.filename ?? row.name ?? `File ${index + 1}`);
    const url = String(row.url ?? row.file_url ?? "");
    const size = typeof row.size === "number"
      ? row.size
      : typeof row.size === "string"
      ? Number(row.size)
      : undefined;
    const type = String(row.mime_type ?? row.mimeType ?? "");
    const createdAt = String(row.created_at ?? row.createdAt ?? "");
    const updatedAt = String(row.updated_at ?? row.updatedAt ?? "");
    const mapped = {
      id,
      name: name,
      file_name: name,
      url,
      size: Number.isNaN(size ?? 0) ? undefined : size,
      type: type || undefined,
      created_at: createdAt || undefined,
      updated_at: updatedAt || undefined,
    };

    return mapped;
  });
};

function resolveEntityValue(
  entity: Record<string, unknown>,
  column?: string,
): unknown {
  if (!column) {
    return undefined;
  }
  const fallback = entity[column as keyof typeof entity];

  return fallback;
}

function evaluateStringTemplate(
  value: string | undefined,
  context: TemplateContext,
): string | undefined {
  if (!value) {
    return undefined;
  }
  const resolved = resolveTemplate(value, context);
  const result = typeof resolved === "string" ? resolved : undefined;
  return result;
}

function getColumnValue(
  entity: Record<string, unknown>,
  column?: string,
  fallback?: string,
): string | undefined {
  if (!column && !fallback) {
    return undefined;
  }
  const key = column || fallback;
  const resolved = resolveEntityValue(entity, key);
  if (resolved === undefined || resolved === null) {
    return undefined;
  }
  const result = String(resolved);
  return result;
}

function sanitizePathSegment(value?: string | null): string {
  if (!value) {
    return "";
  }
  const sanitized = value.trim().replace(/^\/+|\/+$/g, "");
  return sanitized;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function FileExplorerWidget({ spec, entity }: SectionWidgetRendererProps) {
  type ApiClientResult =
    | UseApiClientSingleReturn<FileRow>
    | UseApiClientMultiReturn<FileRow>;
  type MultiTableClient = UseApiClientMultiReturn<FileRow>;

  const { toast } = useToast();
  const { startUpload, finishUpload } = useFileUploadStatus();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isTarget = spec.type === "file_explorer";

  const props: FileExplorerWidgetSpec["props"] = spec.props ?? {};

  const tableName = props.table || DEFAULT_TABLE;
  const columns = props.columns ?? DEFAULT_COLUMNS;
  const fileIdColumn = props.fileIdColumn || DEFAULT_FILE_ID_COLUMN;
  const organizationColumn = props.organizationIdColumn ||
    DEFAULT_ORGANIZATION_COLUMN;
  const resourceColumn = props.resourceIdColumn || DEFAULT_RESOURCE_COLUMN;
  const storageBucket = props.bucket ?? "suitsconnect";
  const { user } = useUserStore();
  const organizationId = getColumnValue(entity, organizationColumn);

  // This should actually not come
  const resourceId = getColumnValue(entity, resourceColumn);

  const resolvedOrganizationId = organizationId ?? user?.organization_id;

  // Build template context with new templating system
  const templateContext = useMemo(
    () =>
      buildTemplateContext(
        entity,
        user as Record<string, unknown> | undefined,
        columns,
        resourceColumn,
      ),
    [entity, user, columns, resourceColumn],
  );

  const uploadDir = evaluateStringTemplate(props.uploadDir, templateContext);
  const objectPath = evaluateStringTemplate(props.objectPath, templateContext);

  const resourceNameFromTemplate = evaluateStringTemplate(
    props.resourceName,
    templateContext,
  );
  const resolvedResourceName = String(
    resourceNameFromTemplate ?? props.resourceName ?? tableName,
  ).trim() || tableName;

  const hasResourceId = Boolean(resourceId);
  const defaultObjectPathSegments = hasResourceId
    ? [
      "rsf",
      sanitizePathSegment(resolvedOrganizationId),
      sanitizePathSegment(resolvedResourceName),
      sanitizePathSegment(resourceId),
    ].filter(Boolean)
    : [];
  const defaultObjectPath = hasResourceId
    ? defaultObjectPathSegments.join("/")
    : undefined;
  const evaluatedObjectPath = objectPath;
  const resolvedObjectPath = evaluatedObjectPath ?? defaultObjectPath;

  const resolvedConditions = useMemo(
    () => {
      const conditions = buildConditions(props.conditions, templateContext);

      return conditions;
    },
    [props.conditions, templateContext],
  );

  const apiClient = useApiClient<FileRow>({
    table: tableName,
    conditions: resolvedConditions,
    columns: columns,
    limit: props.limit,
    forceExternalApi: true,
  }) as unknown as ApiClientResult;

  const isMultiTableClient = (
    value: ApiClientResult,
  ): value is MultiTableClient => "clients" in value;

  const isMulti = isMultiTableClient(apiClient);

  const singleClient = isMulti
    ? null
    : (apiClient as Exclude<ApiClientResult, MultiTableClient>);

  const data = singleClient?.data ?? [];
  const isLoading = singleClient?.isLoading ?? false;
  const insert = singleClient?.insert ?? (async () => Promise.reject());
  const remove = singleClient?.remove ?? (async () => Promise.reject());

  const files = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }
    const mapped = mapFileRows(data, fileIdColumn);

    return mapped;
  }, [data, fileIdColumn]);

  const handleUpload = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) {
        return;
      }

      if (!props.s3Id) {
        throw new Error("File uploads require an Athena managed-storage s3Id.");
      }

      setIsUploading(true);
      
      // Start upload status tracking
      const uploadId = startUpload(selectedFiles.length);

      let successCount = 0;
      let failCount = 0;

      try {
        for (const file of selectedFiles) {
          try {
            const uploadResult = await uploadFileViaAthena({
              s3_id: props.s3Id,
              bucket: storageBucket,
              files: file,
              fileName: file.name,
              prefixPath: resolvedObjectPath ?? uploadDir,
              organizationId: resolvedOrganizationId,
              resourceId,
              userId: user?.user_id,
              maxFileSizeMb: props.maxFileSizeMB ?? 20,
            });
            const uploadedFile = uploadResult.files[0];
            if (!uploadedFile) {
              throw new Error("Athena storage returned no uploaded file.");
            }
            const refreshed = await refreshFileUrlViaAthena({
              fileId: uploadedFile.file.id,
              purpose: "stream",
            });
            const storageKey = uploadedFile.storage_key;
            const currentTime = Math.floor(
              new Date(uploadedFile.file.created_at).getTime() / 1000,
            );
            const insertBody: Record<string, unknown> = {
              file_name: file.name,
              name: file.name,
              url: refreshed.url,
              file_url: refreshed.url,
              mime_type: file.type,
              file_size: file.size,
              s3_bucket: uploadedFile.file.bucket,
              time: currentTime,
              uploaded_by: user?.user_id,
              storage_key: storageKey,
              prefix_path: uploadedFile.file.prefix_path,
            };

            if (resourceId) {
              insertBody[resourceColumn] = resourceId;
              insertBody.resource_id = resourceId;
            }
            if (resolvedOrganizationId) {
              insertBody[organizationColumn] = resolvedOrganizationId;
            }
            const prefixPath = uploadedFile.file.prefix_path ?? resolvedObjectPath;
            if (prefixPath) {
              insertBody.prefix_path = prefixPath;
            }

            await insert(insertBody);
            successCount++;
          } catch (error) {
            failCount++;
            toast({
              title: "Upload failed",
              description: `Failed to upload ${file.name}: ${getErrorMessage(error)}`,
              variant: "destructive",
            });
          }
        }

        if (successCount > 0 && failCount === 0) {
          toast({
            title: "Upload successful",
            description: `Successfully uploaded ${successCount} file${
              successCount > 1 ? "s" : ""
            }`,
          });
        } else if (successCount > 0 && failCount > 0) {
          toast({
            title: "Upload completed with errors",
            description: `${successCount} file${
              successCount > 1 ? "s" : ""
            } uploaded successfully, but ${failCount} file${
              failCount > 1 ? "s" : ""
            } failed.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Upload error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        // Finish upload status tracking
        finishUpload(uploadId);
        setIsUploading(false);
      }
    },
    [
      resolvedOrganizationId,
      uploadDir,
      resolvedObjectPath,
      storageBucket,
      insert,
      organizationColumn,
      resourceColumn,
      resourceId,
      toast,
      user?.user_id,
      startUpload,
      finishUpload,
      props.maxFileSizeMB,
      props.s3Id,
    ],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setIsDeleting(true);

      try {
        await remove(fileIdColumn, id);

        toast({
          title: "File deleted",
          description: "The file has been successfully deleted.",
        });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: getErrorMessage(error),
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [remove, fileIdColumn, toast],
  );

  if (!isTarget || isMulti) {
    return null;
  }

  return (
    <Container>
      {(props.allowUpload ?? true) && !props.s3Id && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          Uploads are unavailable until this widget is configured with an Athena storage catalog ID.
        </div>
      )}
      <DrilldownFileExplorer
        title={props.title}
        files={files}
        isLoading={isLoading || isUploading || isDeleting}
        uploadDir={uploadDir}
        resourceId={resourceId}
        organizationId={String(resolvedOrganizationId)}
        maxFileSize={props.maxFileSizeMB ?? 20}
        acceptedTypes={props.acceptedTypes}
        allowUpload={(props.allowUpload ?? true) && Boolean(props.s3Id)}
        allowDelete={props.allowDelete ?? true}
        onUpload={
          props.allowUpload === false || !props.s3Id ? undefined : handleUpload
        }
        onDelete={props.allowDelete === false ? undefined : handleDelete}
        disableSectionWrapper
      />
    </Container>
  );
}

registerSectionWidget("file_explorer", FileExplorerWidget);
