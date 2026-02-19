import { Download } from "lucide-react";
import { ReactElement } from "react";
import { Button } from "@/components/ui/button";

export interface TableDownloadButtonProps {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
}

export function TableDownloadButton({
	onClick,
	disabled = false,
	className,
}: TableDownloadButtonProps): ReactElement {
	return (
		<Button
			onClick={onClick}
			variant="icon_v2"
			size="icon_v2"
			title="Download CSV"
			disabled={disabled}
			className={className}
		>
			<Download className="stroke-icon h-3.5 w-3.5" />
		</Button>
	);
}
