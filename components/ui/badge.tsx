"use client";

import { Badge as HeroBadge } from "@heroui/react";
import type { ComponentProps } from "react";

type LegacyBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

export interface BadgeProps extends Omit<ComponentProps<typeof HeroBadge>, "variant"> {
  variant?: LegacyBadgeVariant;
}

export function Badge({ variant = "default", ...props }: BadgeProps) {
  const heroVariant = variant === "outline" ? "secondary" : variant === "default" ? "primary" : "soft";
  const color = variant === "destructive" ? "danger" : variant === "default" ? "accent" : "default";

  return <HeroBadge {...props} color={color} variant={heroVariant} />;
}
