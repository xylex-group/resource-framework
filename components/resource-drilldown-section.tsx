"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiClient } from "../hooks/use-api-client";
import { CreateResourceDialog } from "./create-resource-dialog";
import type { ColumnConfig, FieldValue } from "../resource-types";

/**
 * Section component for resource drilldown with create functionality
 * @param props - Component props including resourceName, title, and create configuration
 * @returns React component
 */
export function ResourceDrilldownSection({
	resourceName,
	title,
	cacheEnabled = false,
	onCreatedAction,
	required,
	optional,
	columns,
	table,
	defaultValues,
	children,
}: {
	resourceName: string;
	title?: string;
	cacheEnabled?: boolean;
	onCreatedAction?: (row: Record<string, unknown> | null) => void;
	required?: string[];
	optional?: string[];
	columns?: Array<ColumnConfig>;
	table?: string;
	defaultValues?: Partial<Record<string, FieldValue>>;
	children?: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);

	const routeRowResult = useApiClient<Record<string, unknown>>({
		table: "resource_routes",
		conditions: [{ eq_column: "resource_name", eq_value: resourceName }],
		single: true,
		enabled: Boolean(resourceName),
		noCache: !cacheEnabled,
	});

	const routeRow = "data" in routeRowResult ? routeRowResult.data : null;

	const resolvedTitle = useMemo(
		() => title || ((routeRow as Record<string, unknown>)?.page_label as string) || resourceName,
		[title, routeRow, resourceName],
	);

	const canCreate = Boolean((routeRow as Record<string, unknown>)?.enable_new_resource_creation === true);

	return (
		<div
			id="resource-drilldown-section-root"
			className="space-y-4"
		>
			<div
				id="resource-drilldown-section-header"
				className="flex items-center justify-between"
			>
				<h3 className="text-lg font-semibold">{resolvedTitle}</h3>
				{canCreate && (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setOpen(true)}
						className="ml-2 rounded-sm"
						aria-label="Create"
						title="Create"
					>
						<Plus className="h-5 w-5" />
					</Button>
				)}
			</div>
			<div
				id="resource-drilldown-section-body"
				className="flex-1"
			>
				{children}
			</div>
			<CreateResourceDialog
				open={open}
				onCloseAction={() => setOpen(false)}
				title={`New ${String((routeRow as Record<string, unknown>)?.page_label || resourceName)}`}
				resourceName={resourceName}
				required={required}
				optional={optional}
				columns={columns}
				table={table}
				cacheEnabled={cacheEnabled}
				defaultValues={defaultValues}
				onCreatedAction={(row) => {
					setOpen(false);
					onCreatedAction?.(row);
				}}
			/>
		</div>
	);
}
