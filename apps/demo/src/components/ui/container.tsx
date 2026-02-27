"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  isExtraPaddingEnabled?: boolean;
};

export function Container({
  className,
  isExtraPaddingEnabled = false,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-5xl px-4 py-1",
        isExtraPaddingEnabled && "px-6",
        className,
      )}
      {...props}
    />
  );
}
