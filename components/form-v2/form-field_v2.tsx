"use client";
import React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import { PricingCard } from "@/components/ui/pricing-card";
import { Textarea } from "@/components/ui/textarea";
import { AddressCountrySelect } from "@/components/select/address-country-select";
import { PhoneNumberInput } from "@/components/inputs/phone-number-input";
import {
  CalendarInputForm,
  CalendarInputFormDOB,
} from "@/components/inputs/calendar-input-form";
import { FormationPaymentSection } from "@/components/layouts/formations/FormationPaymentSection";
import { CardSelect } from "@/components/layouts/formations/card-select";
import { ShareHolderCard } from "@/components/layouts/formations/share-holder-card";
import FileUploadZoneForm from "@/components/file-upload/file-upload-zone-form";
import { cn } from "@/lib/utils";
import { ResourceFormField } from "@/packages/resource-framework/resource-types";

interface FormFieldV2Props {
  field: ResourceFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  formData?: Record<string, unknown>;
  error?: string;
}

interface FieldWithOptions {
  options?: Array<{
    value: string;
    title: string;
    price?: string;
    cadence?: string;
    features?: string[];
    badge?: string;
    footer?: string;
  }>;
}

interface FieldWithMinMax {
  min?: number;
  max?: number;
  step_size?: number;
}

interface UploadedFile {
  fileKey: string;
  url: string;
}

export function FormFieldV2({
  field,
  value,
  onChange,
  formData,
  error,
}: FormFieldV2Props) {
  const invalidCls = error ? "border-red-500 focus-visible:ring-red-500" : "";

  const renderField = () => {
    switch (field.type) {
      case "text": {
        if (field.key === "contact_phone" || field.key === "phone") {
          return (
            <PhoneNumberInput
              id={field.key}
              label={field.label}
              value={typeof value === "string" ? value : ""}
              onChangeAction={(e) => onChange(e.target.value)}
              className={cn("w-full", invalidCls)}
            />
          );
        }
        return (
          <Input
            id={field.key}
            name={field.key}
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={cn(invalidCls)}
            aria-invalid={!!error}
          />
        );
      }

      case "tel": {
        return (
          <PhoneNumberInput
            id={field.key}
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChangeAction={(e) => onChange(e.target.value)}
            className={cn("w-full", invalidCls)}
          />
        );
      }

      case "number": {
        const isOwnershipPct = field.key.startsWith("ownership_pct");
        const isVotingPct = field.key.startsWith("voting_rights_pct");

        if (isOwnershipPct || isVotingPct) {
          return (
            <ShareHolderCard
              field={field}
              value={typeof value === "number" ? value : null}
              onChange={onChange}
              formData={formData}
            />
          );
        }

        const fieldWithMinMax = field as FieldWithMinMax;
        const minVal = fieldWithMinMax.min;
        const parsedNumber = typeof value === "number"
          ? value
          : (typeof value === "string" && value.trim() !== "")
          ? Number(value)
          : undefined;
        const normalizedValue = typeof parsedNumber === "number" &&
              Number.isFinite(parsedNumber)
          ? parsedNumber
          : undefined;
        const resolved = typeof normalizedValue === "number"
          ? normalizedValue
          : typeof minVal === "number"
          ? minVal
          : 0;

        return (
          <NumberField
            id={field.key}
            label={field.label}
            value={resolved}
            min={minVal}
            max={fieldWithMinMax.max}
            step={fieldWithMinMax.step_size ?? 1}
            onValueChange={(v: number) => {
              onChange(v);
            }}
            className={cn(invalidCls)}
            aria-invalid={!!error}
          />
        );
      }

      case "date": {
        return (
          <CalendarInputForm
            id={field.key}
            fieldKey={field.key}
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChangeAction={(newValue: string) => onChange(newValue)}
            error={error}
            className={cn(invalidCls)}
          />
        );
      }

      case "dob": {
        return (
          <CalendarInputFormDOB
            id={field.key}
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChangeAction={(newValue: string) => onChange(newValue)}
            error={error}
            className={cn(invalidCls)}
          />
        );
      }

      case "card_select": {
        const fieldWithOptions = field as FieldWithOptions;
        const options = fieldWithOptions.options || [];
        const selectedValue = typeof value === "string" ? value : "";

        return (
          <CardSelect
            options={options}
            value={selectedValue}
            onChangeAction={(v) => onChange(v)}
          />
        );
      }

      case "plan_select": {
        const fieldWithOptions = field as FieldWithOptions;
        const options = fieldWithOptions.options || [];
        const selectedValue = typeof value === "string" ? value : "";

        return (
          <div className={cn("flex w-full flex-col gap-3")}>
            {options.map((opt) => {
              const selected = selectedValue === opt.value;
              return (
                <PricingCard
                  key={opt.value}
                  value={opt.value}
                  title={opt.title}
                  price={opt.price}
                  cadence={opt.cadence}
                  features={opt.features}
                  badge={opt.badge}
                  footer={opt.footer}
                  selected={selected}
                  onClickAction={() => onChange(selected ? "" : opt.value)}
                />
              );
            })}
          </div>
        );
      }

      case "pay_stripe": {
        return (
          <FormationPaymentSection label={field.label} formData={formData} />
        );
      }

      case "country": {
        const normalized = typeof value === "string" ? value : "";
        return (
          <AddressCountrySelect
            value={normalized}
            onChange={(newValue: string) => onChange(newValue)}
            width_full={true}
            label={field.label}
          />
        );
      }

      case "text_area": {
        return (
          <Textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={cn(invalidCls)}
            aria-invalid={!!error}
          />
        );
      }

      case "file_upload": {
        const organizationId = String(formData?.organization_id || "");
        const projectId = String(formData?.company_id || "");

        return (
          <FileUploadZoneForm
            organizationId={organizationId}
            projectId={projectId}
            onUploadedAction={(uploaded: UploadedFile[]) => {
              const first = uploaded?.[0];
              if (!first) {
                onChange(null);
                return;
              }
              onChange({
                file_key: first.fileKey,
                file_url: first.url,
              });
            }}
          />
        );
      }

      default:
        return null;
    }
  };

  const usesBuiltInLabel = field.type === "text" ||
    field.type === "tel" ||
    field.type === "number" ||
    field.type === "pay_stripe" ||
    field.type === "country";

  return (
    <div className={cn("space-y-2")}>
      {!usesBuiltInLabel && (
        <Label className={cn("text-primary")}>{field.label}</Label>
      )}
      {renderField()}
      {error ? <p className={cn("text-sm text-red-600")}>{error}</p> : null}
    </div>
  );
}
