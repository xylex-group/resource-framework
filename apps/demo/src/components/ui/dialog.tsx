import type { HTMLAttributes, ReactNode } from "react";

type DialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type DialogPartProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
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
