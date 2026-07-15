"use client";

import { Chip } from "@heroui/react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type FlagProps = HTMLAttributes<HTMLSpanElement> & {
  country?: string;
  size?: number;
  includeCountryCode?: boolean;
  children?: ReactNode;
};

export function Flag({
  country,
  size = 16,
  includeCountryCode,
  className,
  children,
  style,
  ...props
}: FlagProps) {
  const display = includeCountryCode && country
    ? country.toUpperCase()
    : children;

  const mergedStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    lineHeight: 1,
    ...style,
  };

  return (
    <Chip
      {...props}
      aria-label={country ? `Country ${country.toUpperCase()}` : undefined}
      className={className}
      color="default"
      size="sm"
      style={mergedStyle}
      variant="soft"
    >
      {display}
    </Chip>
  );
}
