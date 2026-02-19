import type React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TableSearchInputProps {
	value: string;
	onChange: (value: string) => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	placeholder?: string;
	className?: string;
}

export function TableSearchInput({
	value,
	onChange,
	onKeyDown,
	placeholder = "Search... (e.g. invoice_id:123 amount>10)",
	className,
}: TableSearchInputProps): React.ReactElement {
	return (
		<div className={cn("w-full sm:w-fit sm:min-w-87.5 sm:pl-6", className)}>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={onKeyDown}
				placeholder={placeholder}
			/>
		</div>
	);
}

