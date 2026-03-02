"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Info,
  Loader2,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PriorityIcon({
  priority,
  className,
  ...props
}: { priority?: number } & LucideProps) {
  const tone =
    priority != null && priority >= 4
      ? "text-red-400"
      : priority != null && priority >= 3
        ? "text-amber-400"
        : "text-slate-300";

  return <Flag className={cn(tone, className)} {...props} />;
}

export const InformationIcon = Info;
export const CircleWarning = AlertCircle;
export const TriangleWarning = AlertTriangle;
export const CircleCheck = CheckCircle2;
export { Loader2 };
