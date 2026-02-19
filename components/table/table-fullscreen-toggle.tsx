import { Expand, Shrink } from "lucide-react";
import { Fragment, ReactElement } from "react";
import { Button } from "@/components/ui/button";

export interface TableFullscreenToggleProps {
	isEnabled: boolean;
	onToggle: () => void;
	className?: string;
}

export function TableFullscreenToggle({
	isEnabled,
	onToggle,
	className,
}: TableFullscreenToggleProps): ReactElement {
	return (
		<Button
			onClick={onToggle}
			variant="icon_v2"
			size="icon_v2"
			title="Toggle extra padding"
			aria-pressed={isEnabled}
			className={className}
		>
			<Fragment>
				{isEnabled
					? <Shrink className="stroke-icon h-3.5 w-3.5" />
					: <Expand className="stroke-icon h-3.5 w-3.5" />}
			</Fragment>
		</Button>
	);
}
