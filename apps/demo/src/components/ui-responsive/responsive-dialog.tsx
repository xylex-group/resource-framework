"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ResponsiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  disableMaxWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  classNames?: {
    title?: string;
    content?: string;
  };
}

export function ResponsiveDialog({
  isOpen,
  onClose,
  title,
  disableMaxWidth,
  className,
  classNames,
  children,
}: ResponsiveDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className={cn(
          "max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-2xl",
          disableMaxWidth ? "max-w-full" : "",
          className,
        )}
      >
        {title && (
          <div
            className={cn(
              "mb-3 text-lg font-semibold text-slate-100",
              classNames?.title,
            )}
          >
            {title}
          </div>
        )}
        <div className={classNames?.content}>{children}</div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
