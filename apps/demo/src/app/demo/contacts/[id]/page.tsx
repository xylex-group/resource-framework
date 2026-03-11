"use client";

import Link from "next/link";
import { ResourceDrilldown } from "@rf/components/ResourceDrilldown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function ContactDrilldownPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params?.id;
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/demo/contacts">
              <ArrowLeft className="size-3.5" />
              Back to table
            </Link>
          </Button>
        </div>
        <ResourceDrilldown resourceName="demo_contacts" resourceId={id} />
      </div>
    </div>
  );
}
