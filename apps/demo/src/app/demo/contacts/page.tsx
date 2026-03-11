"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ResourceTable } from "@rf/components/ResourceTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function DemoContactsPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline">Resource table demo</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Contacts</h1>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/playground">
              <ArrowLeft className="size-3.5" />
              Back to playground
            </Link>
          </Button>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Loading contacts&hellip;
                </p>
              </CardContent>
            </Card>
          }
        >
          <ResourceTable resourceName="demo_contacts" />
        </Suspense>
      </div>
    </div>
  );
}
