import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DrilldownTableProps {
  children: ReactNode;
  className?: string;
}

export function DrilldownTable({ children, className }: DrilldownTableProps) {
  return (
    <div
      id="drilldown-table-wrapper"
      className={cn("w-full overflow-x-auto", className)}
    >
      <table
        id="drilldown-table-main"
        className="w-full min-w-full table-auto border-collapse"
      >
        {children}
      </table>
    </div>
  );
}

interface DrilldownTableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DrilldownTableHeader({
  children,
  className,
}: DrilldownTableHeaderProps) {
  return (
    <thead className={cn(className, "text-xs sm:text-sm")}>{children}</thead>
  );
}

interface DrilldownTableBodyProps {
  children: ReactNode;
  className?: string;
}

export function DrilldownTableBody({
  children,
  className,
}: DrilldownTableBodyProps) {
  return (
    <tbody className={cn(className, "text-xs sm:text-sm")}>{children}</tbody>
  );
}

interface DrilldownTableFooterProps {
  children: ReactNode;
  className?: string;
}

export function DrilldownTableFooter({
  children,
  className,
}: DrilldownTableFooterProps) {
  return (
    <tfoot className={cn(className, "text-xs sm:text-sm")}>{children}</tfoot>
  );
}

interface DrilldownTableRowProps {
  children: ReactNode;
  className?: string;
}

export function DrilldownTableRow({
  children,
  className,
}: DrilldownTableRowProps) {
  return (
    <tr className={cn("border-b text-xs sm:text-sm", className)}>{children}</tr>
  );
}

interface DrilldownTableCellProps {
  children?: ReactNode;
  header?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  colSpan?: number;
  isCurrency?: boolean;
  noWrap?: boolean;
}

export function DrilldownTableCell({
  children,
  header = false,
  align = "left",
  className,
  colSpan,
  isCurrency = false,
  noWrap = false,
}: DrilldownTableCellProps) {
  const Component = header ? "th" : "td";
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <Component
      className={cn(
        "wrap-break-word px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm ",
        header && " font-medium text-primary",
        alignClass[align],
        className,
        isCurrency && "font-jetbrains-mono ",
        noWrap && "text-nowrap",
      )}
      colSpan={colSpan}
      id={"drilldown-table-cell"}
    >
      {children}
    </Component>
  );
}
