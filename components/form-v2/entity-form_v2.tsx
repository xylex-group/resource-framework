"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { KycReviewCard } from "./kyc-review";
import { FormFieldV2 } from "./form-field_v2";
import type {
  ResourceFormField,
  ResourceFormSchema,
} from "../../types/resource-forms";
import { getOrderedResourceFormSteps } from "../../utils/resource-forms";

interface EntityFormV2Props {
  schema: ResourceFormSchema;
  values: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  onSubmit: () => void;
  onStepChange?: (stepIndex: number, stepKey: string) => void;
  isSubmitting?: boolean;
}

export function EntityFormV2({
  schema,
  values,
  errors,
  onChange,
  onSubmit,
  onStepChange,
  isSubmitting = false,
}: EntityFormV2Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const stepValue = values?.step;

    if (!schema || !schema.steps || !stepValue) {
      return 0;
    }

    const entries = getOrderedResourceFormSteps(schema);

    const targetIndex = entries.findIndex(
      ([name]) => name === String(stepValue),
    );

    if (targetIndex < 0) {
      return 0;
    }

    return targetIndex;
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const orderedStepEntries = getOrderedResourceFormSteps(schema);

  const [currentStepName, currentStepFields] = orderedStepEntries[
    currentStepIndex
  ] ?? ["", [] as ResourceFormField[]];

  const isFieldMissing = (
    field: ResourceFormField,
    data: Record<string, unknown>,
  ) => {
    const required = field.required;
    if (!required) return false;

    const value = data[field.key];

    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === "string") {
      return value.trim().length === 0;
    }

    if (typeof value === "number") {
      return Number.isNaN(value);
    }

    return false;
  };

  const getStepErrors = (): Record<string, string> => {
    const stepErrors: Record<string, string> = {};

    (currentStepFields as ResourceFormField[]).forEach((field) => {
      if (isFieldMissing(field, values)) {
        stepErrors[field.key] = `${field.label} is required.`;
      }
    });

    // FIXME: floris; this is business logic
    const pctFields = currentStepFields as ResourceFormField[];
    // FIXME: floris; this is business logic
    const ownershipFields = pctFields.filter((field) =>
      field.key.startsWith("ownership_pct")
    );
    // FIXME: floris; this is business logic
    const votingFields = pctFields.filter((field) =>
      field.key.startsWith("voting_rights_pct")
    );
    const sumPct = (fields: ResourceFormField[]) => {
      return fields.reduce((acc, field) => {
        const raw = values[field.key];
        const num = typeof raw === "number"
          ? raw
          : raw == null || raw === ""
          ? 0
          : Number.parseFloat(String(raw));
        if (!Number.isFinite(num)) return acc;
        return acc + num;
      }, 0);
    };

    const TOLERANCE = 0.1;

    // FIXME: floris; this is business logic
    if (ownershipFields.length > 0) {
      const total = sumPct(ownershipFields);
      if (Math.abs(total - 100) > TOLERANCE) {
        const rounded = Math.round(total);
        stepErrors["__ownership_total__"] =
          `Ownership percentages must total 100%. Currently ${rounded}%.`;
      }
    }
    // FIXME: floris; this is business logic
    if (votingFields.length > 0) {
      const total = sumPct(votingFields);
      if (Math.abs(total - 100) > TOLERANCE) {
        const rounded = Math.round(total);
        stepErrors["__voting_total__"] =
          `Voting rights percentages must total 100%. Currently ${rounded}%.`;
      }
    }

    return stepErrors;
  };

  const updateField = (key: string, value: unknown) => {
    // clear local error for this field when user changes it
    setLocalErrors((prev) => {
      if (!prev || !prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

    onChange(key, value);
  };

  const renderFieldsWithLayout = (fields: ResourceFormField[]) => {
    return fields.map((field) => (
      <FormFieldV2
        key={field.key}
        field={field}
        value={values[field.key]}
        onChange={(value) => updateField(field.key, value)}
        formData={values}
        error={errors?.[field.key] ?? localErrors[field.key]}
      />
    ));
  };

  const handlePrevious = () => {
    if (currentStepIndex === 0) return;
    const nextIndex = currentStepIndex - 1;
    const [nextStepName] = orderedStepEntries[nextIndex] ?? ["", []];
    if (onStepChange) {
      onStepChange(nextIndex, String(nextStepName));
    }
    setCurrentStepIndex(nextIndex);
  };

  const handleNext = () => {
    const stepErrors = getStepErrors();
    setLocalErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    if (currentStepIndex >= orderedStepEntries.length - 1) return;
    const nextIndex = currentStepIndex + 1;
    const [nextStepName] = orderedStepEntries[nextIndex] ?? ["", []];
    if (onStepChange) {
      onStepChange(nextIndex, String(nextStepName));
    }
    setCurrentStepIndex(nextIndex);
  };

  const isLastStep = currentStepIndex === orderedStepEntries.length - 1;
  const showSubmitButton = schema.show_submit_button ?? true;

  const handleSubmitClick = () => {
    if (isSubmitting) return;

    const stepErrors = getStepErrors();
    setLocalErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    onSubmit();
  };

  return (
    <div className={cn("space-y-8")}>
      <h2 className={cn("px-4 text-xl font-semibold capitalize text-primary")}>
        {currentStepName.replace("_", " ")}
      </h2>

      <Container>
        <div className={cn("space-y-6")}>
          {currentStepName === "review_confirmation"
            ? <KycReviewCard schema={schema} values={values} />
            : (
              renderFieldsWithLayout(currentStepFields as ResourceFormField[])
            )}
        </div>
      </Container>
      {Object.entries(localErrors)
        .filter(([key]) => key.startsWith("__"))
        .map(([key, message]) => (
          <div key={key} className={cn("text-sm text-red-600")}>
            {message}
          </div>
        ))}
      <div className={cn("flex justify-between px-4 pt-4")}>
        {currentStepIndex > 0
          ? (
            <Button
              variant="ghost"
              onClick={handlePrevious}
              className={cn("rounded-sm border-0")}
            >
              <ChevronLeft className={cn("mr-2 h-4 w-4 stroke-white")} />
              Previous
            </Button>
          )
          : <div />}

        {!isLastStep
          ? (
            <Button onClick={handleNext} variant="default">
              Next
              <ChevronRight className={cn("ml-2 h-4 w-4 stroke-white")} />
            </Button>
          )
          : showSubmitButton
          ? (
            <Button
              onClick={handleSubmitClick}
              variant="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          )
          : <div />}
      </div>
    </div>
  );
}
