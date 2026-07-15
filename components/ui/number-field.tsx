"use client";

import { Label, NumberField as HeroNumberField } from "@heroui/react";
import type { ComponentProps } from "react";

export interface NumberFieldProps extends Omit<ComponentProps<typeof HeroNumberField>, "onChange" | "value"> {
  label?: string;
  max?: number;
  min?: number;
  onValueChange: (value: number) => void;
  step?: number;
  value: number;
}

export function NumberField({ label, max, min, onValueChange, step, value, ...props }: NumberFieldProps) {
  return (
    <HeroNumberField
      {...props}
      maxValue={max}
      minValue={min}
      onChange={onValueChange}
      step={step}
      value={Number.isFinite(value) ? value : undefined}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroNumberField.Group>
        <HeroNumberField.DecrementButton />
        <HeroNumberField.Input />
        <HeroNumberField.IncrementButton />
      </HeroNumberField.Group>
    </HeroNumberField>
  );
}
