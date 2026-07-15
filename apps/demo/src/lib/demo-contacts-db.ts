import { getCloudflareContext } from "@opennextjs/cloudflare";

export type DemoContact = {
  demo_contact_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  contact_number: string | null;
  home_country: string | null;
  preferred_channel: string | null;
  notes: string | null;
  company_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
};

export function getDemoDatabase(): D1Database {
  return getCloudflareContext().env.RESOURCE_FRAMEWORK_DEMO;
}

export function cleanOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

export function requireText(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  const cleaned = cleanOptionalText(value, maxLength);
  if (!cleaned) throw new Error(`${label} is required.`);
  return cleaned;
}
