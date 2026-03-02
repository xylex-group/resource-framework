import type { HTMLAttributes, ReactNode } from "react";

type DialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type DialogPartProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  forceFullScreen?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
};

export const Dialog = ({ children }: DialogProps) => (
  <div>{children}</div>
);

export const DialogPortal = ({ children }: DialogPartProps) => <>{children}</>;

export const DialogOverlay = ({
  children,
  className,
  ...props
}: DialogPartProps) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const DialogContent = ({
  children,
  className,
  onEscapeKeyDown,
  forceFullScreen,
  ...props
}: DialogPartProps) => {
  const contentClassName = forceFullScreen
    ? `${className ?? ""} fixed inset-0 z-50`
    : className;

  return (
    <div
      className={contentClassName}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onEscapeKeyDown?.(event.nativeEvent);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const DialogHeader = ({
  children,
  className,
  ...props
}: DialogPartProps) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const DialogFooter = ({
  children,
  className,
  ...props
}: DialogPartProps) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className, ...props }: DialogPartProps) => (
  <h2 className={className} {...props}>
    {children}
  </h2>
);
