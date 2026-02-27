"use client";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";

interface CalendarInputFormProps {
  id: string;
  fieldKey: string;
  label?: string;
  value: string;
  onChangeAction: (value: string) => void;
  error?: string;
  className?: string;
}

export function CalendarInputForm({
  id,
  label,
  value,
  onChangeAction,
  className,
}: CalendarInputFormProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <label htmlFor={id} className="text-sm text-slate-200">{label}</label>}
      <Input
        id={id}
        type="date"
        value={value || ""}
        onChange={(event) => onChangeAction(event.target.value)}
      />
    </div>
  );
}

export function CalendarInputFormDOB({
  id,
  label,
  value,
  onChangeAction,
  className,
}: CalendarInputFormProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <label htmlFor={`${id}-dob`} className="text-sm text-slate-200">{label}</label>}
      <Input
        id={`${id}-dob`}
        type="date"
        value={value || ""}
        onChange={(event) => onChangeAction(event.target.value)}
      />
    </div>
  );
}
