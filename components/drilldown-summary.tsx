import React from "react";
import {
	buildColumnsFromRegistry,
} from "../constructors/column-registry";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateData } from "../hooks/use-update-data";
import { cn } from "@/lib/utils";
import { useNotification } from "@/hooks/use-notifications";
import type { DrilldownSummaryItemProps, LeanColumnSpec } from "../resource-types";

interface DrilldownSummaryProps {
	children: React.ReactNode;
	columns?: 1 | 2 | 3 | 4;
	className?: string;
}

/**
 * Renders a value with null handling and JSON stringification
 * @param value - The value to render
 * @returns Rendered value or null
 */
function renderValue(value: React.ReactNode) {
	if (
		value === null ||
		value === undefined ||
		value === "" ||
		(typeof value === "number" && isNaN(value))
	) {
		return null;
	}

	if (
		typeof value === "object" &&
		!Array.isArray(value) &&
		React.isValidElement(value) === false
	) {
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}
	return value;
}

/**
 * Displays a single item in a drilldown summary with optional editing
 * @param props - Component props including label, value, and editable configuration
 * @returns React component
 */
export function DrilldownSummaryItem(props: DrilldownSummaryItemProps) {
	const {
		label,
		value,
		className,
		entity,
		keyName,
		use,
		header,
		formatter,
		isEditing,
		editable,
		entityId,
		tableName,
		idColumn,
	} = props;

	const { notification } = useNotification();

	const updateTable = editable?.update_table || tableName;
	const updateIdColumn = editable?.update_id_column || idColumn;
	const updateColumn = editable?.update_column || keyName;

	const { update, isLoading } = useUpdateData({
		table: updateTable || "",
		column: updateIdColumn || "",
		id: entityId || "",
		updateBody: {},
		config: {
			onSuccess: () =>
				notification({
					message: "Updated successfully",
					success: true,
				}),
			onError: () =>
				notification({ message: "Update failed", success: false }),
		},
	});

	let mainValue: React.ReactNode = value;
	let computedLabel: string | undefined = label;

	if (entity && keyName) {
		const specs: Array<LeanColumnSpec<Record<string, unknown>>> = [
			{
				key: keyName as keyof Record<string, unknown>,
				header: header || label || keyName.replace(/_/g, " "),
				use,
				formatter,
			},
		];
		const cols = buildColumnsFromRegistry<Record<string, unknown>>(specs);
		const col = cols?.[0];
		computedLabel = typeof col?.header === "string"
			? (col.header as string)
			: header || label || keyName.replace(/_/g, " ");
		try {
			if (col && typeof col.cell === "function") {
				mainValue = (col.cell as (
					context: { row: { original: Record<string, unknown> } },
				) => React.ReactNode)({
					row: { original: entity as Record<string, unknown> },
				});
			} else {
				mainValue = (entity as Record<string, unknown>)[
					keyName
				] as React.ReactNode;
			}
		} catch (err) {
			console.error("[DrilldownSummaryItem] Error rendering value:", err);
			mainValue =
				(entity as Record<string, unknown>)[keyName] as React.ReactNode;
		}
	}

	const renderedValue = renderValue(mainValue as React.ReactNode);

	const renderEditableField = () => {
		if (!isEditing || !editable || !entity || !keyName) return null;

		const currentValue = (entity as Record<string, unknown>)[keyName];

		if (editable.type === "select" && Array.isArray(editable.options)) {
			return (
				<Select
					value={String(currentValue ?? "")}
					onValueChange={async (val: string) => {
						await update({ [updateColumn || keyName]: val });
					}}
					disabled={isLoading}
				>
					<SelectTrigger className="h-8 w-full max-w-65">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="rounded-sm">
						{editable.options.map((opt) => (
							<SelectItem
								key={String(opt.value)}
								value={String(opt.value)}
							>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);
		}

		if (editable.type === "boolean") {
			const checked = Boolean(currentValue);
			return (
				<div className="inline-flex items-center gap-2">
					<Switch
						checked={checked}
						disabled={isLoading}
						onCheckedChange={async (val: boolean) => {
							await update({ [updateColumn || keyName]: val });
						}}
					/>
					<span className="text-primary text-sm">
						{checked ? "Yes" : "No"}
					</span>
				</div>
			);
		}

		return (
			<Input
				className="h-8 max-w-65"
				defaultValue={currentValue == null ? "" : String(currentValue)}
				disabled={isLoading}
				onBlur={async (e) => {
					const nextVal = e.currentTarget.value;
					if (nextVal !== String(currentValue ?? "")) {
						await update({ [updateColumn || keyName]: nextVal });
					}
				}}
			/>
		);
	};

	if (!renderedValue && !isEditing) return null;

	const itemId = keyName
		? `drilldown-summary-item-${
			keyName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
		}`
		: "drilldown-summary-item";

	return (
		<div
			id={itemId}
			className={cn("grid grid-cols-12 gap-x-4 px-4 text-sm", className)}
		>
			<span className="col-span-4 text-primary">{computedLabel}</span>
			<span className="col-span-8 wrap-break-word text-primary">
				{isEditing && editable
					? (
						renderEditableField()
					)
					: (
						renderedValue || "-"
					)}
			</span>
		</div>
	);
}

/**
 * Container component for displaying drilldown summary items in a grid layout
 * @param props - Component props including children, columns, and className
 * @returns React component
 */
export function DrilldownSummary({
	children,
	columns = 2,
	className,
}: DrilldownSummaryProps) {
	const gridCols = {
		1: "grid-cols-1",
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
	};

	return (
		<div
			id="drilldown-summary-grid"
			className={cn(
				"grid gap-x-8 gap-y-4 pb-6",
				gridCols[columns],
				className,
			)}
		>
			{children}
		</div>
	);
}
