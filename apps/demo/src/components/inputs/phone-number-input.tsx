"use client";

import { Input } from "../ui/input";
import type { InputHTMLAttributes } from "react";

export type PhoneNumberInputProps = InputHTMLAttributes<HTMLInputElement>;

export function PhoneNumberInput(props: PhoneNumberInputProps) {
  return <Input type="tel" {...props} />;
}
