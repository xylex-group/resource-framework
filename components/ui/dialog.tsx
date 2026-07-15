"use client";

import { Modal } from "@heroui/react";
import type { ComponentProps, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

export interface DialogProps extends Omit<ComponentProps<typeof Modal>, "isOpen"> {
  open?: boolean;
}

export function Dialog({ open, ...props }: DialogProps) {
  return <Modal {...props} isOpen={open} />;
}

export interface DialogContentProps extends Omit<ComponentProps<typeof Modal.Dialog>, "children" | "onKeyDown"> {
  children?: ReactNode;
  forceFullScreen?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}

export function DialogContent({ children, className, forceFullScreen, onEscapeKeyDown, ...props }: DialogContentProps) {
  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Escape") {
      onEscapeKeyDown?.(event.nativeEvent);
    }
  };

  return (
    <Modal.Backdrop className="bg-black/60">
      <Modal.Container
        className={forceFullScreen ? "h-dvh max-h-dvh w-screen max-w-none p-0" : undefined}
        placement="center"
        size={forceFullScreen ? "full" : "lg"}
      >
        <Modal.Dialog
          {...props}
          className={forceFullScreen ? `h-dvh w-screen max-w-none rounded-none ${className ?? ""}` : className}
        >
          <div className="contents" onKeyDown={handleKeyDown}>
            {children}
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export const DialogHeader = Modal.Header;
export const DialogFooter = Modal.Footer;
export const DialogTitle = Modal.Heading;
