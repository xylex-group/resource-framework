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
    const details = description ? ` - ${description}` : "";
    console.log(
      `[notification] ${success ? "Success" : "Error"}: ${message}${details}`,
    );
    if (!success) {
      alert(description ? `${message}\n${description}` : message);
    }
  };

  return { notification };
}
