import { CircleAlert, Trash } from "lucide-react";
import type React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface TableDeleteDialogProps {
	selectedCount: number;
	onDelete: () => void;
	className?: string;
}

export function TableDeleteDialog({
	selectedCount,
	onDelete,
	className,
}: TableDeleteDialogProps): React.ReactElement {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button className={className} variant="outline">
					<Trash
						className="-ms-1 me-2 opacity-60"
						size={16}
						strokeWidth={2}
						aria-hidden="true"
					/>
					Delete
					<span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
						{selectedCount}
					</span>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
					<div
						className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
						aria-hidden="true"
					>
						<CircleAlert
							className="opacity-80"
							size={16}
							strokeWidth={2}
						/>
					</div>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you absolutely sure?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. this will permanently
							delete {selectedCount} selected{" "}
							{selectedCount === 1 ? "row" : "rows"}.
						</AlertDialogDescription>
					</AlertDialogHeader>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onDelete}>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
