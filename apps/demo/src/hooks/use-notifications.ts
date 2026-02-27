"use client";

export interface NotificationOptions {
  message: string;
  success?: boolean;
}

export type UseNotificationOptions = NotificationOptions;

export function useNotification() {
  const notification = ({ message, success = true }: NotificationOptions) => {
    console.log(
      `[notification] ${success ? "Success" : "Error"}: ${message}`,
    );
    if (!success) {
      alert(message);
    }
  };

  return { notification };
}
