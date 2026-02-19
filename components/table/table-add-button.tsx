import { Plus } from "lucide-react";
import React, { ReactElement } from "react";
import { Button } from "@/components/ui/button";

export interface TableAddButtonProps {
	onClick: () => void;
	label: string;
	keyboardShortcut?: string;
	className?: string;
}

export function TableAddButton({
	onClick,
	label,
	keyboardShortcut = "n",
	className,
}: TableAddButtonProps): ReactElement {
	return (
		<Button onClick={onClick} variant="brand" className={className}>
			<Plus
				className="-ms-1 me-2 stroke-white"
				size={16}
				strokeWidth={2}
				aria-hidden="true"
			/>
			{label}
			{keyboardShortcut && (
				<div className="ml-2 flex h-4 min-w-4 items-center justify-center rounded bg-slate-200/40 px-1 text-xs font-medium text-white">
					{keyboardShortcut}
				</div>
			)}
		</Button>
	);
}
