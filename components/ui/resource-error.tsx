"use client";

import { Alert, Button } from "@heroui/react";

export interface ResourceErrorProps {
  content: string;
  fullPage?: boolean;
  onRetry?: () => void;
  title: string;
}

export function ResourceError({
  content,
  fullPage = false,
  onRetry,
  title,
}: ResourceErrorProps) {
  return (
    <div className={fullPage ? "flex min-h-72 items-center justify-center p-6" : "p-3"}>
      <Alert className="w-full max-w-2xl rounded-xl" status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{title}</Alert.Title>
          <Alert.Description>{content}</Alert.Description>
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
