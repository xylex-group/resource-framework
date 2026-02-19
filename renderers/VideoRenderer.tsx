"use client";

import {
	VideoPlayer,
	VideoPlayerContent,
	VideoPlayerControlBar,
	VideoPlayerMuteButton,
	VideoPlayerPlayButton,
	VideoPlayerSeekBackwardButton,
	VideoPlayerSeekForwardButton,
	VideoPlayerTimeDisplay,
	VideoPlayerTimeRange,
	VideoPlayerVolumeRange,
} from "@/components/ui/video-player";

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
			className="flex w-full items-center justify-center bg-black"
			style={maxHeight ? { maxHeight } : undefined}
		>
			<VideoPlayer
				className="overflow-hidden rounded-md border bg-black cursor-default"
				style={{
					width: "fit-content",
					height: "fit-content",
					maxHeight: maxHeight,
					maxWidth: "100%",
				}}
			>
				<VideoPlayerContent
					crossOrigin=""
					preload="auto"
					slot="media"
					src={src}
					controls={false}
					className="object-contain w-auto h-auto"
					style={{
						maxHeight: maxHeight,
						maxWidth: "100%",
					}}
				/>
				<VideoPlayerControlBar>
					<VideoPlayerPlayButton />
					<VideoPlayerSeekBackwardButton />
					<VideoPlayerSeekForwardButton />
					<VideoPlayerTimeRange />
					<VideoPlayerTimeDisplay showDuration />
					<VideoPlayerMuteButton />
					<VideoPlayerVolumeRange className="bg-" />
				</VideoPlayerControlBar>
			</VideoPlayer>
		</div>
	);
}
