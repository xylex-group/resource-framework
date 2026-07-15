"use client";

import { Suspense, useEffect, useState } from "react";
import { Link } from "@heroui/react";
import { ResourceTable } from "@rf/components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { demoContactRows } from "@/lib/demo-contacts";
import type { DemoContact } from "@/lib/demo-contacts-db";

async function createDemoContact(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await fetch("/api/demo/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json() as {
    data?: DemoContact;
    error?: string;
  };
  if (!response.ok || !result.data) {
    throw new Error(result.error || "Could not create contact.");
  }
  return result.data;
}

export default function DemoContactsPage() {
  const [contacts, setContacts] = useState<Record<string, unknown>[]>(() =>
    demoContactRows.map((row) => ({ ...row }))
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/demo/contacts")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load demo contacts.");
        return response.json() as Promise<{ data: DemoContact[] }>;
      })
      .then((result) => {
        if (!cancelled) setContacts(result.data);
      })
      .catch(() => {
        // The seeded rows keep local development useful before D1 is initialized.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline">Resource table demo</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Contacts</h1>
          </div>
          <Link href="/playground" className="inline-flex items-center gap-1 rounded-lg border border-default px-3 py-1.5 text-sm">
              <ArrowLeft className="size-3.5" />
              Back to playground
          </Link>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Loading contacts&hellip;
                </p>
              </CardContent>
            </Card>
          }
        >
          <ResourceTable
            resourceName="demo_contacts"
            initialData={contacts}
            createAction={createDemoContact}
          />
        </Suspense>
      </div>
    </div>
  );
}
