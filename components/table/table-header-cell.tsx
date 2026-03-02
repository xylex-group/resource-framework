import type { Header } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { KeyboardEvent, ReactElement } from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableHeaderCellProps<TData, TValue> {
	header: Header<TData, TValue>;
}

export function TableHeaderCell<TData, TValue>({
	header,
}: TableHeaderCellProps<TData, TValue>): ReactElement {
	const meta = (header.column.columnDef.meta ?? {}) as {
		widthFit?: boolean;
		maxWidth?: number;
		className?: string;
	};
	const widthFit = meta.widthFit;
	const maxWidth = meta.maxWidth;

	const headerStyle = widthFit
		? {
			width: "auto" as const,
			minWidth: typeof header.column.columnDef.minSize === "number"
				? `${header.column.columnDef.minSize}px`
				: undefined,
			maxWidth: typeof maxWidth === "number"
				? `${maxWidth}px`
				: undefined,
		}
		: {
			width: `${header.getSize()}px`,
		};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (
			header.column.getCanSort() &&
			(e.key === "Enter" || e.key === " ")
		) {
			e.preventDefault();
			header.column.getToggleSortingHandler()?.(e);
		}
	};

	const sortDirection = header.column.getIsSorted();

	return (
		<TableHead
			key={header.id}
			style={headerStyle}
			className={cn(
				"sticky top-0 z-10 h-9 max-h-9 py-0",
				widthFit && "w-fit whitespace-nowrap",
				meta?.className,
			)}
		>
			{header.isPlaceholder ? null : header.column.getCanSort()
				? (
					<button
						type="button"
						className={cn(
							header.column.getCanSort() &&
								"group flex h-9 max-h-9 w-full min-w-0 cursor-pointer select-none items-center justify-between gap-2 overflow-hidden capitalize text-primary",
						)}
						onClick={header.column.getToggleSortingHandler()}
						onKeyDown={handleKeyDown}
						tabIndex={header.column.getCanSort() ? 0 : undefined}
					>
						<span
							className={cn("min-w-0 truncate whitespace-nowrap")}
						>
							{flexRender(
								header.column.columnDef.header,
								header.getContext(),
							)}
						</span>

						{sortDirection === "asc"
							? (
								<ChevronUp
									className="shrink-0 opacity-60"
									size={16}
									strokeWidth={2}
								/>
							)
							: sortDirection === "desc"
							? (
								<ChevronDown
									className="shrink-0 opacity-60"
									size={16}
									strokeWidth={2}
								/>
							)
							: (
								<ChevronsUpDown
									className="shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
									size={16}
									strokeWidth={2}
									aria-hidden="true"
								/>
							)}
					</button>
				)
				: (
					<span
						className={cn(
							"block h-9 max-h-9 overflow-hidden whitespace-nowrap truncate",
						)}
					>
						{flexRender(
							header.column.columnDef.header,
							header.getContext(),
						)}
					</span>
				)}
		</TableHead>
	);
}
