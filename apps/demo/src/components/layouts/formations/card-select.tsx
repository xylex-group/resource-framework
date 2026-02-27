"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CardSelectOption {
  value: string;
  title: string;
  description?: string;
  badge?: string;
}

export interface CardSelectProps {
  options: CardSelectOption[];
  value: string;
  onChangeAction: (value: string) => void;
}

export function CardSelect({ options, value, onChangeAction }: CardSelectProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={isActive ? "default" : "ghost"}
            className={cn("w-full flex-col items-start text-left")}
            onClick={() => onChangeAction(option.value)}
          >
            <span className="text-base font-semibold">{option.title}</span>
            {option.description && (
              <span className="text-xs text-slate-300">{option.description}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
