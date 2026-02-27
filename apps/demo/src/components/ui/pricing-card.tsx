"use client";

import { cn } from "@/lib/utils";

export interface PricingCardProps {
  value: string;
  title: string;
  price?: string;
  cadence?: string;
  features?: string[];
  badge?: string;
  footer?: string;
  selected?: boolean;
  onClickAction: () => void;
}

export function PricingCard({
  value,
  title,
  price,
  cadence,
  features = [],
  badge,
  footer,
  selected = false,
  onClickAction,
}: PricingCardProps) {
  return (
    <button
      type="button"
      onClick={onClickAction}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition hover:border-slate-500",
        selected
          ? "border-sky-500 bg-slate-900"
          : "border-slate-800 bg-slate-950/40",
      )}
      data-value={value}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-slate-100">{title}</span>
        {badge ? (
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-300">
            {badge}
          </span>
        ) : null}
      </div>
      {price || cadence ? (
        <p className="mt-1 text-sm text-slate-300">
          {price} {cadence ? `/${cadence}` : ""}
        </p>
      ) : null}
      {features.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          {features.map((feature) => (
            <li key={feature}>• {feature}</li>
          ))}
        </ul>
      )}
      {footer && (
        <p className="mt-2 text-xs text-slate-500">
          {footer}
        </p>
      )}
    </button>
  );
}
