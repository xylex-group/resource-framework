/**
 * Helper to resolve nested payload values using dot notation keys.
 */
const resolveDrilldownPayloadValue = (
  payload: Record<string, unknown>,
  key: string,
): unknown => {
  const trimmed = key.trim();
  if (!trimmed) return undefined;
  if (!trimmed.includes(".")) {
    return payload[trimmed];
  }
  return trimmed.split(".").reduce((obj: Record<string, unknown>, part) => {
    if (obj && typeof obj === "object" && part in obj) {
      return obj[part] as Record<string, unknown>;
    }
    return {} as Record<string, unknown>;
  }, payload);
};

export const interpolateDrilldownTemplate = (
  template: string,
  payload: Record<string, unknown>,
): string => {
  return template.replace(/\{\{(.*?)\}\}/g, (_, raw) => {
    const key = String(raw || "");
    const value = resolveDrilldownPayloadValue(payload, key);
    return encodeURIComponent(String(value ?? ""));
  });
};

