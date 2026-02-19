"use client";

import { Plus } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityItem {
	id: string;
	icon?: ReactNode;
	title: string;
	timestamp: string;
	description?: string;
}

interface DrilldownActivityProps {
	items: ActivityItem[];
	onAddNote?: () => void;
	className?: string;
	emptyState?: ReactNode;
}

export function DrilldownActivity({
	items,
	onAddNote,
	className,
	emptyState,
}: DrilldownActivityProps) {
	return (
		<div
			id="drilldown-activity-root"
			className={cn("space-y-4", className)}
		>
			<div className="flex items-center justify-between">
				<h3 className="text-md font-medium">Recent activity</h3>
				{onAddNote && (
					<Button
						variant="outline"
						size="sm"
						onClick={onAddNote}
						className="gap-1"
					>
						<Plus className="h-4 w-4" />
						Add note
					</Button>
				)}
			</div>

			{items.length > 0
				? (
					<div className="space-y-4">
						{items.map((item) => (
							<div key={item.id} className="flex gap-3">
								<div className="mt-0.5">{item.icon}</div>
								<div>
									<div className="font-medium">
										{item.title}
									</div>
									<div className="text-sm text-secondary">
										{item.timestamp}
									</div>
									{item.description && (
										<div className="mt-1 text-sm">
											{item.description}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)
				: (
					emptyState || (
						<div className="rounded-md border border-dashed p-6 text-center text-secondary">
							No recent activity
						</div>
					)
				)}
		</div>
	);
}
