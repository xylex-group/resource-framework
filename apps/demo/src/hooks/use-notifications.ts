"use client";

import { toast } from "sonner";

export interface NotificationOptions {
  message: string;
  description?: string;
  success?: boolean;
}

export type UseNotificationOptions = NotificationOptions;

export function useNotification() {
  const notification = ({
    message,
    description,
    success = true,
  }: NotificationOptions) => {
    const options = description ? { description } : undefined;
    if (success) toast.success(message, options);
    else toast.error(message, options);
  };

  return { notification };
}
