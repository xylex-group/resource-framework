"use client";

import { Card } from "@xylex-group/athena-auth-ui/primitives";

/**
 * Video player component with controls
 * @param props - Component props including src and maxHeight
 * @returns React component
 */
export function VideoRenderer({
	src,
	maxHeight,
}: {
	src: string;
	maxHeight?: string;
}) {
	return (
		<div
			className="flex w-full items-center justify-center"
			style={maxHeight ? { maxHeight } : undefined}
		>
			<Card
				className="cursor-default overflow-hidden rounded-xl p-2"
				style={{
					width: "fit-content",
					height: "fit-content",
					maxHeight: maxHeight,
					maxWidth: "100%",
				}}
			>
				<video
					crossOrigin="anonymous"
					preload="auto"
					src={src}
					controls
					className="h-auto w-auto max-w-full rounded-lg object-contain"
					style={{
						maxHeight: maxHeight,
						maxWidth: "100%",
					}}
				/>
			</Card>
		</div>
	);
}
