"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ResourceFormSchema } from "../../types/resource-forms";

interface KycReviewCardProps {
    schema: ResourceFormSchema;
    values: Record<string, unknown>;
}

export function KycReviewCard({ schema: _schema, values }: KycReviewCardProps) {
    const shareholderCount = typeof values.shareholder_count === "number" &&
            Number.isFinite(values.shareholder_count)
        ? values.shareholder_count
        : undefined;

    const suffixSet = new Set<number>();
    Object.keys(values || {}).forEach((key) => {
        const match = key.match(/_m(\d+)$/i);
        if (match) {
            const idx = Number(match[1]);
            if (Number.isFinite(idx)) suffixSet.add(idx);
        }
    });

    let memberIndices: number[] = [];
    if (shareholderCount && shareholderCount > 0) {
        memberIndices = Array.from(
            { length: shareholderCount },
            (_, i) => i + 1,
        );
    } else if (suffixSet.size > 0) {
        memberIndices = Array.from(suffixSet).sort((a, b) => a - b);
    }
    const get = (key: string): string => {
        const v = values[key];
        if (v === null || v === undefined || v === "") return "";
        return String(v);
    };

    const buildMemberName = (idx: number) => {
        const sal = get(`salutation_m${idx}`);
        const first = get(`first_name_m${idx}`);
        const middle = get(`middle_name_m${idx}`);
        const surname = get(`surname_m${idx}`);

        const parts = [sal, first, middle, surname].map((p) => p.trim()).filter(
            Boolean,
        );
        if (parts.length === 0) return `Member ${idx}`;
        return parts.join(" ");
    };

    const formatAddress = (idx: number) => {
        const house = get(`house_number_m${idx}`);
        const street = get(`street_m${idx}`);
        const city = get(`municipality_city_m${idx}`);
        const region = get(`region_state_m${idx}`);
        const postal = get(`postal_code_m${idx}`);
        const country = get(`country_m${idx}`);

        const line1 = [house, street].map((p) => p.trim()).filter(Boolean).join(
            " ",
        );
        const line2 = [city, region].map((p) => p.trim()).filter(Boolean).join(
            ", ",
        );
        const line3 = [postal, formatCountry(country)].map((p) => p.trim())
            .filter(Boolean).join(", ");

        return [line1, line2, line3].filter((l) => l.length > 0);
    };

    const hasUpload = (key: string) => {
        const raw = values[key];
        if (!raw) return false;
        if (typeof raw === "object" && raw !== null) {
            return Boolean(
                (raw as { file_url?: string; file_key?: string }).file_url ||
                    (raw as { file_url?: string; file_key?: string }).file_key,
            );
        }
        return true;
    };

    const stateOfIncorpRaw = get("state_of_incorp");
    const stateOfIncorp = stateOfIncorpRaw.length > 0
        ? stateOfIncorpRaw[0].toUpperCase() + stateOfIncorpRaw.slice(1)
        : "";

    const rawCompanyType = get("company_type");
    let companyType = "";
    if (rawCompanyType) {
        const l = rawCompanyType.toLowerCase();
        if (l === "c_corp" || l === "c-corp" || l === "c corp") {
            companyType = "C-Corp";
        } else if (l === "llc") {
            companyType = "LLC";
        } else {
            companyType = rawCompanyType;
        }
    }

    const firstPreferred = get("first_preferred_company_name");
    const secondPreferred = get("second_preferred_company_name");
    const thirdPreferred = get("third_preferred_company_name");
    const businessNature = get("business_nature");
    const intendedActivities = get("intended_business_activities");
    const intendedProducts = get("intended_products_services");
    const usPhoneNumber = get("us_phone_number");

    const memberFirstNames = memberIndices
        .map((idx) => get(`first_name_m${idx}`))
        .filter((n) => n.trim().length > 0);

    return (
        <Card
            className={cn("w-full space-y-6 border border-border bg-card p-4")}
        >
            <div className={cn("mb-2")}>
                <h3 className={cn("text-lg font-semibold text-primary")}>
                    Review your details
                </h3>
                <p className={cn("text-sm text-muted-foreground")}>
                    Please confirm that the information below is correct before
                    submitting your KYC.
                </p>
            </div>

            <div className={cn("space-y-4")}>
                <div
                    className={cn(
                        "rounded-sm border border-border bg-background/40 p-4",
                        "space-y-2",
                    )}
                >
                    <div className={cn("text-base font-semibold text-primary")}>
                        Summary
                    </div>
                    <div className={cn("space-y-1 text-sm")}>
                        {(stateOfIncorp || companyType) && (
                            <div className={cn("flex justify-between gap-4")}>
                                <span
                                    className={cn(
                                        "text-xs text-muted-foreground",
                                    )}
                                >
                                    Jurisdiction
                                </span>
                                <span
                                    className={cn(
                                        "text-sm text-foreground text-right",
                                    )}
                                >
                                    {stateOfIncorp && companyType
                                        ? `${stateOfIncorp} • ${companyType}`
                                        : stateOfIncorp || companyType}
                                </span>
                            </div>
                        )}
                        {firstPreferred && (
                            <div className={cn("flex justify-between gap-4")}>
                                <span
                                    className={cn(
                                        "text-xs text-muted-foreground",
                                    )}
                                >
                                    Company name
                                </span>
                                <span
                                    className={cn(
                                        "text-sm text-foreground text-right",
                                    )}
                                >
                                    {firstPreferred}
                                </span>
                            </div>
                        )}
                        {(memberFirstNames.length > 0 || shareholderCount) && (
                            <div className={cn("flex justify-between gap-4")}>
                                <span
                                    className={cn(
                                        "text-xs text-muted-foreground",
                                    )}
                                >
                                    Shareholders
                                </span>
                                <span
                                    className={cn(
                                        "text-sm text-foreground text-right",
                                    )}
                                >
                                    {memberFirstNames.length > 0
                                        ? `${memberFirstNames.join(", ")}${
                                            shareholderCount
                                                ? ` (${shareholderCount})`
                                                : ""
                                        }`
                                        : shareholderCount
                                        ? `${shareholderCount}`
                                        : ""}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {memberIndices.map((idx) => {
                    const name = buildMemberName(idx);
                    const dob = get(`dob_m${idx}`) || get("dob");
                    const countryOfBirthRaw = get(`country_of_birth_m${idx}`) ||
                        get("country_of_birth");
                    const countryOfBirth = formatCountry(countryOfBirthRaw);
                    const phone = get(`personal_phone_number_m${idx}`) ||
                        get("personal_phone_number");
                    const email = get(`personal_email_address_m${idx}`) ||
                        get("personal_email_address");
                    const addressLines = formatAddress(idx);
                    const ownership = get(`ownership_pct_m${idx}`) ||
                        get("ownership_pct");
                    const voting = get(`voting_rights_pct_m${idx}`) ||
                        get("voting_rights_pct");

                    const passportUploaded =
                        hasUpload(`passport_provided_m${idx}`) ||
                        hasUpload("passport_provided");
                    const proofUploaded = hasUpload(
                        `proof_of_residential_address_provided_m${idx}`,
                    ) ||
                        hasUpload("proof_of_residential_address_provided");

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "rounded-sm border border-border bg-background/40 p-4",
                                "space-y-3",
                            )}
                        >
                            <div
                                className={cn(
                                    "flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between",
                                )}
                            >
                                <div>
                                    <div
                                        className={cn(
                                            "text-base font-semibold text-primary",
                                        )}
                                    >
                                        {name}
                                    </div>
                                    <div
                                        className={cn(
                                            "text-xs text-muted-foreground",
                                        )}
                                    >
                                        Member {idx}
                                    </div>
                                </div>
                                {(ownership || voting) && (
                                    <div
                                        className={cn(
                                            "text-xs text-muted-foreground sm:text-right space-y-0.5",
                                        )}
                                    >
                                        {ownership && (
                                            <div>Ownership: {ownership}%</div>
                                        )}
                                        {voting && <div>Voting: {voting}%</div>}
                                    </div>
                                )}
                            </div>

                            <div
                                className={cn(
                                    "grid gap-4",
                                    "sm:grid-cols-2",
                                )}
                            >
                                <div className={cn("space-y-1 text-sm")}>
                                    {dob && (
                                        <div
                                            className={cn(
                                                "flex justify-between gap-4",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "text-xs text-muted-foreground",
                                                )}
                                            >
                                                Date of birth
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-sm text-foreground",
                                                )}
                                            >
                                                {dob}
                                            </span>
                                        </div>
                                    )}
                                    {countryOfBirth && (
                                        <div
                                            className={cn(
                                                "flex justify-between gap-4",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "text-xs text-muted-foreground",
                                                )}
                                            >
                                                Country of birth
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-sm text-foreground text-right",
                                                )}
                                            >
                                                {countryOfBirth}
                                            </span>
                                        </div>
                                    )}
                                    {phone && (
                                        <div
                                            className={cn(
                                                "flex justify-between gap-4",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "text-xs text-muted-foreground",
                                                )}
                                            >
                                                Phone
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-sm text-foreground",
                                                )}
                                            >
                                                {phone}
                                            </span>
                                        </div>
                                    )}
                                    {email && (
                                        <div
                                            className={cn(
                                                "flex justify-between gap-4",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "text-xs text-muted-foreground",
                                                )}
                                            >
                                                Email
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-sm text-foreground truncate max-w-50 text-right",
                                                )}
                                            >
                                                {email}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className={cn("space-y-1 text-sm")}>
                                    {addressLines.length > 0 && (
                                        <div>
                                            <div
                                                className={cn(
                                                    "mb-1 text-sm font-semibold text-primary",
                                                )}
                                            >
                                                Residential address
                                            </div>
                                            <div
                                                className={cn(
                                                    "space-y-0.5 text-left text-sm text-foreground",
                                                )}
                                            >
                                                {addressLines.map((line, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            i === 0
                                                                ? "font-semibold"
                                                                : undefined,
                                                        )}
                                                    >
                                                        {line}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className={cn("mt-2 space-y-1")}>
                                        <div
                                            className={cn(
                                                "text-xs text-muted-foreground",
                                            )}
                                        >
                                            Documents
                                        </div>
                                        <div
                                            className={cn(
                                                "flex flex-wrap gap-2 text-xs",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "rounded-sm px-2 py-0.5",
                                                    passportUploaded
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : "bg-muted text-muted-foreground",
                                                )}
                                            >
                                                Passport {passportUploaded
                                                    ? "uploaded"
                                                    : "missing"}
                                            </span>
                                            <span
                                                className={cn(
                                                    "rounded-sm px-2 py-0.5",
                                                    proofUploaded
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : "bg-muted text-muted-foreground",
                                                )}
                                            >
                                                Proof of address {proofUploaded
                                                    ? "uploaded"
                                                    : "missing"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {(firstPreferred ||
                    secondPreferred ||
                    thirdPreferred ||
                    businessNature ||
                    intendedActivities ||
                    intendedProducts ||
                    usPhoneNumber) && (
                    <div
                        className={cn(
                            "rounded-sm border border-border bg-background/40 p-4",
                            "space-y-3",
                        )}
                    >
                        <div
                            className={cn(
                                "text-base font-semibold text-primary",
                            )}
                        >
                            Company information
                        </div>
                        <div className={cn("space-y-1")}>
                            {firstPreferred && (
                                <div
                                    className={cn(
                                        "flex justify-between gap-4 text-sm",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-xs text-muted-foreground",
                                        )}
                                    >
                                        Preferred name 1
                                    </span>
                                    <span
                                        className={cn(
                                            "text-sm text-foreground text-right",
                                        )}
                                    >
                                        {firstPreferred}
                                    </span>
                                </div>
                            )}
                            {secondPreferred && (
                                <div
                                    className={cn(
                                        "flex justify-between gap-4 text-sm",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-xs text-muted-foreground",
                                        )}
                                    >
                                        Preferred name 2
                                    </span>
                                    <span
                                        className={cn(
                                            "text-sm text-foreground text-right",
                                        )}
                                    >
                                        {secondPreferred}
                                    </span>
                                </div>
                            )}
                            {thirdPreferred && (
                                <div
                                    className={cn(
                                        "flex justify-between gap-4 text-sm",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-xs text-muted-foreground",
                                        )}
                                    >
                                        Preferred name 3
                                    </span>
                                    <span
                                        className={cn(
                                            "text-sm text-foreground text-right",
                                        )}
                                    >
                                        {thirdPreferred}
                                    </span>
                                </div>
                            )}
                            {usPhoneNumber && (
                                <div
                                    className={cn(
                                        "flex justify-between gap-4 text-sm",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-xs text-muted-foreground",
                                        )}
                                    >
                                        US phone number
                                    </span>
                                    <span
                                        className={cn(
                                            "text-sm text-foreground",
                                        )}
                                    >
                                        {usPhoneNumber}
                                    </span>
                                </div>
                            )}

                            {businessNature && (
                                <div className={cn("mt-3 space-y-1 text-sm")}>
                                    <div
                                        className={cn(
                                            "text-sm font-semibold text-primary",
                                        )}
                                    >
                                        Business nature
                                    </div>
                                    <div
                                        className={cn(
                                            "text-sm text-foreground whitespace-pre-wrap leading-relaxed",
                                        )}
                                    >
                                        {businessNature}
                                    </div>
                                </div>
                            )}

                            {intendedActivities && (
                                <div className={cn("mt-3 space-y-1 text-sm")}>
                                    <div
                                        className={cn(
                                            "text-sm font-semibold text-primary",
                                        )}
                                    >
                                        Intended activities
                                    </div>
                                    <div
                                        className={cn(
                                            "text-sm text-foreground whitespace-pre-wrap leading-relaxed",
                                        )}
                                    >
                                        {intendedActivities}
                                    </div>
                                </div>
                            )}

                            {intendedProducts && (
                                <div className={cn("mt-3 space-y-1 text-sm")}>
                                    <div
                                        className={cn(
                                            "text-sm font-semibold text-primary",
                                        )}
                                    >
                                        Intended products or services
                                    </div>
                                    <div
                                        className={cn(
                                            "text-sm text-foreground whitespace-pre-wrap leading-relaxed",
                                        )}
                                    >
                                        {intendedProducts}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

function formatCountry(raw: string): string {
    if (!raw) return "";
    const trimmed = raw.trim();
    if (/^[A-Za-z]{2}$/.test(trimmed)) {
        try {
            const regionNames = new Intl.DisplayNames(["en"], {
                type: "region",
            });
            return regionNames.of(trimmed.toUpperCase()) ||
                trimmed.toUpperCase();
        } catch {
            return trimmed.toUpperCase();
        }
    }
    return trimmed;
}
