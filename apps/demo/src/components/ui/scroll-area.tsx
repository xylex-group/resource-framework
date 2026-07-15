"use client";

import { ScrollShadow } from "@heroui/react";
import type { ComponentProps } from "react";

export function ScrollArea(props: ComponentProps<typeof ScrollShadow>) {
  return <ScrollShadow {...props} orientation="vertical" />;
}
