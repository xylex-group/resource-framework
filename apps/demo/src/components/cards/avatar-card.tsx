"use client";

import { cn } from "@/lib/utils";

export function AvatarCard({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2", className)}>
      <div className="h-8 w-8 rounded-full bg-slate-700" />
      <span className="text-sm font-medium text-slate-200">{children}</span>
    </div>
  );
}
