"use client";

import Link from "next/link";
import { ResourceDrilldown } from "@rf/components/ResourceDrilldown";

export default function ContactDrilldownPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params?.id;
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Drilldown demo
            </p>
            <h1 className="text-3xl font-semibold">Contact details</h1>
          </div>
          <Link
            href="/demo/contacts"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            Back to table
          </Link>
        </div>
        <ResourceDrilldown resourceName="demo_contacts" resourceId={id} />
      </div>
    </div>
  );
}
