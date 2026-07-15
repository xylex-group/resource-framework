import { NextResponse } from "next/server";
import { getDemoDatabase, type DemoContact } from "@/lib/demo-contacts-db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const contact = await getDemoDatabase()
    .prepare("SELECT * FROM demo_contacts WHERE demo_contact_id = ? LIMIT 1")
    .bind(id)
    .first<DemoContact>();

  if (!contact) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }
  return NextResponse.json({ data: contact });
}
