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

const PERCENT_TOTAL_TOLERANCE = 0.1;
const PERCENT_TOTAL_VALIDATIONS = [
  {
    fieldPrefix: "ownership_pct",
    errorKey: "__ownership_total__",
    message: "Ownership percentages must total 100%.",
  },
  {
    fieldPrefix: "voting_rights_pct",
    errorKey: "__voting_total__",
    message: "Voting rights percentages must total 100%.",
  },
] as const;

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (value == null || value === "") {
    return 0;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumFieldValues(
  fields: ResourceFormField[],
  values: Record<string, unknown>,
): number {
  return fields.reduce((sum, field) => sum + toNumber(values[field.key]), 0);
}

function getRequiredFieldErrors(
  fields: ResourceFormField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const stepErrors: Record<string, string> = {};

  for (const field of fields) {
    if (!field.required) {
      continue;
    }

    const value = values[field.key];
    const missing = value === null || value === undefined ||
      (typeof value === "string" && value.trim().length === 0) ||
      (typeof value === "number" && Number.isNaN(value));

    if (missing) {
      stepErrors[field.key] = `${field.label} is required.`;
    }
  }

  return stepErrors;
}

function getPercentageTotalErrors(
  fields: ResourceFormField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const stepErrors: Record<string, string> = {};

  for (const validation of PERCENT_TOTAL_VALIDATIONS) {
    const matchingFields = fields.filter((field) =>
      field.key.startsWith(validation.fieldPrefix)
    );

    if (matchingFields.length === 0) {
      continue;
    }

    const total = sumFieldValues(matchingFields, values);

    if (Math.abs(total - 100) > PERCENT_TOTAL_TOLERANCE) {
      const rounded = Math.round(total);
      stepErrors[validation.errorKey] =
        `${validation.message} Currently ${rounded}%.`;
    }
  }

  return stepErrors;
}

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

  const getStepErrors = (): Record<string, string> => {
    const fields = currentStepFields as ResourceFormField[];

    return {
      ...getRequiredFieldErrors(fields, values),
      ...getPercentageTotalErrors(fields, values),
    };
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
