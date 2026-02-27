 "use client";

import type { HTMLAttributes, ReactNode, VideoHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function VideoPlayer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative", className)} {...props} />;
}

export function VideoPlayerContent({
  className,
  ...props
}: VideoHTMLAttributes<HTMLVideoElement>) {
  return (
    <video
      className={cn("block max-w-full rounded-md border border-slate-800", className)}
      {...props}
    />
  );
}

export function VideoPlayerControlBar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-2 flex items-center gap-2 rounded-md bg-slate-900/70 px-3 py-2", className)}
      {...props}
    />
  );
}

type VideoButtonProps = HTMLAttributes<HTMLButtonElement> & {
  noTooltip?: boolean;
};

const PlayerButton = ({
  children,
  className,
  ...props
}: VideoButtonProps & { children: ReactNode }) => (
  <button
    type="button"
    className={cn(
      "rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200",
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

export const VideoPlayerMuteButton = (props: VideoButtonProps) => (
  <PlayerButton {...props}>Mute</PlayerButton>
);
export const VideoPlayerPlayButton = (props: VideoButtonProps) => (
  <PlayerButton {...props}>Play</PlayerButton>
);
export const VideoPlayerSeekBackwardButton = (props: VideoButtonProps) => (
  <PlayerButton {...props}>Back</PlayerButton>
);
export const VideoPlayerSeekForwardButton = (props: VideoButtonProps) => (
  <PlayerButton {...props}>Forward</PlayerButton>
);
export const VideoPlayerTimeDisplay = ({
  showDuration,
  className,
}: { showDuration?: boolean } & HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("text-xs text-slate-200", className)}>
    {showDuration ? "00:00 / 00:00" : "00:00"}
  </span>
);
export const VideoPlayerTimeRange = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 rounded-full bg-slate-800", className)}
    {...props}
  >
    <div className="h-1 w-1/2 rounded-full bg-slate-500" />
  </div>
);
export const VideoPlayerVolumeRange = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("h-2 w-20 rounded-full bg-slate-800", className)}
    {...props}
  >
    <div className="h-2 w-1/2 rounded-full bg-slate-500" />
  </div>
);
