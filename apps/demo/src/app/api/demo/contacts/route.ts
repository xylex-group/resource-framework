import { NextResponse } from "next/server";
import {
  cleanOptionalText,
  getDemoDatabase,
  requireText,
  type DemoContact,
} from "@/lib/demo-contacts-db";

export async function GET() {
  const result = await getDemoDatabase()
    .prepare("SELECT * FROM demo_contacts ORDER BY updated_at DESC")
    .all<DemoContact>();
  return NextResponse.json({ data: result.results });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const now = new Date().toISOString();
    const contact: DemoContact = {
      demo_contact_id: crypto.randomUUID(),
      first_name: requireText(payload.first_name, "First name", 100),
      last_name: requireText(payload.last_name, "Last name", 100),
      email_address: requireText(payload.email_address, "Email address", 254),
      contact_number: cleanOptionalText(payload.contact_number, 50),
      home_country: cleanOptionalText(payload.home_country, 2),
      preferred_channel: cleanOptionalText(payload.preferred_channel, 30),
      notes: cleanOptionalText(payload.notes, 2000),
      company_id: "demo-company",
      organization_id: "demo-organization",
      created_at: now,
      updated_at: now,
    };

    await getDemoDatabase().prepare(`
      INSERT INTO demo_contacts (
        demo_contact_id, first_name, last_name, email_address, contact_number,
        home_country, preferred_channel, notes, company_id, organization_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      contact.demo_contact_id,
      contact.first_name,
      contact.last_name,
      contact.email_address,
      contact.contact_number,
      contact.home_country,
      contact.preferred_channel,
      contact.notes,
      contact.company_id,
      contact.organization_id,
      contact.created_at,
      contact.updated_at,
    ).run();

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not create contact.",
    }, { status: 400 });
  }
}
