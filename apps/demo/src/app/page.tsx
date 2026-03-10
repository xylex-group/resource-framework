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
    icon: FileText,
  },
  {
    title: "Form playground",
    description:
      "Run the same forms from the resource_forms table in a playground-oriented layout.",
    href: "/playground",
    icon: Play,
  },
  {
    title: "Demo table",
    description:
      "Browse mock data through the ResourceTable and drilldown experience.",
    href: "/demo/contacts",
    icon: Table2,
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <section className="mx-auto w-full max-w-4xl space-y-12">
        <div className="space-y-4 text-center">
          <Badge variant="outline" className="px-3 py-1">
            Resource Framework
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight">
            Playground &amp; Table showcase
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Explore the reusable form engine and data grid that ship with the
            resource framework.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group">
                <Card className="h-full transition-colors duration-200 hover:bg-accent">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex size-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: "#27272a" }}
                      >
                        <Icon className="size-5 text-primary" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <div className="space-y-2">
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
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
