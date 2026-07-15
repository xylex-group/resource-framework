"use client";

import { Button as HeroUIButton, Modal } from "@heroui/react";
import { createContext, useContext } from "react";
import type { ComponentProps, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

type DialogState = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DialogContext = createContext<DialogState>({ open: false });

export interface DialogProps extends Omit<ComponentProps<typeof Modal>, "isOpen" | "onOpenChange"> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ open = false, onOpenChange, children, ...props }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <Modal {...props}>
        <HeroUIButton className="hidden" aria-hidden="true">
          Open dialog
        </HeroUIButton>
        {children}
      </Modal>
    </DialogContext.Provider>
  );
}

export interface DialogContentProps extends Omit<ComponentProps<typeof Modal.Dialog>, "children" | "onKeyDown"> {
  children?: ReactNode;
  forceFullScreen?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}

export function DialogContent({ children, className, forceFullScreen, onEscapeKeyDown, ...props }: DialogContentProps) {
  const { open, onOpenChange } = useContext(DialogContext);
  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Escape") {
      onEscapeKeyDown?.(event.nativeEvent);
    }
  };

  return (
    <Modal.Backdrop
      className="bg-black/60"
      isOpen={open}
      onOpenChange={onOpenChange}
    >
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
