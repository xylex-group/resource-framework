"use client";

import { Input } from "../ui/input";
import type { ChangeEvent, InputHTMLAttributes } from "react";

export type PhoneNumberInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  onChangeAction?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function PhoneNumberInput({
  onChange,
  onChangeAction,
  label: _label,
  ...props
}: PhoneNumberInputProps) {
  return (
    <Input
      type="tel"
      onChange={(event) => {
        onChange?.(event);
        onChangeAction?.(event);
      }}
      {...props}
    />
  );
}
