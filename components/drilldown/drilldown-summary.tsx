import { cn } from "@/lib/utils";
import React, { ReactElement, ReactNode } from "react";

import { useId } from "react";

type DrilldownSummaryProps = {
	children: ReactNode;
	columns?: 1 | 2 | 3 | 4;
	className?: string;
};

export function DrilldownSummary({
	children,
	columns = 2,
	className,
}: DrilldownSummaryProps) {
	const gridCols = {
		1: "sm:grid-cols-1",
		2: "sm:grid-cols-2",
		3: "sm:grid-cols-2 md:grid-cols-3",
		4: "sm:grid-cols-2 md:grid-cols-4",
	}[columns];

	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-3 sm:gap-4",
				gridCols,
				className,
			)}
		>
			{children}
		</div>
	);
}

type DrilldownSummaryItemProps = {
	label: ReactNode;
	value: ReactNode;
	className?: string;
	showIfEmpty?: boolean;
};

function isValueEmpty(value: ReactNode): boolean {
	// null or undefined
	if (value === null || value === undefined) return true;
	// empty string
	if (typeof value === "string" && value.trim() === "") return true;
	// array with no length
	if (Array.isArray(value) && value.length === 0) return true;
	// React fragments or elements that render nothing
	if (
		typeof value === "object" && value !== null && "type" in value &&
		"props" in value
	) {
		// case: value is a valid React element but renders nothing or only false/null/undefined
		const element = value as ReactElement<
			{ children?: ReactNode }
		>;
		if (
			element.type === React.Fragment &&
			(!element.props.children ||
				(Array.isArray(element.props.children) &&
					element.props.children.length === 0))
		) {
			return true;
		}
	}
	// boolean or number edge cases (false or NaN)
	if (typeof value === "boolean" && value === false) return true;
	if (typeof value === "number" && isNaN(value)) return true;
	return false;
}

export function DrilldownSummaryItem({
	label,
	value,
	className,
	showIfEmpty = false,
}: DrilldownSummaryItemProps) {
	const id = useId();

	const isEmpty = isValueEmpty(value);

	if (!showIfEmpty && isEmpty) {
		return null;
	}

	return (
		<div
			id={`drilldown-summary-item-${id}`}
			className={cn(
				"flex min-w-0 flex-col sm:flex-row sm:items-center gap-1 sm:gap-4",
				className,
			)}
		>
			<div className="text-xs font-semibold uppercase tracking-wide text-primary shrink-0 sm:w-40">
				{label}
			</div>
			<div className="min-w-0 text-sm text-primary wrap-break-word flex-1">
				{value}
			</div>
		</div>
	);
}
