"use client";

import { Alert, Button } from "@heroui/react";

export interface ErrorBlockProps {
  type?: "error" | "info";
  title?: string;
  content?: string;
  fullPage?: boolean;
  isError?: boolean;
  setIsError?: (value: boolean) => void;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorBlock({
  title,
  content,
  fullPage,
  onRetry,
  className,
}: ErrorBlockProps) {
  return (
    <div className={fullPage ? "flex min-h-52 items-center justify-center p-6" : "w-full"}>
      <Alert className={`w-full rounded-xl ${className ?? ""}`} status="danger">
        <Alert.Indicator />
        <Alert.Content>
          {title ? <Alert.Title>{title}</Alert.Title> : null}
          {content ? <Alert.Description>{content}</Alert.Description> : null}
          {onRetry ? (
            <Button className="mt-3" onPress={onRetry} size="sm" variant="secondary">
              Retry
            </Button>
          ) : null}
        </Alert.Content>
      </Alert>
    </div>
  );
}
