"use client";

import { EmptyState } from "@heroui/react";
import type { HTMLAttributes } from "react";

type EmptyFieldProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  message?: string;
};

export function EmptyField({
  className,
  title,
  message,
  children,
  ...props
}: EmptyFieldProps) {
  return (
    <EmptyState
      className={`min-h-32 rounded-xl ${className ?? ""}`}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          {title ? <h3 className="font-medium text-foreground">{title}</h3> : null}
          <p className="text-sm text-muted-foreground">{message || "Nothing to show yet."}</p>
        </>
      )}
    </EmptyState>
  );
}
