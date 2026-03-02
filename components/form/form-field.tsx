"use client";

import { AddressCountrySelect } from "@/components/select/address-country-select";
import PayNowButton from "@/components/cta/pay-now-button";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import {
    Popover,
    PopoverContent,
} from "@/components/ui/popover";
import { PricingCard } from "@/components/ui/pricing-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserStore } from "@/lib/stores";
import { FileUploadZone } from "@/components/file-upload/file-upload-zone";
import { RadioGroupButton } from "@/components/ui/radio-group";
import { PhoneNumberInput } from "@/components/inputs/phone-number-input";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import * as ReactNamespace from "react";
import { useState } from "react";
import type { FormField as FormFieldType } from "@/packages/resource-framework/resource-types";

interface FormFieldProps {
    field: FormFieldType;
    value: unknown;
    onChange: (value: unknown) => void;
    formData?: Record<string, unknown>;
    shouldShowConditionalNote?: boolean;
    error?: string;
}

interface UploadedFile {
    url?: string;
}

interface NormalizedCardOption {
    value: string;
    title: string;
    description: string;
    badge: string;
    subheading: string;
    footer: string;
}

interface NormalizedPlanOption {
    value: string;
    title: string;
    price: string;
    cadence: string;
    features: string[];
    badge: string;
    footer: string;
}

export function FormField({
    field,
    value,
    onChange,
    formData,
    shouldShowConditionalNote,
    error,
}: FormFieldProps) {
    const isMobile = useIsMobile();
    const { user } = useUserStore();
    const textId = ReactNamespace.useId();
    const emailId = ReactNamespace.useId();
    const telId = ReactNamespace.useId();
    const numberId = ReactNamespace.useId();
    const dateId = ReactNamespace.useId();
    const fileId = ReactNamespace.useId();
    const calcId = ReactNamespace.useId();
    const [tableRows, setTableRows] = useState<Record<string, string>[]>(
        Array.isArray(value) ? value : [{}],
    );
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

    // For date fields, especially dob, open year at 18
    const [calendarMonth, setCalendarMonth] = React.useState<Date | undefined>(
        () => {
            if (field.key === "dob") {
                // Default calendar to 18 years ago for dob
                const eighteenAgo = new Date();
                eighteenAgo.setFullYear(eighteenAgo.getFullYear() - 18);
                eighteenAgo.setMonth(0); // Jan
                eighteenAgo.setDate(1); // 1st for predictability
                return eighteenAgo;
            }
            if (typeof value === "string") {
                const d = new Date(value);
                if (!Number.isNaN(d.getTime())) return d;
            }
            return undefined;
        },
    );

    const [countryDisplay, setCountryDisplay] = useState<string>(() => {
        if (typeof value === "string") {
            if (value === "USA") return "United States";
            if (value === "Other") return "";
            return value;
        }
        return "";
    });

    // quick helper to flag invalid styles
    const invalidCls = error ? "border-red-500 focus-visible:ring-red-500" : "";

    const handleTableChange = (
        rowIndex: number,
        column: string,
        cellValue: string,
    ) => {
        const newRows = [...tableRows];
        newRows[rowIndex] = { ...newRows[rowIndex], [column]: cellValue };
        setTableRows(newRows);
        onChange(newRows);
    };

    const addTableRow = () => {
        const newRows = [...tableRows, {}];
        setTableRows(newRows);
        onChange(newRows);
    };

    const removeTableRow = (index: number) => {
        const newRows = tableRows.filter((_, i) => i !== index);
        setTableRows(newRows);
        onChange(newRows);
    };

    const generateYearOptionsExtended = () => {
        // For DOB, last three years shouldn't be included
        const currentYear = new Date().getFullYear();
        const startBirthYear = currentYear - 100;
        const endBirthYear = currentYear - 18;

        const yearSet = new Set<number>();
        for (let year = endBirthYear; year >= startBirthYear; year--) {
            yearSet.add(year);
        }
        // lastThreeYears intentionally omitted for DOB!
        const years = Array.from(yearSet).sort((a, b) => b - a);
        return years;
    };

    const resolveFromDate = (): Date | undefined => {
        const fieldWithFromDate = field as { fromDate?: string };
        const raw = fieldWithFromDate?.fromDate;
        if (!raw) return undefined;
        if (raw === "today") return new Date();
        const rel = /^today-(\d+)([dwmy])$/i.exec(raw);
        if (rel) {
            const amount = Number.parseInt(rel[1], 10);
            const unit = rel[2].toLowerCase();
            const d = new Date();
            if (unit === "d") d.setDate(d.getDate() - amount);
            else if (unit === "w") d.setDate(d.getDate() - amount * 7);
            else if (unit === "m") d.setMonth(d.getMonth() - amount);
            else if (unit === "y") d.setFullYear(d.getFullYear() - amount);
            return d;
        }
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const getDynamicFromDate = (): Date | undefined => {
        if (field.key === "passport_expiry" && formData?.passport_issue_date) {
            const d = new Date(String(formData.passport_issue_date));
            return Number.isNaN(d.getTime()) ? undefined : d;
        }
        if (field.key === "fy_end" && formData?.fy_start) {
            const d = new Date(String(formData.fy_start));
            return Number.isNaN(d.getTime()) ? undefined : d;
        }
        // For DOB, max date is 18 years ago today!
        if (field.key === "dob") {
            const d = new Date();
            d.setFullYear(d.getFullYear() - 18);
            d.setHours(0, 0, 0, 0);
            return undefined; // No min for dob, restrict with max later
        }
        return resolveFromDate();
    };

    type PricingItem = { label: string; amount: number };

    const computePricing = (args: {
        state: "wyoming" | "delaware" | "texas";
        plan: "starter" | "tax" | "accounting";
        shareholders: number;
    }) => {
        const toCents = (n: number) => Math.round(n * 100);
        const recurring: PricingItem[] = [];
        const one_time: PricingItem[] = [];

        if (args.plan === "starter") {
            recurring.push({ label: "Starter package", amount: toCents(299) });
        }
        if (args.plan === "tax") {
            recurring.push({ label: "Tax package", amount: toCents(899) });
        }
        if (args.plan === "accounting") {
            recurring.push({
                label: "Accounting package",
                amount: toCents(1999),
            });
        }

        if (args.state === "wyoming") {
            one_time.push({ label: "Wyoming state fee", amount: toCents(100) });
            one_time.push({
                label: "State fee commission",
                amount: toCents(10),
            });

            if (args.shareholders > 1) {
                if (args.plan === "tax" || args.plan === "accounting") {
                    recurring.push({
                        label: "1065 partnership return",
                        amount: toCents(999),
                    });
                    const extras = args.shareholders - 1;
                    recurring.push({
                        label: "US ITIN (per extra shareholder)",
                        amount: toCents(299 * extras),
                    });
                    recurring.push({
                        label: "1040NR return (per extra shareholder)",
                        amount: toCents(499 * extras),
                    });
                }
            }
        } else if (args.state === "delaware") {
            one_time.push({
                label: "Delaware state fee",
                amount: toCents(110),
            });
            one_time.push({
                label: "State fee commission",
                amount: toCents(16),
            });
            one_time.push({
                label: "Delaware express formation",
                amount: toCents(50),
            });

            if (args.plan === "tax" || args.plan === "accounting") {
                recurring.push({
                    label: "1120 corporate return",
                    amount: toCents(999),
                });
                if (args.shareholders > 1) {
                    const extras = args.shareholders - 1;
                    recurring.push({
                        label: "US ITIN (per extra shareholder)",
                        amount: toCents(299 * extras),
                    });
                    recurring.push({
                        label: "1040NR return (per extra shareholder)",
                        amount: toCents(499 * extras),
                    });
                }
            }
        } else {
            one_time.push({ label: "Texas state fee", amount: toCents(399) });
            one_time.push({
                label: "State fee commission",
                amount: toCents(39.9),
            });
            one_time.push({
                label: "Other states setup",
                amount: toCents(250),
            });

            if (args.plan === "tax" || args.plan === "accounting") {
                recurring.push({
                    label: "1120 corporate return",
                    amount: toCents(999),
                });
                if (args.shareholders > 1) {
                    const extras = args.shareholders - 1;
                    recurring.push({
                        label: "US ITIN (per extra shareholder)",
                        amount: toCents(299 * extras),
                    });
                    recurring.push({
                        label: "1040NR return (per extra shareholder)",
                        amount: toCents(499 * extras),
                    });
                }
            }
        }

        return { recurring, one_time };
    };

    const renderField = () => {
        const isGenericCountryField = typeof field?.key === "string" &&
            (/country/i.test(field.key) || field.key === "nationality") &&
            (!Array.isArray(field?.options) || field.options.length === 0);

        if (isGenericCountryField) {
            return (
                <AddressCountrySelect
                    label={field.label}
                    value={typeof value === "string" ? value : ""}
                    onChange={(selected: string) => {
                        onChange(selected);
                    }}
                />
            );
        }

        const isUSAOtherMapping = Array.isArray(field?.options) &&
            field.options.length === 2 &&
            field.options.includes("USA") &&
            field.options.includes("Other") &&
            (/country/i.test(field.key) || field.key === "nationality");

        if (isUSAOtherMapping) {
            return (
                <AddressCountrySelect
                    width_full={true}
                    label={field.label}
                    value={countryDisplay}
                    onChange={(selected: string) => {
                        setCountryDisplay(selected);
                        const norm = selected.toLowerCase();
                        const isUS = norm.includes("united states") ||
                            norm === "us" || norm === "usa";
                        onChange(isUS ? "USA" : "Other");
                    }}
                />
            );
        }

        switch (field.type) {
            case "country_code":
                return (
                    <AddressCountrySelect
                        width_full={true}
                        label={field.label}
                        value={countryDisplay}
                        onChange={(selected: string) => {
                            setCountryDisplay(selected);
                            const norm = selected.toLowerCase();
                            const isUS = norm.includes("united states") ||
                                norm === "us" ||
                                norm === "usa";
                            onChange(isUS ? "USA" : "Other");
                        }}
                    />
                );
            case "text":
                if (field.key === "contact_phone" || field.key === "phone") {
                    return (
                        <PhoneNumberInput
                            value={typeof value === "string" ? value : ""}
                            onChangeAction={(e) => onChange(e.target.value)}
                            className={invalidCls}
                            aria-invalid={!!error}
                        />
                    );
                }
                return (
                    <Input
                        id={textId}
                        name={field.key}
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={invalidCls}
                        aria-invalid={!!error}
                    />
                );
            case "email":
                return (
                    <Input
                        id={emailId}
                        name={field.key}
                        type="email"
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={invalidCls}
                        aria-invalid={!!error}
                    />
                );
            case "tel":
                return (
                    <Input
                        id={telId}
                        name={field.key}
                        type="tel"
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={invalidCls}
                        aria-invalid={!!error}
                    />
                );
            case "number": {
                const fieldWithMinMax = field as {
                    min?: number;
                    max?: number;
                    step_size?: number;
                };
                const minVal = fieldWithMinMax?.min;
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
                        id={numberId}
                        label={field.label}
                        value={resolved}
                        min={minVal}
                        max={fieldWithMinMax?.max}
                        step={fieldWithMinMax?.step_size ?? 1}
                        onValueChange={(v: number) => {
                            onChange(v);
                        }}
                        className={invalidCls}
                        aria-invalid={!!error}
                    />
                );
            }
            case "date": {
                const useYearDropdown = field.key === "dob" ||
                    field.key === "fy_start" ||
                    field.key === "fy_end" ||
                    field.key === "passport_issue_date" ||
                    field.key === "passport_expiry";

                // Only for dob impose age>=18 restriction
                const isDob = field.key === "dob";
                const currentYear = new Date().getFullYear();
                const maxDob = (() => {
                    const d = new Date();
                    d.setFullYear(
                        d.getFullYear() - 18,
                        d.getMonth(),
                        d.getDate(),
                    );
                    d.setHours(0, 0, 0, 0);
                    return d;
                })();

                if (isMobile && useYearDropdown) {
                    return (
                        <Input
                            type="date"
                            id={dateId}
                            name={field.key}
                            value={typeof value === "string" ? value : ""}
                            onChange={(e) => {
                                // For dob, only allow <= 18 years ago
                                if (isDob) {
                                    const entered = new Date(e.target.value);
                                    if (entered > maxDob) {
                                        // Optionally notify user here
                                        return;
                                    }
                                }
                                onChange(e.target.value);
                            }}
                            min={
                                undefined // For dob, no min
                            }
                            max={isDob
                                ? maxDob.toISOString().slice(0, 10)
                                : undefined}
                            className={invalidCls}
                            aria-invalid={!!error}
                        />
                    );
                }
                return (
                    <Popover
                        isOpen={isCalendarOpen}
                        onOpenChange={setIsCalendarOpen}
                    >
                        <Button
                                variant="outline"
                                className={`w-full justify-start rounded-sm bg-transparent text-left font-normal ${invalidCls}`}
                                aria-invalid={!!error}
                            >
                                {value && typeof value === "string"
                                    ? format(new Date(value), "PPP")
                                    : ""}
                        </Button>
                        <PopoverContent className="w-auto p-0">
                            {useYearDropdown && (
                                <div className="flex items-center justify-between border-b p-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            // Lower bound is 100 years ago max for dob, 18 years ago min
                                            const current = calendarMonth
                                                ? new Date(calendarMonth)
                                                : isDob
                                                ? new Date(
                                                    currentYear - 18,
                                                    0,
                                                    1,
                                                ) // Jan 1 of 18 years ago
                                                : new Date();
                                            const next = new Date(current);
                                            next.setFullYear(
                                                current.getFullYear() - 1,
                                            );
                                            // DOB: don't allow going below 100 years ago
                                            if (
                                                isDob &&
                                                next.getFullYear() <
                                                    currentYear - 100
                                            ) {
                                                return;
                                            }
                                            if (
                                                isDob &&
                                                next.getFullYear() >
                                                    currentYear - 18
                                            ) {
                                                return;
                                            }
                                            setCalendarMonth(next);
                                        }}
                                        className="h-7 w-7 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Select
                                        value={calendarMonth
                                            ? calendarMonth.getFullYear()
                                                .toString()
                                            : isDob
                                            ? (currentYear - 18).toString()
                                            : new Date().getFullYear()
                                                .toString()}
                                        onValueChange={(year: string) => {
                                            const yearNum = Number(year);
                                            const dobStart = currentYear - 100;
                                            const dobEnd = currentYear - 18;
                                            if (Number.isNaN(yearNum)) return;
                                            if (isDob) {
                                                if (
                                                    yearNum < dobStart ||
                                                    yearNum > dobEnd
                                                ) {
                                                    // Prevent picking years not allowed for dob
                                                    return;
                                                }
                                            } else {
                                                if (
                                                    yearNum < 1900 ||
                                                    yearNum > currentYear
                                                ) return;
                                            }
                                            const base = calendarMonth
                                                ? new Date(calendarMonth)
                                                : new Date();
                                            base.setFullYear(yearNum);
                                            setCalendarMonth(base);

                                            // also update the selected value if one exists so the button reflects the change
                                            try {
                                                const currentSelected = value &&
                                                        typeof value ===
                                                            "string"
                                                    ? new Date(value)
                                                    : undefined;
                                                const monthIndex = base
                                                    .getMonth();
                                                const day = currentSelected &&
                                                        !Number.isNaN(
                                                            currentSelected
                                                                .getTime(),
                                                        )
                                                    ? currentSelected.getDate()
                                                    : 1;
                                                const lastDayOfMonth = new Date(
                                                    yearNum,
                                                    monthIndex + 1,
                                                    0,
                                                ).getDate();
                                                const safeDay = Math.min(
                                                    day,
                                                    lastDayOfMonth,
                                                );
                                                const updated = new Date(
                                                    yearNum,
                                                    monthIndex,
                                                    safeDay,
                                                );
                                                // For dob, do not allow selecting dates after maxDob
                                                if (isDob && updated > maxDob) {
                                                    return;
                                                }
                                                if (
                                                    !Number.isNaN(
                                                        updated.getTime(),
                                                    )
                                                ) {
                                                    onChange(
                                                        format(
                                                            updated,
                                                            "yyyy-MM-dd",
                                                        ),
                                                    );
                                                }
                                            } catch {}
                                        }}
                                    >
                                        <SelectTrigger className="h-7 w-24 rounded-sm text-xs">
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(isDob
                                                ? generateYearOptionsExtended()
                                                : (() => {
                                                    const currentYear =
                                                        new Date()
                                                            .getFullYear();
                                                    const startYear = 1900;
                                                    const endYear = currentYear;
                                                    const years = [];
                                                    for (
                                                        let year = endYear;
                                                        year >= startYear;
                                                        year--
                                                    ) {
                                                        years.push(year);
                                                    }
                                                    return years;
                                                })()).map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={year.toString()}
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            // For dob, only allow up to endBirthYear (currentYear-18)
                                            const current = calendarMonth
                                                ? new Date(calendarMonth)
                                                : isDob
                                                ? new Date(
                                                    currentYear - 18,
                                                    0,
                                                    1,
                                                )
                                                : new Date();
                                            const next = new Date(current);
                                            next.setFullYear(
                                                current.getFullYear() + 1,
                                            );
                                            if (
                                                isDob &&
                                                next.getFullYear() >
                                                    currentYear - 18
                                            ) {
                                                return;
                                            }
                                            if (
                                                isDob &&
                                                next.getFullYear() <
                                                    currentYear - 100
                                            ) {
                                                return;
                                            }
                                            setCalendarMonth(next);
                                        }}
                                        className="h-7 w-7 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <CalendarComponent
                                mode="single"
                                selected={value && typeof value === "string"
                                    ? new Date(value)
                                    : undefined}
                                onSelect={(date) => {
                                    // For dob, don't allow selecting a date after maxDob
                                    if (field.key === "dob") {
                                        if (date && date > maxDob) {
                                            // Optionally notify user
                                            return;
                                        }
                                    }
                                    onChange(
                                        date ? format(date, "yyyy-MM-dd") : "",
                                    );
                                    setIsCalendarOpen(false);
                                }}
                                month={calendarMonth}
                                onMonthChange={setCalendarMonth}
                                initialFocus
                                fromDate={isDob
                                    ? undefined
                                    : getDynamicFromDate()}
                                toDate={isDob ? maxDob : undefined}
                            />
                        </PopoverContent>
                    </Popover>
                );
            }
            case "textarea":
                return (
                    <Textarea
                        id={field.key}
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={invalidCls}
                        aria-invalid={!!error}
                    />
                );
            case "select": {
                const fieldWithDefault = field as { defaultValue?: string };
                return (
                    <Select
                        value={typeof value === "string"
                            ? value
                            : fieldWithDefault?.defaultValue || ""}
                        onValueChange={onChange}
                    >
                        <SelectTrigger
                            className={`rounded-sm ${invalidCls}`}
                            aria-invalid={!!error}
                        >
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            }
            case "radio":
                // floris; i do not like this
                if (field.key === "contract_package") {
                    const items = (field.options || []).map((opt: string) => {
                        const canonical =
                            opt.toLowerCase().includes("management")
                                ? "Management and holding"
                                : opt.toLowerCase().includes("online")
                                ? "Online entrepreneur"
                                : opt.toLowerCase().includes("complete")
                                ? opt.toLowerCase().includes("business")
                                    ? "Business complete"
                                    : "Business complete"
                                : opt;
                        return {
                            value: canonical,
                            label: opt,
                        };
                    });

                    return (
                        <RadioGroupButton
                            items={items}
                            legend={field.label}
                            value={typeof value === "string" ? value : ""}
                            onValueChange={onChange}
                        />
                    );
                }
                return (
                    <RadioGroup
                        value={typeof value === "string" ? value : ""}
                        onValueChange={onChange}
                    >
                        {field.options?.map((option) => (
                            <div
                                key={option}
                                className="flex items-center space-x-2"
                            >
                                <RadioGroupItem
                                    value={option}
                                    id={`${field.key}-${option}`}
                                />
                                <Label
                                    htmlFor={`${field.key}-${option}`}
                                    className="text-primary"
                                >
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case "checkbox":
                return (
                    <Checkbox
                        id={field.key}
                        checked={!!value}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                );
            case "switch":
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            id={field.key}
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(checked)}
                        />
                        <Label htmlFor={field.key}>{field.label}</Label>
                    </div>
                );
            case "file":
                return (
                    <Input
                        type="file"
                        id={fileId}
                        name={field.key}
                        onChange={(e) => onChange(e.target.files?.[0])}
                        className={`rounded-sm ${invalidCls}`}
                        aria-invalid={!!error}
                    />
                );
            case "file_explorer": {
                const email = String(
                    formData?.email ||
                        formData?.contact_email ||
                        formData?.author_email ||
                        "",
                ).trim();
                const entity = String(formData?.entity || "").trim();
                const safeEmail = email.toLowerCase();
                const safeEntity = entity.replace(/\s+/g, "_").toLowerCase();
                const dir = safeEmail && safeEntity
                    ? `formations/${safeEmail}/${safeEntity}/file`
                    : undefined;
                return (
                    <FileUploadZone
                        organizationId={String(user?.organization_id || "")}
                        projectId={String(user?.company_id || "")}
                        dir={dir}
                        onUploadedAction={(uploaded: UploadedFile[]) => {
                            try {
                                onChange(uploaded?.[0]?.url || "");
                            } catch {}
                        }}
                    />
                );
            }

            case "table":
                return (
                    <div className="space-y-2">
                        <div className="space-y-2">
                            {tableRows.map((row, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] items-center gap-2"
                                >
                                    {field.columns?.map((col) => (
                                        <div key={col} className="space-y-1">
                                            <Label className="text-xs font-medium text-primary">
                                                {col}
                                            </Label>
                                            <Input
                                                value={row[col] || ""}
                                                onChange={(e) =>
                                                    handleTableChange(
                                                        rowIndex,
                                                        col,
                                                        e.target.value || "",
                                                    )}
                                                className={invalidCls}
                                                aria-invalid={!!error}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTableRow(rowIndex)}
                                        className="mt-6 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTableRow}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add row
                        </Button>
                    </div>
                );
            case "note":
                return (
                    <Card className="rounded-sm border-0 bg-muted p-4">
                        <p className="text-primary-foreground text-sm leading-relaxed">
                            {field.content}
                        </p>
                    </Card>
                );
            case "calculated":
                return (
                    <Input
                        id={calcId}
                        name={field.key}
                        value={typeof value === "string" ? value : ""}
                        onChange={() => {}}
                        readOnly
                        className={invalidCls}
                        aria-invalid={!!error}
                    />
                );
            case "card_select": {
                const fieldWithOptions = field as { options?: unknown[] };
                const options = (fieldWithOptions.options || []) as Array<
                    string | Record<string, unknown>
                >;
                const normalized: NormalizedCardOption[] = options
                    .map((opt: string | Record<string, unknown>) => {
                        if (typeof opt === "string") {
                            return {
                                value: opt,
                                title: opt,
                                description: "",
                                badge: "",
                                subheading: "",
                                footer: "",
                            };
                        }
                        const valueKey = String(
                            opt.value ?? opt.key ?? opt.label ?? opt,
                        );
                        const title = String(
                            opt.title ?? opt.label ?? (valueKey || "option"),
                        );
                        const description = String(
                            opt.description ?? opt.subtitle ?? opt.content ??
                                "",
                        );
                        const badge = String(
                            opt.badge || opt.tag ||
                                (opt.recommended ? "recommended" : ""),
                        );
                        const subheading = String(
                            opt.subheading || opt.description_bold ||
                                opt.heading || "",
                        );
                        const footer = String(opt.footer || opt.note || "");
                        return {
                            value: valueKey,
                            title,
                            description,
                            badge,
                            subheading,
                            footer,
                        };
                    })
                    .filter((o) => o.value);

                const boldify = (text: string) =>
                    text
                        ? text.replace(
                            /\$?\d[\d,]*(?:\s*\/\s*(?:One Time|Year|Month))?/gi,
                            (m) => `<strong>${m}</strong>`,
                        )
                        : "";

                return (
                    <div className="flex w-full flex-col gap-3">
                        {normalized.map((opt) => {
                            const selected = value === opt.value;
                            const subheadingHTML = boldify(opt.subheading);
                            const descriptionHTML = boldify(opt.description);
                            const footerHTML = boldify(opt.footer);

                            return (
                                <Card
                                    key={opt.value}
                                    onClick={() =>
                                        onChange(selected ? "" : opt.value)}
                                    className={`w-full cursor-pointer rounded-sm border px-5 py-4 text-left shadow-none transition ${
                                        selected
                                            ? "ring-brand/30 bg-accent/20 border-brand ring-2"
                                            : "hover:border-brand/40 border-border"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-primary">
                                            {opt.title}
                                        </p>
                                        {opt.badge
                                            ? (
                                                <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-primary">
                                                    {opt.badge}
                                                </span>
                                            )
                                            : null}
                                    </div>

                                    {opt.subheading
                                        ? (
                                            <p
                                                className="mt-3 text-xs font-bold text-primary"
                                                dangerouslySetInnerHTML={{
                                                    __html: subheadingHTML,
                                                }}
                                            />
                                        )
                                        : null}

                                    {opt.description
                                        ? (
                                            <p
                                                className="mt-1 whitespace-pre-line text-xs leading-relaxed text-primary"
                                                dangerouslySetInnerHTML={{
                                                    __html: descriptionHTML,
                                                }}
                                            />
                                        )
                                        : null}

                                    {opt.footer
                                        ? (
                                            <div
                                                className="mt-2 text-[10px] leading-relaxed text-muted-foreground opacity-70"
                                                dangerouslySetInnerHTML={{
                                                    __html: footerHTML,
                                                }}
                                            />
                                        )
                                        : null}
                                </Card>
                            );
                        })}
                    </div>
                );
            }
            case "plan_select": {
                const fieldWithOptions = field as { options?: unknown[] };
                const options = (fieldWithOptions.options || []) as Array<
                    string | Record<string, unknown>
                >;
                const normalized: NormalizedPlanOption[] = options
                    .map((opt: string | Record<string, unknown>) => {
                        if (typeof opt === "string") {
                            return {
                                value: opt,
                                title: opt,
                                price: "",
                                cadence: "",
                                features: [],
                                badge: "",
                                footer: "",
                            };
                        }
                        const valueKey = String(
                            opt.value ?? opt.key ?? opt.label ?? opt,
                        );
                        const title = String(
                            opt.title ?? opt.label ?? (valueKey || "option"),
                        );
                        const price = String(opt.price ?? opt.amount ?? "");
                        const cadence = String(
                            opt.cadence ?? opt.interval ?? opt.billing ?? "",
                        );
                        const features = Array.isArray(opt.features)
                            ? opt.features.map(String)
                            : Array.isArray(opt.items)
                            ? opt.items.map(String)
                            : [];
                        const badge = String(
                            opt.badge || opt.tag ||
                                (opt.recommended ? "recommended" : ""),
                        );
                        const footer = String(opt.footer || opt.note || "");
                        return {
                            value: valueKey,
                            title,
                            price,
                            cadence,
                            features,
                            badge,
                            footer,
                        };
                    })
                    .filter((o) => o.value);

                return (
                    <div className="flex w-full flex-col gap-3">
                        {normalized.map((opt) => {
                            const selected = value === opt.value;
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
                                    onClickAction={() =>
                                        onChange(selected ? "" : opt.value)}
                                />
                            );
                        })}
                    </div>
                );
            }
            case "pay_stripe": {
                const stateRaw = String(
                    formData?.state_of_incorp || "",
                ).toLowerCase();

                const plan = String(formData?.plan || "")
                    .toLowerCase() as
                        | "starter"
                        | "tax"
                        | "accounting";

                const state = stateRaw.includes("wyoming")
                    ? "wyoming"
                    : stateRaw.includes("delaware")
                    ? "delaware"
                    : "texas";

                const email = String(
                    formData?.email ||
                        formData?.contact_email ||
                        formData?.author_email ||
                        "",
                ).trim();

                const shareholderCount =
                    Number(formData?.shareholder_count || 1) || 1;

                const caseId = String(formData?.sf_formations_case_id || "")
                    .trim() ||
                    undefined;

                const breakdown = computePricing({
                    state: state as "wyoming" | "delaware" | "texas",
                    plan: plan as "starter" | "tax" | "accounting",
                    shareholders: shareholderCount,
                });

                const toUSD = (cents: number) =>
                    new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 2,
                    }).format((cents || 0) / 100);

                const recurringTotal = (breakdown.recurring || []).reduce(
                    (s, i) => s + (i.amount || 0),
                    0,
                );

                const oneTimeTotal = (breakdown.one_time || []).reduce(
                    (s, i) => s + (i.amount || 0),
                    0,
                );

                const dueToday = recurringTotal + oneTimeTotal;

                return (
                    <div className="space-y-4">
                        <Card className="rounded-sm border-0 bg-muted p-4">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <p className="text-primary-foreground text-sm">
                                    State:{" "}
                                    <strong className="capitalize text-primary">
                                        {state}
                                    </strong>
                                </p>
                                <p className="text-primary-foreground text-sm">
                                    Plan:{" "}
                                    <strong className="capitalize text-primary">
                                        {plan}
                                    </strong>
                                </p>
                                <p className="text-primary-foreground text-sm">
                                    Shareholders:{" "}
                                    <strong className="text-primary">
                                        {shareholderCount}
                                    </strong>
                                </p>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Card className="rounded-sm border-0 p-4">
                                <p className="mb-2 text-sm font-semibold text-primary">
                                    Recurring
                                </p>
                                <div className="space-y-2">
                                    {(breakdown.recurring || []).map((
                                        item,
                                        idx,
                                    ) => (
                                        <div
                                            key={`r-${idx}`}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-primary-foreground">
                                                {item.label}
                                            </span>
                                            <span className="text-primary">
                                                {toUSD(item.amount)}/yr
                                            </span>
                                        </div>
                                    ))}
                                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-semibold">
                                        <span className="text-primary-foreground">
                                            Recurring total
                                        </span>
                                        <span className="text-primary">
                                            {toUSD(recurringTotal)}/yr
                                        </span>
                                    </div>
                                </div>
                            </Card>
                            <Card className="rounded-sm border-0 p-4">
                                <p className="mb-2 text-sm font-semibold text-primary">
                                    One-time
                                </p>
                                <div className="space-y-2">
                                    {(breakdown.one_time || []).map((
                                        item,
                                        idx,
                                    ) => (
                                        <div
                                            key={`o-${idx}`}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-primary-foreground">
                                                {item.label}
                                            </span>
                                            <span className="text-primary">
                                                {toUSD(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-semibold">
                                        <span className="text-primary-foreground">
                                            One-time total
                                        </span>
                                        <span className="text-primary">
                                            {toUSD(oneTimeTotal)}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-primary-foreground text-xs">
                                    Due today
                                </p>
                                <p className="text-xl font-semibold text-primary">
                                    {toUSD(dueToday)}
                                </p>
                            </div>
                            <PayNowButton
                                state={state as
                                    | "wyoming"
                                    | "delaware"
                                    | "texas"}
                                plan={plan as "starter" | "tax" | "accounting"}
                                email={email}
                                shareholderCount={shareholderCount}
                                caseId={caseId}
                            />
                        </div>
                    </div>
                );
            }
            case "conditional_note":
                if (!shouldShowConditionalNote) return null;
                return (
                    <Card className="rounded-sm border-0 bg-muted p-4">
                        <p className="text-primary-foreground text-sm leading-relaxed">
                            {field.content}
                        </p>
                    </Card>
                );

            default:
                return null;
        }
    };

    const usesBuiltInLabel =
        ["text", "email", "tel", "number", "file", "calculated"].includes(
            field.type as string,
        ) ||
        (typeof field?.key === "string" &&
            (/country/i.test(field.key) || field.key === "nationality"));

    return (
        <div className="space-y-2">
            {!usesBuiltInLabel && (
                <Label className="font-medium text-primary">
                    {field.label}
                </Label>
            )}
            {renderField()}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
    );
}
