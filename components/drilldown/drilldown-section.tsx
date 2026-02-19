import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { EmptyField } from "@/components/ui/empty-field";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

interface DrilldownSectionProps {
	title?: string;
	children: ReactNode;
	className?: string;
	loading?: boolean;
	skeleton_width?: number | string;
	skeleton_height?: number;
	skeleton_mobile_width?: number | string;
	skeleton_mobile_height?: number;
	max_height?: number;
	width_fit?: boolean;
	no_padding?: boolean;
	empty?: boolean;
	empty_message?: string;
	emptyComponent?: ReactNode;
}

export function DrilldownSection({
	title,
	children,
	className,
	loading = false,
	skeleton_width,
	skeleton_height,
	skeleton_mobile_width,
	skeleton_mobile_height,
	max_height,
	width_fit = false,
	no_padding = false,
	empty = false,
	empty_message,
	emptyComponent,
}: DrilldownSectionProps) {
	const slug = title
		? title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
		: "drilldown-section";
	const sectionId = `drilldown-section-${slug}`;
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(true);
	const [height, setHeight] = useState<null | number>(null);
	const contentWrapperRef = useRef<HTMLDivElement | null>(null);
	const contentInnerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (contentWrapperRef.current) {
			contentWrapperRef.current.id = `drilldown-section-content-${
				title?.toLowerCase().replace(/ /g, "-")
			}`;
		}
	}, [title]);

	useLayoutEffect(() => {
		if (open) {
			if (contentInnerRef.current) {
				const scrollHeight = contentInnerRef.current.scrollHeight;
				if (scrollHeight !== height) {
					setHeight(scrollHeight + 8);
					const timeout = setTimeout(() => setHeight(null), 150);
					return () => clearTimeout(timeout);
				}
			}
		} else {
			if (height !== 0) {
				setHeight(0);
			}
		}
	}, [open, height, children]);

	const skeletonWidth = isMobile
		? Number(skeleton_mobile_width ?? 150)
		: Number(skeleton_width ?? 150);

	const skeletonHeight = isMobile
		? Number(skeleton_mobile_height ?? 20)
		: Number(skeleton_height ?? 20);

	if (loading) {
		return (
			<section
				id={`${sectionId}-loading`}
				className="space-y-4"
			>
				<Skeleton
					className="w-full"
					style={{
						width: skeletonWidth,
						height: skeletonHeight,
					}}
				/>
			</section>
		);
	}

	if (empty) {
		return (
			<section
				id={`${sectionId}-empty`}
				style={{
					maxHeight: max_height,
					overflowY: max_height ? "auto" : undefined,
					width: width_fit ? "fit-content" : undefined,
				}}
				className={cn(
					"scrollbar space-y-4",
					!no_padding && "px-2 sm:px-4",
					className,
				)}
			>
				{emptyComponent ?? (
					<EmptyField
						title={title ?? ""}
						message={empty_message ?? "No data found."}
					/>
				)}
			</section>
		);
	}

	return (
		<section
			id={sectionId}
			style={{
				maxHeight: max_height,
				overflowY: max_height ? "auto" : undefined,
				width: width_fit ? "fit-content" : undefined,
			}}
			className={cn(
				"scrollbar space-y-2 pt-4",
				!no_padding && "px-2 sm:px-4",
				className,
			)}
		>
			<Container>
				{title && (
					<Button
						variant={"ghost"}
						size={"xs"}
						type="button"
						className={cn(
							"expand-section-container-button expand-section-container-button-content flex w-fit select-none items-center justify-between gap-x-1 rounded-sm text-left text-xl font-medium text-primary hover:bg-hover p-0 group",
						)}
						onClick={() => setOpen((v) => !v)}
					>
						<span className="truncate text-sm font-semibold text-secondary group-hover:text-primary transition-colors">
							{title}
						</span>
						<ChevronDown
							className={cn(
								"h-4 w-4  text-icon group-hover:text-primary transition-colors",
								open ? "rotate-0" : "-rotate-90",
							)}
						/>
					</Button>
				)}
			</Container>
			<Separator />
			<div
				id={`div-drilldown-section-content-${
					title?.toLowerCase().replace(/ /g, "-")
				}`}
				ref={contentWrapperRef}
				style={{
					minHeight: 1,
					height: height !== null ? height : undefined,
					transition: "height 125ms cubic-bezier(0.4, 0, 0.2, 1)",
					overflow: height !== null ? "hidden" : "visible",
					width: width_fit ? "fit-content" : undefined,
					pointerEvents: "auto",
				}}
				className={cn(
					"expand-section-container",
					"expand-section-container-content pt-1",
					className,
				)}
				aria-hidden={!open}
			>
				<div
					id={`div-content-inner-ref-wrapper-${
						title?.toLowerCase().replace(/ /g, "-")
					}`}
					ref={contentInnerRef}
					style={{
						pointerEvents: "auto",
					}}
				>
					<Container>
						{children}
					</Container>
				</div>
			</div>
		</section>
	);
}
