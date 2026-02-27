"use client";

import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const SelectContext = createContext<SelectContextType>({
  value: "",
  onValueChange: () => {},
});

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative flex flex-col">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  return (
    <div
      className={cn(
        "cursor-pointer rounded-sm border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200",
        className,
      )}
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
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  const { onValueChange } = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "w-full rounded-sm px-2 py-1 text-left text-sm text-slate-200 hover:bg-slate-800/60",
        className,
      )}
    >
      {children}
    </button>
  );
}
