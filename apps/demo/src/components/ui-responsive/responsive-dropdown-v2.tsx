"use client";

import {
  ReactElement,
  MouseEvent,
  cloneElement,
  isValidElement,
  useMemo,
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
  isActive?: boolean;
};

export interface ResponsiveDropdownV2Props {
  dropdownLabel?: string;
  items: ResponsiveDropdownItem[];
  triggerButton?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  enableSearch?: boolean;
  inputPlaceholder?: string;
  noResultsMessage?: string;
  forceNativeOnMobile?: boolean;
  scrollBarInvisible?: boolean;
}

export function ResponsiveDropdownV2({
  dropdownLabel,
  items,
  triggerButton,
  open,
  onOpenChange,
  enableSearch = false,
  inputPlaceholder = "Search...",
  noResultsMessage = "No options",
  scrollBarInvisible = false,
}: ResponsiveDropdownV2Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? Boolean(open) : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const filteredItems = useMemo(() => {
    if (!enableSearch || query.trim() === "") {
      return items;
    }

    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (item.type === "separator") return false;
      return String(item.buttonText || "").toLowerCase().includes(q);
    });
  }, [items, enableSearch, query]);

  const typedTrigger = triggerButton as
    | ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>
    | undefined;

  const renderTrigger = typedTrigger && isValidElement(typedTrigger)
    ? cloneElement(typedTrigger, {
      onClick(event: MouseEvent<HTMLElement>) {
        setOpen(!isOpen);
        typedTrigger.props.onClick?.(event);
      },
    })
    : (
      <Button
        variant="ghost"
        onClick={() => setOpen(!isOpen)}
      >
        {dropdownLabel || "Actions"}
      </Button>
    );

  return (
    <div className="relative inline-flex">
      {renderTrigger}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md border border-slate-700 bg-slate-950 p-2 shadow-lg">
          {enableSearch && (
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={inputPlaceholder}
              className="mb-2 w-full rounded-sm border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            />
          )}

          <div className={cn("max-h-64 overflow-auto", scrollBarInvisible && "scrollbar-thin") }>
            {filteredItems.length === 0 ? (
              <div className="px-2 py-1 text-xs text-slate-400">{noResultsMessage}</div>
            ) : (
              filteredItems.map((item, idx) => {
                if (item.type === "separator") {
                  return <hr key={`sep-${idx}`} className="my-1 border-slate-700" />;
                }

                return (
                  <button
                    key={`item-${idx}`}
                    type="button"
                    onClick={() => {
                      setOpen(false);
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
                      item.isActive && "bg-slate-800",
                      item.disabled && "cursor-not-allowed text-slate-500",
                    )}
                  >
                    {item.buttonText}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
