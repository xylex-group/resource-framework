"use client";

export interface StatusDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface StatusBreakdownProps {
  data: StatusDataPoint[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  draft: "#64748b",
  paid: "#22c55e",
  overdue: "#ef4444",
  cancelled: "#8b5cf6",
  sent: "#3b82f6",
};

const DEFAULT_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#64748b",
];

function getColor(label: string, index: number): string {
  const normalizedLabel = label.toLowerCase();
  return (
    STATUS_COLORS[normalizedLabel] ||
    DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  );
}

export function StatusBreakdown({ data }: StatusBreakdownProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const segments = data.map((item, index) => ({
    ...item,
    color: getColor(item.label, index),
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));

  return (
    <div className="flex flex-col h-full w-full gap-3 justify-between">
      <div className="h-3 w-full rounded-xl overflow-hidden flex bg-muted/50">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="h-full first:rounded-l-xl last:rounded-r-xl transition-all duration-300"
            style={{
              width: `${segment.percentage}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {segments.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground capitalize">
                {item.label}
              </span>
            </div>
            <span className="text-sm font-medium tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-sm font-semibold tabular-nums">{total}</span>
      </div>
    </div>
  );
}
