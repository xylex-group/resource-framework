"use client";

import {
    MediaControlBar,
    MediaController,
    MediaMuteButton,
    MediaPlayButton,
    MediaSeekBackwardButton,
    MediaSeekForwardButton,
    MediaTimeDisplay,
    MediaTimeRange,
    MediaVolumeRange,
} from "media-chrome/react";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type VideoPlayerProps = ComponentProps<typeof MediaController>;

const variables = {
    "--media-primary-color": "var(--text-primary)",
    "--media-secondary-color": "var(--background)",
    "--media-text-color": "var(--foreground)",
    "--media-background-color": "transparent",
    "--media-control-hover-background": "transparent",
    "--media-font-family": "var(--font-sans)",
    "--media-live-button-icon-color": "var(--muted-foreground)",
    "--media-live-button-indicator-color": "var(--color-destructive)",
    "--media-range-track-background": "transparent",
    "--media-tooltip-background": "rgba(15,15,15,0.9)",
    "--media-tooltip-color": "var(--text-primary)",
    "--media-tooltip-border-radius": "0.35rem",
} as CSSProperties;

export const VideoPlayer = ({ style, ...props }: VideoPlayerProps) => (
    <MediaController
        style={{
            ...variables,
            ...style,
        }}
        {...props}
    />
);

export type VideoPlayerControlBarProps = ComponentProps<typeof MediaControlBar>;
export const VideoPlayerControlBar = (props: VideoPlayerControlBarProps) => (
    <MediaControlBar {...props} />
);

export type VideoPlayerTimeRangeProps = ComponentProps<typeof MediaTimeRange>;
export const VideoPlayerTimeRange = ({
    className,
    ...props
}: VideoPlayerTimeRangeProps) => (
    <MediaTimeRange className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerTimeDisplayProps = ComponentProps<
    typeof MediaTimeDisplay
>;
export const VideoPlayerTimeDisplay = ({
    className,
    ...props
}: VideoPlayerTimeDisplayProps) => (
    <MediaTimeDisplay className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerVolumeRangeProps = ComponentProps<
    typeof MediaVolumeRange
>;
export const VideoPlayerVolumeRange = ({
    className,
    ...props
}: VideoPlayerVolumeRangeProps) => (
    <MediaVolumeRange className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerPlayButtonProps = ComponentProps<typeof MediaPlayButton>;
export const VideoPlayerPlayButton = ({
    className,
    ...props
}: VideoPlayerPlayButtonProps) => (
    <MediaPlayButton className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerSeekBackwardButtonProps = ComponentProps<
    typeof MediaSeekBackwardButton
>;
export const VideoPlayerSeekBackwardButton = ({
    className,
    ...props
}: VideoPlayerSeekBackwardButtonProps) => (
    <MediaSeekBackwardButton className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerSeekForwardButtonProps = ComponentProps<
    typeof MediaSeekForwardButton
>;
export const VideoPlayerSeekForwardButton = ({
    className,
    ...props
}: VideoPlayerSeekForwardButtonProps) => (
    <MediaSeekForwardButton className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerMuteButtonProps = ComponentProps<typeof MediaMuteButton>;
export const VideoPlayerMuteButton = ({
    className,
    ...props
}: VideoPlayerMuteButtonProps) => (
    <MediaMuteButton className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerContentProps = ComponentProps<"video">;
export const VideoPlayerContent = ({
    className,
    ...props
}: VideoPlayerContentProps) => (
    <video className={cn("mb-0 mt-0 object-contain", className)} {...props} />
);
