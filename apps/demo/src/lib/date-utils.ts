export function formatUnixSecondsToDate(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return date.toISOString().slice(0, 10);
}

export function formatUnixSecondsToMonthDayTime(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return `${date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
