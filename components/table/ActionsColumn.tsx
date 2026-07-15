import { Button, Dropdown } from "@heroui/react";
import { Ellipsis } from "lucide-react";
import type { ResourceRoute, TableRowData } from "../../resource-types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { getValueByKeyCase, getValueByPathCase } from "../../utils/key-case";

type RowActionItem = {
  type?: "separator";
  label?: string;
  onClick?: (row: TableRowData) => void;
  destructive?: boolean;
  disabled?: boolean | ((row: TableRowData) => boolean);
};

type MenuAction = {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

/**
 * Creates an actions column for the resource table with dropdown menu
 * @param resource - Resource route configuration
 * @param resourceName - Name of the resource
 * @returns Column definition for actions
 */
export const createActionsColumn = (
  resource: ResourceRoute | null,
  resourceName: string | undefined,
): ColumnDef<TableRowData> => {
  return {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }: { row: Row<TableRowData> }) => {
      const rowData = row.original;
      const idColumn = resource?.idColumn || "id";
      const rawId = getValueByKeyCase(rowData, String(idColumn));
      const id = rawId != null ? String(rawId).trim() : "";
      const hasValidId = Boolean(id) && id !== "undefined" && id !== "null" &&
        id !== "new";

      const buildHref = (): string | undefined => {
        try {
          const custom = resource?.drilldownHref;
          if (typeof custom === "function") {
            const href = custom(rowData);
            if (href && typeof href === "string" && href.trim() !== "") {
              return href;
            }
            return undefined;
          }
          if (typeof custom === "string" && custom.trim() !== "") {
            const href = custom.replace(
              /\{\{(.*?)\}\}/g,
              (_match: string, key: string) => {
                const k = String(key || "").trim();
                const v = k.includes(".")
                  ? getValueByPathCase(rowData, k)
                  : getValueByKeyCase(rowData, k);
                return String(v ?? "");
              },
            );
            return href.trim() !== "" ? href : undefined;
          }
          if (!hasValidId) return undefined;
          return `/v2/${resourceName}/${id}`;
        } catch {
          return undefined;
        }
      };

      const href = buildHref();
      const canOpen = Boolean(href) && !href?.includes("undefined");

      const actions: MenuAction[] = [
        {
          label: "Open",
          onClick: () => {
            if (!canOpen) return;
            window.location.href = href as string;
          },
          disabled: !canOpen,
        },
        ...(Array.isArray(resource?.rowActions)
          ? (resource.rowActions as RowActionItem[])
            .filter((action) => action?.type !== "separator" && action.label)
            .map((action: RowActionItem) => ({
              label: action.label ?? "Action",
              onClick: () => action.onClick?.(rowData),
              destructive: Boolean(action.destructive),
              disabled: typeof action.disabled === "function"
                ? Boolean(action.disabled(rowData))
                : Boolean(action.disabled),
            }))
          : []),
      ];
      return (
        <div
          id="actions-column-root"
          onClick={(e) => e.stopPropagation()}
          className="flex justify-end"
        >
          <Dropdown>
            <Button
              aria-label="Row actions"
              isIconOnly
              size="sm"
              variant="ghost"
            >
              <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Dropdown.Popover className="min-w-36">
              <Dropdown.Menu>
                {actions.map((action, index) => (
                  <Dropdown.Item
                    isDisabled={action.disabled}
                    key={`${action.label}-${index}`}
                    onAction={action.onClick}
                    textValue={action.label ?? "Action"}
                    variant={action.destructive ? "danger" : undefined}
                  >
                    {action.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      );
    },
    size: 60,
    enableHiding: false,
    meta: {
      className: "sticky right-0",
      filterable: false,
    },
  };
};
