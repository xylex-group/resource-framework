"use client";

import { ListBox, Select as HeroSelect } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

export interface SelectProps extends Omit<ComponentProps<typeof HeroSelect>, "onSelectionChange" | "selectedKey"> {
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
}

export function Select({ disabled, onValueChange, value, ...props }: SelectProps) {
  return (
    <HeroSelect
      {...props}
      isDisabled={disabled}
      onSelectionChange={(key) => onValueChange?.(key == null ? "" : String(key))}
      selectedKey={value || null}
    />
  );
}

export interface SelectTriggerProps extends Omit<ComponentProps<typeof HeroSelect.Trigger>, "children"> {
  children?: ReactNode;
}

export function SelectTrigger({ children, ...props }: SelectTriggerProps) {
  return (
    <HeroSelect.Trigger {...props}>
      {children}
      <HeroSelect.Indicator />
    </HeroSelect.Trigger>
  );
}

export function SelectValue(props: ComponentProps<typeof HeroSelect.Value>) {
  return <HeroSelect.Value {...props} />;
}

export interface SelectContentProps extends ComponentProps<typeof HeroSelect.Popover> {
  children: ReactNode;
}

export function SelectContent({ children, ...props }: SelectContentProps) {
  return (
    <HeroSelect.Popover {...props}>
      <ListBox>{children}</ListBox>
    </HeroSelect.Popover>
  );
}

export interface SelectItemProps extends Omit<ComponentProps<typeof ListBox.Item>, "id" | "value"> {
  value: string;
}

export function SelectItem({ value, ...props }: SelectItemProps) {
  return <ListBox.Item {...props} id={value} />;
}
