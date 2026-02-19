"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveDropdownV2 } from "@/components/ui-responsive/responsive-dropdown-v2";
import { MoreHorizontal } from "lucide-react";
import { useMemo } from "react";
import type { MoreButtonProps } from "@/lib/stores";

type FlattenedMoreButton = MoreButtonProps & {
    indent: number;
};

const INDENT_SPACING = 2;

const flattenMoreButtons = (
    items: MoreButtonProps[] = [],
    indent = 0,
): FlattenedMoreButton[] => {
    const sortedItems = [...items].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    return sortedItems.flatMap((item) => {
        const current: FlattenedMoreButton = { ...item, indent };
        const children = flattenMoreButtons(item.children, indent + 1);
        return [current, ...children];
    });
};

export function ThreeDotsButton({ items }: { items?: MoreButtonProps[] }) {
    const flattenedItems = useMemo(
        () => flattenMoreButtons(items),
        [items],
    );

    if (flattenedItems.length === 0) return null;

    const dropdownItems = flattenedItems.map((item) => ({
        buttonText: `${"\u00A0".repeat(item.indent * INDENT_SPACING)}${
            item.label
        }`,
        buttonIcon: item.icon,
        onClick: item.onClick,
        disabled: item.disabled,
        className: "text-left",
        rightElement: item.hotkey ? (
            <span className="text-[11px] text-secondary tracking-[0.3em] uppercase">
                {item.hotkey}
            </span>
        ) : undefined,
    }));

    return (
        <ResponsiveDropdownV2
            dropdownLabel="More actions"
            items={dropdownItems}
            triggerButton={
                <Button
                    variant="icon_v2"
                    size="icon_v2"
                    title="More actions"
                    aria-label="More actions"
                >
                    <MoreHorizontal className="w-5 h-5 stroke-icon" />
                </Button>
            }
        />
    );
}
