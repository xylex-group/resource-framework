import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactElement } from "react";
import { Button } from "@/components/ui/button";

export interface TablePaginationControlsProps<TData> {
	table: Table<TData>;
	variant?: "mobile" | "desktop";
}

export function TablePaginationControls<TData>({
	table,
	variant = "desktop",
}: TablePaginationControlsProps<TData>): ReactElement {
	if (variant === "mobile") {
		return (
			<div className="flex items-center space-x-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
					className="px-2"
				>
					<ChevronLeft size={20} className="stroke-primary" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
					className="px-2"
				>
					<ChevronRight size={20} className="stroke-primary" />
				</Button>
			</div>
		);
	}

	return (
		<div className="flex items-center space-x-2 p-2">
			<Button
				variant="icon_v2"
				size="icon_v2"
				onClick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				<ChevronLeft className="h-3.5 w-3.5 stroke-primary" />
			</Button>
			<Button
				variant="icon_v2"
				size="icon_v2"
				onClick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				<ChevronRight className="h-3.5 w-3.5 stroke-primary" />
			</Button>
		</div>
	);
}
