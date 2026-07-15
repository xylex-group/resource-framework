"use client";

import { Button, Chip } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

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
    <Button
      className="h-auto w-full justify-start rounded-xl p-0 text-left"
      data-value={value}
      onPress={onClickAction}
      variant="ghost"
    >
      <Card
        className={cn(
          "w-full p-4 text-left transition-colors",
          selected && "ring-2 ring-focus",
        )}
        variant={selected ? "secondary" : "default"}
      >
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">{title}</span>
          {badge ? <Chip size="sm" variant="soft">{badge}</Chip> : null}
        </div>
        {price || cadence ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {price} {cadence ? `/${cadence}` : ""}
          </p>
        ) : null}
        {features.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        ) : null}
        {footer ? <p className="mt-2 text-xs text-muted-foreground">{footer}</p> : null}
      </Card>
    </Button>
  );
}
