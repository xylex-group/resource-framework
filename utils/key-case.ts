export function toCamelCase(input: string): string {
  return String(input || "").replace(/_([a-z])/g, (_m, c: string) =>
    String(c).toUpperCase(),
  );
}

export function toSnakeCase(input: string): string {
  const s = String(input || "");
  return s
    .replace(/[-\s]+/g, "_")
    .replace(/([A-Z])/g, "_$1")
    .replace(/__+/g, "_")
    .toLowerCase();
}

export function getValueByKeyCase(
  obj: Record<string, unknown> | null | undefined,
  key: string,
): unknown {
  if (!obj) return undefined;
  const raw = String(key || "").trim();
  if (!raw) return undefined;

  if (raw in obj) return obj[raw];

  const camel = toCamelCase(raw);
  if (camel !== raw && camel in obj) return obj[camel];

  const snake = toSnakeCase(raw);
  if (snake !== raw && snake in obj) return obj[snake];

  return undefined;
}

export function getValueByPathCase(
  obj: Record<string, unknown> | null | undefined,
  path: string,
): unknown {
  if (!obj) return undefined;
  const p = String(path || "").trim();
  if (!p) return undefined;

  return p.split(".").reduce<unknown>((acc, part) => {
    if (acc == null) return undefined;
    if (typeof acc !== "object") return undefined;
    return getValueByKeyCase(acc as Record<string, unknown>, part);
  }, obj);
}


