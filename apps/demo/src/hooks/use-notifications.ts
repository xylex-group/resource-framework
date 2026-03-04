"use client";

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
    if (!success) {
      alert(description ? `${message}\n${description}` : message);
    }
  };

  return { notification };
}
