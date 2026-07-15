"use client";

import { use, useEffect, useState } from "react";
import { Link } from "@heroui/react";
import { ResourceDrilldown } from "@rf/components/ResourceDrilldown";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { demoContactRows } from "@/lib/demo-contacts";
import type { DemoContact } from "@/lib/demo-contacts-db";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactDrilldownPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const seedContact = demoContactRows.find((row) => row.demo_contact_id === id);
  const [contact, setContact] = useState<Record<string, unknown> | null>(
    seedContact ? { ...seedContact } : null,
  );
  const [loading, setLoading] = useState(!seedContact);

  useEffect(() => {
    let cancelled = false;
    setLoading(!seedContact);
    void fetch(`/api/demo/contacts/${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ data: DemoContact }>;
      })
      .then((result) => {
        if (!cancelled && result?.data) setContact(result.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, seedContact]);
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="outline">Drilldown demo</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              Contact details
            </h1>
          </div>
          <Link href="/demo/contacts" className="inline-flex items-center gap-1 rounded-lg border border-default px-3 py-1.5 text-sm">
              <ArrowLeft className="size-3.5" />
              Back to table
          </Link>
        </div>
        {loading
          ? <Skeleton className="h-80 w-full rounded-xl" />
          : contact
          ? (
            <ResourceDrilldown
              resourceName="demo_contacts"
              resourceId={id}
              initialData={contact}
            />
          )
          : (
            <div className="rounded-xl border border-default p-8 text-sm text-muted-foreground">
              Contact not found.
            </div>
          )}
      </div>
    </div>
  );
}
