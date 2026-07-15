"use client";

import { MoreHorizontal } from "lucide-react";
import { ReactNode } from "react";
import { Dropdown } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DrilldownAction {
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
				<Dropdown>
					<Dropdown.Trigger
						aria-label="More actions"
						className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-default"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Dropdown.Trigger>
					<Dropdown.Popover placement="bottom end">
						<Dropdown.Menu>
						{dropdownActions.map((action, index) => (
							<Dropdown.Item
								key={index}
								id={`${action.label}-${index}`}
								onAction={action.onClick}
								isDisabled={action.disabled}
								className={cn(
									action.variant === "destructive" &&
										"text-destructive",
									"gap-2 px-4 py-2",
								)}
							>
								{action.icon}
								{action.label}
							</Dropdown.Item>
						))}
						</Dropdown.Menu>
					</Dropdown.Popover>
				</Dropdown>
			)}
		</div>
	);
}
