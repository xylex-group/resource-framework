export function formatDateLabel(
  dateStr: string,
  options?: { showYear?: boolean },
): string {
  if (!dateStr) return "";

  const showYear = options?.showYear ?? false;

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
    const parsed = new Date(dateStr.replace(" ", "T"));
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...(showYear && { year: "numeric" }),
      });
    }
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateStr)) {
    const parsed = new Date(dateStr.replace(" ", "T"));
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...(showYear && { year: "numeric" }),
      });
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(showYear && { year: "numeric" }),
    });
  }

  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [y, m] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleString(undefined, { year: "numeric", month: "short" });
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;

  const hasTime = /T|\d{2}:\d{2}/.test(dateStr);
  return hasTime
    ? parsed.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...(showYear && { year: "numeric" }),
      })
    : parsed.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(showYear && { year: "numeric" }),
      });
}

export function formatChartValue(
  value: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  },
): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "number") {
    return value.toLocaleString(options?.locale ?? "en-US", {
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    });
  }

  return String(value);
}
