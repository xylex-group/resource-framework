"use client";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "success" | "destructive" | string;
};

export function useToast() {
  const notify = (options: ToastOptions) => {
    console.log(
      `[toast] ${options.title || "[no title]"} - ${options.description || ""} (${options.variant || "info"})`,
    );
  };

  return { toast: notify };
}
