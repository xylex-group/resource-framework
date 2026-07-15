export type PriorityTypes = 0 | 1 | 2 | 3 | 4;

const priorityLabels = {
  0: "No Priority",
  1: "Low Priority",
  2: "Medium Priority",
  3: "High Priority",
  4: "Urgent Priority",
} as const;

/**
 * Converts string or number priority to a numeric priority type
 * @param p - Priority value (number or string like 'low', 'medium', 'high', 'urgent')
 * @returns Numeric priority value between 0-4
 */
export const stringPriorityToNumber = (p: unknown): PriorityTypes => {
  if (typeof p === "number") {
    return Math.max(0, Math.min(4, p)) as PriorityTypes;
  }
  const v = String(p || "").toLowerCase();
  if (v === "low") return 1 as PriorityTypes;
  if (v === "medium") return 2 as PriorityTypes;
  if (v === "high") return 3 as PriorityTypes;
  if (v === "urgent") return 4 as PriorityTypes;
  return 0 as PriorityTypes;
};

/**
 * Gets the display label for a priority value
 * @param priority - Numeric priority value (0-4)
 * @returns Human-readable priority label
 */
export const getPriorityLabel = (priority: PriorityTypes): string => {
  return priorityLabels[priority as keyof typeof priorityLabels] ||
    "No Priority";
};
