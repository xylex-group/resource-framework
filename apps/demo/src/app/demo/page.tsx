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
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="mx-auto w-full max-w-3xl space-y-12 py-14">
        <div className="space-y-5 text-center">
          <Badge variant="outline" className="px-3 py-1">Demo</Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            Demo dashboard
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Navigate between the playground forms and the contacts table.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group">
                <Card className="h-full transition-all duration-200 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-base">{section.label}</CardTitle>
                      <CardDescription className="leading-relaxed">{section.description}</CardDescription>
                    </div>
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
