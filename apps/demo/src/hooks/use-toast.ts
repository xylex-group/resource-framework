"use client";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "success" | "destructive" | string;
};

export function useToast() {
  const notify = (_options: ToastOptions) => undefined;

  return { toast: notify };
}
