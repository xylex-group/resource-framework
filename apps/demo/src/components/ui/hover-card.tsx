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

type HoverCardContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext() {
  const context = useContext(HoverCardContext);
  if (!context) {
    throw new Error("HoverCard components must be used inside HoverCard");
  }
  return context;
}

export function HoverCard({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <HoverCardContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </HoverCardContext.Provider>
  );
}

export function HoverCardTrigger(
  { children, asChild = false }: { children: ReactNode; asChild?: boolean },
) {
  const { setOpen } = useHoverCardContext();

  const triggerProps = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      onMouseEnter?: () => void;
      onMouseLeave?: () => void;
      onFocus?: () => void;
      onBlur?: () => void;
    }>;

    return cloneElement(child, {
      onMouseEnter: () => {
        triggerProps.onMouseEnter();
        child.props.onMouseEnter?.();
      },
      onMouseLeave: () => {
        triggerProps.onMouseLeave();
        child.props.onMouseLeave?.();
      },
      onFocus: () => {
        triggerProps.onFocus();
        child.props.onFocus?.();
      },
      onBlur: () => {
        triggerProps.onBlur();
        child.props.onBlur?.();
      },
    });
  }

  return <button type="button" {...triggerProps}>{children}</button>;
}

export function HoverCardContent({
  children,
  className,
  align = "center",
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const { open, setOpen } = useHoverCardContext();
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-20 mt-2 rounded-sm border border-slate-700 bg-slate-950 p-2 shadow-lg",
        align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2",
        className,
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </div>
  );
}
