"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { EntityFormV2 } from "@xylex-group/resource-framework";
import { playgroundFormDefinitions } from "@xylex-group/resource-framework";

export default function PlaygroundPage() {
  const [selectedFormId, setSelectedFormId] = useState(
    playgroundFormDefinitions[0]?.id,
  );
  const selected = useMemo(
    () =>
      playgroundFormDefinitions.find((form) => form.id === selectedFormId) ??
      playgroundFormDefinitions[0],
    [selectedFormId],
  );

  const [values, setValues] = useState<Record<string, unknown>>(() =>
    selected?.defaultValues ? { ...selected.defaultValues } : {},
  );

  useEffect(() => {
    setValues(selected?.defaultValues ? { ...selected.defaultValues } : {});
  }, [selected]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <header className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-slate-500">
            Resource Framework
          </p>
          <h1 className="text-4xl font-semibold">Form playground</h1>
          <p className="text-slate-400">
            Explore pre-configured schemas and try out EntityFormV2 in a
            sandbox.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold text-slate-100">
              Available forms
            </h2>
            <div className="space-y-2">
              {playgroundFormDefinitions.map((form) => (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => setSelectedFormId(form.id)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left transition",
                    form.id === selectedFormId
                      ? "border-sky-500 bg-slate-900"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-600",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">
                      {form.title}
                    </span>
                    <span className="text-xs text-slate-400 uppercase">
                      {form.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {form.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-900/40">
            <div className="mb-4 space-y-1">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Selected form
              </p>
              <h2 className="text-2xl font-semibold text-slate-100">
                {selected?.title}
              </h2>
              <p className="text-sm text-slate-400">{selected?.description}</p>
            </div>
            {selected ? (
              <EntityFormV2
                schema={selected.schema}
                values={{ ...values }}
                onChange={(key, value) => {
                  setValues((prev) => ({
                    ...prev,
                    [key]: value,
                  }));
                }}
                onSubmit={() => {
                  console.log("Submitted form values:", values);
                  alert("Submitted! Check console for values.");
                }}
              />
            ) : (
              <p className="text-sm text-slate-400">Select a form to begin.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
