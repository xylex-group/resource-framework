"use client";

import { Checkbox as HeroCheckbox } from "@heroui/react";
import type { ComponentProps } from "react";

export interface CheckboxProps extends Omit<ComponentProps<typeof HeroCheckbox>, "isSelected" | "onChange"> {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ checked, disabled, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <HeroCheckbox
      {...props}
      isDisabled={disabled}
      isSelected={checked}
      onChange={onCheckedChange}
    >
      <HeroCheckbox.Control>
        <HeroCheckbox.Indicator />
      </HeroCheckbox.Control>
    </HeroCheckbox>
  );
}
