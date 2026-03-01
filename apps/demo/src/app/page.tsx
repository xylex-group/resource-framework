import Link from "next/link";

const sections = [
  {
    title: "Resource forms demo",
    description: "Inspect the `resource_forms` table contract and render each stored schema through the shared form runtime.",
    href: "/demo/forms"
  },
  {
    title: "Form playground",
    description: "Run the same forms from the `resource_forms` table in a playground-oriented layout.",
    href: "/playground"
  },
  {
    title: "Demo table",
    description: "Browse mock data through the ResourceTable and drilldown experience.",
    href: "/demo/contacts"
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <section className="mx-auto max-w-4xl space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Resource framework demo</p>
        <h1 className="text-4xl font-bold">
          Playground + Table showcase
        </h1>
        <p className="text-lg text-slate-300">
          Explore the reusable form engine and data grid that ship with the resource framework.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:border-slate-600"
            >
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="text-slate-400 mt-2">{section.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
