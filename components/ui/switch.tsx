"use client";

import { Switch as HeroSwitch } from "@heroui/react";
import type { ComponentProps } from "react";

export interface SwitchProps extends Omit<ComponentProps<typeof HeroSwitch>, "isSelected" | "onChange"> {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ checked, disabled, onCheckedChange, ...props }: SwitchProps) {
  return (
    <HeroSwitch
      {...props}
      isDisabled={disabled}
      isSelected={checked}
      onChange={onCheckedChange}
    >
      <HeroSwitch.Control>
        <HeroSwitch.Thumb />
      </HeroSwitch.Control>
    </HeroSwitch>
  );
}
