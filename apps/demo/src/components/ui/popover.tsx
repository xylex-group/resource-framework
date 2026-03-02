"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover components must be used inside Popover");
  }
  return context;
}

export function Popover({
  children,
  open,
  isOpen,
  onOpenChange,
}: {
  children: ReactNode;
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlledOpen = typeof isOpen === "boolean" ? isOpen : open;
  const resolvedOpen = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (typeof controlledOpen !== "boolean") {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <PopoverContext.Provider value={{ open: resolvedOpen, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({
  children,
  asChild = false,
}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  const { open, setOpen } = usePopoverContext();

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: () => void }>;
    return cloneElement(child, {
      onClick: () => {
        setOpen(!open);
        child.props.onClick?.();
      },
    });
  }

  return (
    <button type="button" onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

export function PopoverContent({
  children,
  className,
  placement = "bottom",
}: {
  children: ReactNode;
  className?: string;
  placement?: "top" | "bottom";
}) {
  const { open } = usePopoverContext();
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-20 min-w-56 rounded-sm border border-slate-700 bg-slate-950 shadow-lg",
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
