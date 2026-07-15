"use client";

import { Input as HeroInput, Label, TextField } from "@heroui/react";
import type { ComponentProps } from "react";

export interface InputProps extends ComponentProps<typeof HeroInput> {
  label?: string;
}

export function Input({ label, ...props }: InputProps) {
  if (!label) return <HeroInput {...props} />;

  return (
    <TextField className="w-full">
      <Label>{label}</Label>
      <HeroInput {...props} />
    </TextField>
  );
}
