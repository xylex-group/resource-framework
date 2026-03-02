"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ResourceTable } from "@rf/components/ResourceTable";

export default function DemoContactsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500 tracking-[0.3em]">
              Resource table demo
            </p>
            <h1 className="text-3xl font-semibold">Contacts</h1>
          </div>
          <Link
            href="/playground"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            Back to playground
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
              Loading contacts...
            </div>
          }
        >
          <ResourceTable resourceName="demo_contacts" />
        </Suspense>
      </div>
    </div>
  );
}
