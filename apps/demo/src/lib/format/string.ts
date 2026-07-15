export function prettyString(value?: string | number | null) {
  if (value === undefined || value === null) return "";
  const normalized = value.toString().replace(/[_-]+/g, " ").trim();
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}
