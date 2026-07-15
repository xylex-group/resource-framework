"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "@xylex-group/athena-auth-ui/primitives";
import { cn } from "@/lib/utils";

export interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  config?: Record<string, unknown>;
  children: ReactNode;
}

export function ChartContainer({
  className,
  config,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <Card
      className={cn(
        "rounded-xl p-3 text-sm",
        className,
      )}
      {...props}
    >
      {config && (
        <pre className="sr-only">{JSON.stringify(config)}</pre>
      )}
      {children}
    </Card>
  );
}
