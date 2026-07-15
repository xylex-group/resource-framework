"use client";

import { Popover as HeroPopover } from "@heroui/react";
import { Children, type ComponentProps, type ReactNode } from "react";

export interface PopoverProps extends Omit<ComponentProps<typeof HeroPopover>, "children" | "isOpen"> {
  children: ReactNode;
  isOpen?: boolean;
  open?: boolean;
}

export function Popover({ children, isOpen, open, ...props }: PopoverProps) {
  const [trigger, ...content] = Children.toArray(children);

  return (
    <HeroPopover {...props} isOpen={isOpen ?? open}>
      <HeroPopover.Trigger>{trigger}</HeroPopover.Trigger>
      {content}
    </HeroPopover>
  );
}

export interface PopoverContentProps extends Omit<ComponentProps<typeof HeroPopover.Content>, "children" | "placement"> {
  children: ReactNode;
  placement?: "top" | "bottom";
}

export function PopoverContent({ children, placement, ...props }: PopoverContentProps) {
  return (
    <HeroPopover.Content {...props} placement={placement}>
      <HeroPopover.Dialog>{children}</HeroPopover.Dialog>
    </HeroPopover.Content>
  );
}
