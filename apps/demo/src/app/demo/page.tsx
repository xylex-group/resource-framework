"use client";

import Link from "next/link";

export default function DemoIndexPage() {
  const sections = [
    {
      label: "Contacts table",
      href: "/demo/contacts",
      description: "Browse the mock contact table with drilldown."
    },
    {
      label: "Form playground",
      href: "/playground",
      description: "Preview the multi-step form schemas."
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Resource framework demo
          </p>
          <h1 className="text-4xl font-semibold">Demo dashboard</h1>
          <p className="text-slate-400">
            Navigate between the Playground forms and the contacts table.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-600"
            >
              <h2 className="text-xl font-semibold text-white">{section.label}</h2>
              <p className="mt-1 text-sm text-slate-400">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
