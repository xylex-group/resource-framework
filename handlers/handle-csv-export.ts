import type { Table } from "@tanstack/react-table";
import Papa from "papaparse";

export interface CsvExportOptions<TData = unknown> {
	table: Table<TData>;
	excludeColumns?: string[];
	title?: string;
	displayContext?: string;
}

export function handleDownloadCsv<TData = unknown>({
	table,
	excludeColumns = [],
	title,
	displayContext,
}: CsvExportOptions<TData>): void {
	try {
		const visibleColumns = table
			.getAllLeafColumns()
			.filter(
				(c) =>
					c.getIsVisible() &&
					!excludeColumns.includes(c.id) &&
					!(
						(c.columnDef as { accessorKey?: string })?.accessorKey &&
						excludeColumns.includes(
							(c.columnDef as { accessorKey?: string })
								.accessorKey as string,
						)
					),
			);

		const headers: string[] = visibleColumns.map((c) => {
			const header = typeof c.columnDef.header === "string"
				? c.columnDef.header
				: c.id;
			return String(header)
				.toLowerCase()
				.replace(/\s+/g, "_")
				.replace(/#/g, "hash")
				.replace(/%/g, "percent");
		});

		const rows = table.getPrePaginationRowModel().rows;
		const dataForCsv: Record<string, string>[] = rows.map((r) => {
			const obj: Record<string, string> = {};
			visibleColumns.forEach((c, idx: number) => {
				const key = headers[idx] || c.id;
				const value = r.getValue(c.id);
				if (value == null) {
					obj[key] = "";
				} else if (typeof value === "object") {
					try {
						obj[key] = JSON.stringify(value);
					} catch {
						obj[key] = String(value);
					}
				} else {
					obj[key] = String(value);
				}
			});
			return obj;
		});

		const csv = Papa.unparse(dataForCsv);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		const ts = new Date().toISOString().replace(/[:.]/g, "-");
		const base =
			(title && String(title).toLowerCase().replace(/\s+/g, "_")) ||
			displayContext ||
			"table";
		a.download = `${base}_export_${ts}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	} catch (e) {
		console.error("CSV export failed", e);
	}
}

