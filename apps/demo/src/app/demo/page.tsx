"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Table2, Play } from "lucide-react";

const sections = [
  {
    label: "Contacts table",
    href: "/demo/contacts",
    description: "Browse the mock contact table with drilldown.",
    icon: Table2,
  },
  {
    label: "Form playground",
    href: "/playground",
    description: "Preview the multi-step form schemas.",
    icon: Play,
  },
];

export default function DemoIndexPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10">
        <div className="space-y-3 text-center">
          <Badge variant="outline">Demo</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">
            Demo dashboard
          </h1>
          <p className="text-muted-foreground">
            Navigate between the playground forms and the contacts table.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group">
                <Card className="h-full transition-all hover:bg-accent/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <CardTitle className="mt-3">{section.label}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
