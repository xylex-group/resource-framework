import type { Table } from "@tanstack/react-table";
import type React from "react";
import { cn } from "@/lib/utils";
import type { DisplayConfigOption } from "@/lib/zustand/useViewStore";
import { DisplaySettings } from "./display-settings";
import { TableSearchInput } from "./table-search-input";
import { TableFullscreenToggle } from "./table-fullscreen-toggle";
import { TableDownloadButton } from "./table-download-button";
import { TableDeleteDialog } from "./table-delete-dialog";
import { handleDownloadCsv } from "../../handlers/handle-csv-export";
import { applyDorkQueryToUrl } from "../../utils/dork-query";
import { Container } from "@/components/ui/container";

export interface TableTopControlsProps<TData = unknown> {
	table: Table<TData>;
	customComponent?: React.ReactNode;
	filterColumn?: string;
	filterColumns?: string[];
	filterPlaceholder?: string;
	searchValue: string;
	onSearchChange: (value: string) => void;
	pathname: string;
	searchParams: URLSearchParams | null;
	onNavigate: (url: string) => void;
	disableFullscreenView?: boolean;
	isExtraPaddingEnabled: boolean;
	onToggleExtraPadding: () => void;
	allowDownloadCsv?: boolean;
	title?: string;
	displayContext?: string;
	csvExcludeColumns?: string[];
	displayConfig?: DisplayConfigOption[];
	onDeleteRows?: () => void;
	selectedRowsCount: number;
	hasExtraSidePadding?: boolean;
}

export function TableTopControls<TData = unknown>({
	table,
	customComponent,
	filterColumn,
	filterColumns,
	filterPlaceholder,
	searchValue,
	onSearchChange,
	pathname,
	searchParams,
	onNavigate,
	disableFullscreenView = true,
	isExtraPaddingEnabled,
	onToggleExtraPadding,
	allowDownloadCsv = false,
	title,
	displayContext,
	csvExcludeColumns = ["actions"],
	displayConfig,
	onDeleteRows,
	selectedRowsCount,
	hasExtraSidePadding: _hasExtraSidePadding,
}: TableTopControlsProps<TData>): React.ReactElement {
	const columnsToFilter =
		Array.isArray(filterColumns) && filterColumns.length > 0
			? filterColumns
			: filterColumn
				? [filterColumn]
				: [];
	const hasSearchInput = columnsToFilter.length > 0;
	const applyFilterValue = (value: string) => {
		const filterValue = value || undefined;
		columnsToFilter.forEach((columnId) => {
			try {
				table.getColumn(columnId)?.setFilterValue(filterValue);
			} catch {}
		});
	};
	return (
		<div className="flex w-full flex-col flex-wrap gap-4 sm:flex-row sm:items-center ">
			<Container>
				<div
					className={cn(
						"flex w-full items-center gap-3 sm:w-full",
					)}
				>
					{customComponent && customComponent}
					{hasSearchInput && (
						<TableSearchInput
							value={searchValue}
							onChange={(v) => {
								onSearchChange(v);
								applyFilterValue(v);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									const applied = applyDorkQueryToUrl({
										input: (e.target as HTMLInputElement)
											.value,
										pathname,
										searchParams,
										onNavigate,
									});
									if (applied) {
										// Query applied successfully
									}
								}
							}}
							placeholder={filterPlaceholder ||
								"Search... (e.g. invoice_id:123 amount>10)"}
						/>
					)}
				</div>
			</Container>

			<Container isExtraPaddingEnabled={isExtraPaddingEnabled}>
				<div
					className={cn(
						"ml-auto flex flex-row justify-end gap-2 sm:items-center  ",
						!customComponent && "w-full",
					)}
				>
					{!disableFullscreenView && (
						<TableFullscreenToggle
							isEnabled={isExtraPaddingEnabled}
							onToggle={onToggleExtraPadding}
						/>
					)}
					{allowDownloadCsv && (
						<TableDownloadButton
							onClick={() =>
								handleDownloadCsv({
									table,
									excludeColumns: csvExcludeColumns,
									title,
									displayContext,
								})}
							disabled={table.getPrePaginationRowModel().rows
								.length === 0}
						/>
					)}
					{displayConfig && displayContext && (
						<DisplaySettings
							context={displayContext}
							config={displayConfig}
							table={table}
						/>
					)}
				</div>
			</Container>

			{onDeleteRows && selectedRowsCount > 0 && (
				<div className="flex items-center gap-3">
					<TableDeleteDialog
						selectedCount={selectedRowsCount}
						onDelete={onDeleteRows}
						className="ml-auto"
					/>
				</div>
			)}
		</div>
	);
}
