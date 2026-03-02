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

type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used inside DropdownMenu");
  }
  return context;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger(
  { children, asChild = false }: { children: ReactNode; asChild?: boolean },
) {
  const { open, setOpen } = useDropdownContext();

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

export function DropdownMenuContent({
  children,
  className,
  align,
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
}) {
  const { open } = useDropdownContext();
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-20 mt-2 min-w-40 rounded-sm border border-slate-700 bg-slate-950 p-1 shadow-lg",
        align === "start" ? "left-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "right-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const { setOpen } = useDropdownContext();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1 text-left text-sm text-slate-100 hover:bg-slate-800",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
