"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabDefinition {
  label: string;
  content: ReactNode;
  key?: string | number;
}

export interface TabsWithContentProps {
  tabs: TabDefinition[];
  activeIndex: number;
  onTabChange: (index: number) => void;
}

export default function TabsWithContent({
  tabs,
  activeIndex,
  onTabChange,
}: TabsWithContentProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {tabs.map((tab, idx) => (
          <button
            key={tab.key ?? idx}
            type="button"
            className={cn(
              "rounded-sm px-3 py-1 text-sm font-semibold transition",
              idx === activeIndex
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white",
            )}
            onClick={() => onTabChange(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeIndex]?.content}</div>
    </div>
  );
}
