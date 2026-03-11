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
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md border border-border bg-popover p-2 shadow-lg">
          {enableSearch && (
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={inputPlaceholder}
              className="mb-2 w-full rounded-sm border border-input bg-card px-2 py-1 text-xs text-foreground"
            />
          )}

          <div className={cn("max-h-64 overflow-auto", scrollBarInvisible && "scrollbar-thin") }>
            {filteredItems.length === 0 ? (
              <div className="px-2 py-1 text-xs text-muted-foreground">{noResultsMessage}</div>
            ) : (
              filteredItems.map((item, idx) => {
                if (item.type === "separator") {
                  return <hr key={`sep-${idx}`} className="my-1 border-border" />;
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
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-popover-foreground hover:bg-accent",
                      item.isActive && "bg-accent",
                      item.disabled && "cursor-not-allowed text-muted-foreground",
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
