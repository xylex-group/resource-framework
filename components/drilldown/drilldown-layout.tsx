"use client";

import * as Lucide from "lucide-react";
import React, { ComponentType, SVGProps } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DrilldownLayoutProps {
  title: string | ReactNode;
  subtitle?: ReactNode;
  status?: string;
  backLink?: {
    href: string;
    label: string;
  };
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  main?: ReactNode;
  avatarUrl?: string;
  iconName?: string;
  paddingBottom?: number;
}

export function DrilldownLayout({
  title,
  subtitle,
  status,
  backLink: _backLink,
  actions,
  children,
  className,
  main: _main,
  avatarUrl,
  iconName,
  paddingBottom,
}: DrilldownLayoutProps) {
  return (
    <div
      id="drilldown-layout-root"
      className={cn(className)}
      style={{
        paddingBottom: paddingBottom ? `${paddingBottom}px` : undefined,
      }}
    >
      <div
        id="drilldown-layout-container"
        className="mx-auto flex max-w-7xl flex-col gap-y-2"
      >
        <div className="flex flex-col flex-wrap justify-between gap-10 px-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              {avatarUrl
                ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-25 w-25 rounded-sm border object-cover"
                  />
                )
                : iconName &&
                    (Lucide as unknown as Record<
                      string,
                      ComponentType<SVGProps<SVGSVGElement>>
                    >)?.[iconName]
                ? (
                  (() => {
                    const IconComp = (Lucide as unknown as Record<
                      string,
                      ComponentType<SVGProps<SVGSVGElement>>
                    >)[
                      iconName
                    ];
                    return (
                      <IconComp className="h-25 w-25 rounded-sm border p-4" />
                    );
                  })()
                )
                : null}
              <h1 className="text-xl font-bold text-primary sm:text-2xl">
                {title}
              </h1>
              {status && (
                <Badge
                  variant={status as
                    | "default"
                    | "secondary"
                    | "destructive"
                    | "outline"}
                />
              )}
            </div>
            {subtitle && (
              <div
                id="drilldown-layout-subtitle"
                className="text-primary"
              >
                {subtitle}
              </div>
            )}
          </div>
          {actions && (
            <div
              id="drilldown-layout-actions-slot"
              className="flex items-center gap-2"
            >
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
