"use client";

import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
};

const SelectContext = createContext<SelectContextType>({
  value: "",
  onValueChange: () => {},
  disabled: false,
});

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Select({ value, onValueChange, children, disabled = false }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange, disabled }}>
      <div className="relative flex flex-col">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function SelectTrigger({ className, children, id }: SelectTriggerProps) {
  const { disabled } = useContext(SelectContext);

  return (
    <div
      className={cn(
        "cursor-pointer rounded-sm border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      id={id}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useContext(SelectContext);
  return <span>{value || placeholder}</span>;
}

export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ className, children }: SelectContentProps) {
  return (
    <div
      className={cn(
        "mt-2 rounded-sm border border-slate-700 bg-slate-900/80 p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SelectItem({ value, children, className, disabled = false }: SelectItemProps) {
  const { onValueChange, disabled: selectDisabled } = useContext(SelectContext);
  const isDisabled = disabled || selectDisabled;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isDisabled) {
          onValueChange(value);
        }
      }}
      disabled={isDisabled}
      className={cn(
        "w-full rounded-sm px-2 py-1 text-left text-sm text-slate-200 hover:bg-slate-800/60",
        isDisabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
