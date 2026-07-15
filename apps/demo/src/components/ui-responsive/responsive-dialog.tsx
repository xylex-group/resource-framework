"use client";

import { Button, Modal } from "@heroui/react";
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
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container
          placement="center"
          scroll="inside"
          size={disableMaxWidth ? "full" : "lg"}
        >
          <Modal.Dialog className={cn("max-h-[90vh] rounded-xl", className)}>
            {title ? (
              <Modal.Header>
                <Modal.Heading className={classNames?.title}>{title}</Modal.Heading>
              </Modal.Header>
            ) : null}
            <Modal.Body className={classNames?.content}>{children}</Modal.Body>
            <Modal.Footer>
              <Button onPress={onClose} variant="secondary">Close</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
