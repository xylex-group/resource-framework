"use client";

import { MoreHorizontal } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DrilldownAction {
	label: string;
	icon?: ReactNode;
	onClick: () => void;
	variant?:
		| "default"
		| "outline"
		| "secondary"
		| "ghost"
		| "link"
		| "destructive"
		| "brand";
	disabled?: boolean;
}

interface DrilldownActionsProps {
	actions: DrilldownAction[];
	maxVisibleActions?: number;
}

export function DrilldownActions({
	actions,
	maxVisibleActions = 3,
}: DrilldownActionsProps) {
	// Seperate actions between visible buttons and dropdown menu items
	const visibleActions = actions.slice(0, maxVisibleActions);
	const dropdownActions = actions.slice(maxVisibleActions);

	return (
		<div
			id="drilldown-actions-root"
			className="flex items-center gap-2"
		>
			{/* Visible buttons */}
			{visibleActions.map((action, index) => (
				<Button
					key={index}
					// size="sm"
					size="sm"
					variant={action.variant === "brand"
						? "default"
						: action.variant || "default"}
					onClick={action.onClick}
					disabled={action.disabled}
					className="gap-1"
				>
					{action.icon}
					{action.label}
				</Button>
			))}

			{/* Dropdown menu for extra actions */}
			{dropdownActions.length > 0 && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{dropdownActions.map((action, index) => (
							<DropdownMenuItem
								key={index}
								onClick={action.onClick}
								disabled={action.disabled}
								className={cn(
									action.variant === "destructive" &&
										"text-destructive",
									"gap-2 px-4 py-2",
								)}
							>
								{action.icon}
								{action.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
