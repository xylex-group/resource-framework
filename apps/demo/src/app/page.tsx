import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Table2, FileText, Play } from "lucide-react";

const sections = [
  {
    title: "Resource forms demo",
    description:
      "Inspect the resource_forms table contract and render each stored schema through the shared form runtime.",
    href: "/demo/forms",
    badge: "Forms",
    icon: FileText,
  },
  {
    title: "Form playground",
    description:
      "Run the same forms from the resource_forms table in a playground-oriented layout.",
    href: "/playground",
    badge: "Playground",
    icon: Play,
  },
  {
    title: "Demo table",
    description:
      "Browse mock data through the ResourceTable and drilldown experience.",
    href: "/demo/contacts",
    badge: "Table",
    icon: Table2,
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <section className="mx-auto w-full max-w-3xl space-y-10">
        <div className="space-y-3 text-center">
          <Badge variant="outline" className="mb-2">
            Resource Framework
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Playground &amp; Table showcase
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Explore the reusable form engine and data grid that ship with the
            resource framework.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group">
                <Card className="h-full transition-all hover:bg-accent/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-muted">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <CardTitle className="mt-3">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
