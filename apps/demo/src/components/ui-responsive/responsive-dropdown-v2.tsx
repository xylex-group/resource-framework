"use client";

import {
  ReactElement,
  useMemo,
  useState,
} from "react";
import { Button, Dropdown, EmptyState, Input, Separator } from "@heroui/react";
import { cn } from "@/lib/utils";

type ResponsiveDropdownItem = {
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

  const renderTrigger = triggerButton ?? (
    <Button variant="ghost">{dropdownLabel || "Actions"}</Button>
  );

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setOpen}>
      <Dropdown.Trigger>{renderTrigger}</Dropdown.Trigger>
      <Dropdown.Popover className="w-64 rounded-xl" placement="bottom end">
        <div className="p-2">
          {enableSearch && (
            <Input
              aria-label={`Search ${dropdownLabel || "options"}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mb-2 w-full rounded-lg"
            />
          )}

          <Dropdown.Menu
            aria-label={dropdownLabel || "Actions"}
            className={cn("max-h-64 overflow-auto", scrollBarInvisible && "scrollbar-thin")}
          >
            {filteredItems.length === 0 ? (
              <EmptyState className="min-h-20 rounded-lg px-3 py-4 text-sm">
                {noResultsMessage}
              </EmptyState>
            ) : (
              filteredItems.map((item, idx) => {
                if (item.type === "separator") {
                  return <Separator key={`sep-${idx}`} className="my-1" />;
                }

                return (
                  <Dropdown.Item
                    id={`item-${idx}`}
                    key={`item-${idx}`}
                    isDisabled={item.disabled}
                    onAction={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                    className={cn(
                      "rounded-lg",
                      item.variant === "destructive"
                        ? "text-danger"
                        : "text-foreground",
                      item.isActive && "bg-accent",
                    )}
                  >
                    {item.buttonText}
                  </Dropdown.Item>
                );
              })
            )}
          </Dropdown.Menu>
        </div>
      </Dropdown.Popover>
    </Dropdown>
  );
}
