import type { Cell } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ReactElement } from "react";
import { TableCellV2 } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableBodyCellProps<TData, TValue> {
	cell: Cell<TData, TValue>;
	href?: string;
	hasActiveSelection?: boolean;
}

export function TableBodyCell<TData, TValue>({
	cell,
	href,
	hasActiveSelection = false,
}: TableBodyCellProps<TData, TValue>): ReactElement {
	const meta = cell.column.columnDef.meta as
		| {
			widthFit?: boolean;
			maxWidth?: number;
			className?: string;
		}
		| undefined;

	const widthFit = meta?.widthFit;
	const maxWidth = meta?.maxWidth;

	const cellStyle = typeof maxWidth === "number"
		? {
			maxWidth: `${maxWidth}px`,
		}
		: undefined;

	const content = flexRender(cell.column.columnDef.cell, cell.getContext());

	return (
		<TableCellV2
			id="table-row-first-cell"
			className={cn(
				"h-9 max-h-9 overflow-hidden align-middle",
				widthFit && "w-fit whitespace-nowrap",
				typeof maxWidth === "number" && "truncate",
				meta?.className,
			)}
			style={cellStyle}
			key={cell.id}
		>
			{href && !hasActiveSelection
				? (
					<a
						href={href}
						className="flex h-9 max-h-9 w-full items-center overflow-hidden whitespace-nowrap px-4 py-0 cursor-default no-underline rounded-[inherit]"
					>
						{content}
					</a>
				)
				: (
					<div className="flex h-9 max-h-9 w-full items-center overflow-hidden whitespace-nowrap px-4 py-0">
						{content}
					</div>
				)}
		</TableCellV2>
	);
}
