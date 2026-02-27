"use client";

import {
  ReactElement,
  cloneElement,
  isValidElement,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ResponsiveDropdownItem = {
  buttonText?: string;
  onClick?: () => void;
  type?: "separator";
  variant?: "default" | "destructive";
  disabled?: boolean;
};

export interface ResponsiveDropdownV2Props {
  dropdownLabel?: string;
  items: ResponsiveDropdownItem[];
  triggerButton?: ReactElement;
}

export function ResponsiveDropdownV2({
  dropdownLabel,
  items,
  triggerButton,
}: ResponsiveDropdownV2Props) {
  const [isOpen, setIsOpen] = useState(false);

  const renderTrigger = triggerButton && isValidElement(triggerButton)
    ? cloneElement(triggerButton, {
      onClick(event: React.MouseEvent<HTMLButtonElement>) {
        setIsOpen((open) => !open);
        triggerButton.props.onClick?.(event);
      },
    })
    : (
      <Button
        variant="ghost"
        onClick={() => setIsOpen((open) => !open)}
      >
        {dropdownLabel || "Actions"}
      </Button>
    );

  return (
    <div className="relative inline-flex">
      {renderTrigger}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-slate-700 bg-slate-950 p-2 shadow-lg">
          {items.map((item, idx) => {
            if (item.type === "separator") {
              return <hr key={`sep-${idx}`} className="my-1 border-slate-700" />;
            }
            return (
              <button
                key={`item-${idx}`}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (!item.disabled) {
                    item.onClick?.();
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  "w-full rounded-sm px-2 py-1 text-left text-sm",
                  item.variant === "destructive"
                    ? "text-red-400 hover:bg-red-700/20"
                    : "text-slate-100 hover:bg-slate-800",
                  item.disabled && "cursor-not-allowed text-slate-500",
                )}
              >
                {item.buttonText}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
