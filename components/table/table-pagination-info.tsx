import type { Table } from "@tanstack/react-table";
import { ReactElement } from "react";
import { pluralize } from "@/lib/format/string";

export interface TablePaginationInfoProps<TData> {
	table: Table<TData>;
	pagination?: {
		pageIndex: number;
		pageSize: number;
	};
	variant?: "mobile" | "desktop";
}

export function TablePaginationInfo<TData>({
	table,
	pagination,
	variant = "desktop",
}: TablePaginationInfoProps<TData>): ReactElement {
	const totalCount = table.getRowCount();

	if (variant === "mobile" && pagination) {
		const start = pagination.pageIndex * pagination.pageSize + 1;
		const end = Math.min(
			(pagination.pageIndex + 1) * pagination.pageSize,
			totalCount,
		);

		return (
			<div className="flex items-center gap-4">
				<div className="text-sm text-muted-foreground">
					<p aria-live="polite">
						<span className="font-medium text-foreground">
							{start}-{end}
						</span>{" "}
						of{" "}
						<span className="font-medium text-foreground">
							{totalCount.toString()}
						</span>
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-4">
			<div className="-translate-y-2 text-sm text-muted-foreground">
				<p aria-live="polite">
					<span className="select-none text-primary">
						{totalCount.toString()}{" "}
						<span className="select-none text-primary">
							{pluralize("result", "results", totalCount)}
						</span>
					</span>
				</p>
			</div>
		</div>
	);
}
