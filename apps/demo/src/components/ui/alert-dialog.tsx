import {
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type AlertDialogProps = {
  children: ReactNode;
};

type AlertDialogPartProps = {
  children?: ReactNode;
  className?: string;
};

export function AlertDialog({ children }: AlertDialogProps) {
  return <>{children}</>;
}

export function AlertDialogTrigger({
  children,
  asChild,
  ...props
}: AlertDialogPartProps & HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    return cloneElement(child, {
      ...props,
      ...child.props,
    });
  }
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

export function AlertDialogContent({
  children,
  className,
  ...props
}: AlertDialogPartProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function AlertDialogDescription({
  children,
}: AlertDialogPartProps) {
  return <div>{children}</div>;
}

export function AlertDialogHeader({
  children,
}: AlertDialogPartProps) {
  return <div>{children}</div>;
}

export function AlertDialogFooter({
  children,
}: AlertDialogPartProps) {
  return <div>{children}</div>;
}

export function AlertDialogTitle({
  children,
}: AlertDialogPartProps) {
  return <h2>{children}</h2>;
}

export function AlertDialogCancel({
  children,
}: AlertDialogPartProps & HTMLAttributes<HTMLButtonElement>) {
  return <button type="button">{children}</button>;
}

export function AlertDialogAction({
  children,
  ...props
}: AlertDialogPartProps & HTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}
