"use client";

import { Button as HeroButton, Spinner } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type LegacyButtonVariant =
  | "brand"
  | "default"
  | "destructive"
  | "ghost"
  | "icon_v2"
  | "icon_v3"
  | "link"
  | "outline"
  | "outline_dashed"
  | "secondary";

type LegacyButtonSize =
  | "default"
  | "icon"
  | "icon_v2"
  | "lg"
  | "sm"
  | "xs";

export interface ButtonProps extends Omit<
  ComponentProps<typeof HeroButton>,
  "children" | "isDisabled" | "isIconOnly" | "size" | "variant"
> {
  children?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  isLoading?: boolean;
  onPress?: ComponentProps<typeof HeroButton>["onPress"];
  size?: LegacyButtonSize;
  title?: string;
  variant?: LegacyButtonVariant;
}

const variantMap: Record<LegacyButtonVariant, ComponentProps<typeof HeroButton>["variant"]> = {
  brand: "primary",
  default: "primary",
  destructive: "danger-soft",
  ghost: "ghost",
  icon_v2: "ghost",
  icon_v3: "ghost",
  link: "ghost",
  outline: "outline",
  outline_dashed: "outline",
  secondary: "secondary",
};

export function Button({
  children,
  className,
  disabled,
  icon,
  isLoading,
  size = "default",
  variant = "default",
  ...props
}: ButtonProps) {
  const isIconOnly = size === "icon" || size === "icon_v2";
  const heroSize = size === "lg" ? "lg" : size === "sm" || size === "xs" ? "sm" : "md";
  const resolvedClassName = [
    variant === "outline_dashed" ? "border-dashed" : "",
    variant === "link" ? "underline-offset-4 hover:underline" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <HeroButton
      className={resolvedClassName}
      isDisabled={disabled || isLoading}
      isIconOnly={isIconOnly}
      size={heroSize}
      variant={variantMap[variant]}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : icon}
      {children}
    </HeroButton>
  );
}
