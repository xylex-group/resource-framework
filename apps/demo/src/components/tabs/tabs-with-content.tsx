"use client";

import { Tabs } from "@heroui/react";
import type { ReactNode } from "react";

interface TabDefinition {
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
    <Tabs
      selectedKey={String(activeIndex)}
      onSelectionChange={(key) => onTabChange(Number(key))}
      variant="secondary"
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="Sections">
        {tabs.map((tab, idx) => (
          <Tabs.Tab
            id={String(idx)}
            key={tab.key ?? idx}
          >
            {tab.label}
            <Tabs.Indicator />
          </Tabs.Tab>
        ))}
        </Tabs.List>
      </Tabs.ListContainer>
      {tabs.map((tab, idx) => (
        <Tabs.Panel id={String(idx)} key={tab.key ?? idx}>
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
