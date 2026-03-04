"use client";

import { Flag } from "@/components/ui/flag";
import { FC, useMemo } from "react";
import type { FormationInfo } from "../../resource-types";

const DEFAULT_MAP: Record<string, FormationInfo> = {
  formation_nl_bv: { label: "Netherlands • BV", country: "NL" },
  formation_us_llc: { label: "United States • LLC", country: "US" },
  formation_us_corp: { label: "United States • Corp", country: "US" },
  formation_hk_pt_ltd: { label: "Hong Kong • Pvt Ltd", country: "HK" },
  formation_be_be: { label: "Belgium • BV", country: "BE" },
  formation_ue_ifzo: { label: "Dubai • IFZO", country: "AE" },
};

function infer(
  scope?: string | null,
  customMap?: Record<string, FormationInfo>,
): FormationInfo {
  if (!scope) return { label: "formation", country: "US" };
  const s = scope.toLowerCase();
  const MAP = customMap || DEFAULT_MAP;

  // handle new us scope patterns like us_llc_wy, us_corp_tx, us_llc_de
  const usMatch = s.match(/^us_(llc|corp)_([a-z]{2})$/);
  if (usMatch) {
    const kind = usMatch[1];
    const stateCode = usMatch[2];

    let stateLabel = stateCode.toUpperCase();
    if (stateCode === "wy") stateLabel = "Wyoming";
    else if (stateCode === "tx") stateLabel = "Texas";
    else if (stateCode === "de") stateLabel = "Delaware";

    const kindLabel = kind === "llc" ? "LLC" : "Corp";
    return {
      label: `United States • ${stateLabel} (${kindLabel})`,
      country: "US",
    };
  }

  const direct = MAP[scope as keyof typeof MAP];
  if (direct) return direct;

  const m = s.match(/^formation_([a-z]{2})/);
  const cc = m?.[1];
  if (cc === "nl") {
    return { label: "Netherlands BV • formation", country: "NL" };
  }
  if (cc === "us") return { label: "united states • formation", country: "US" };
  if (cc === "hk") return { label: "hong kong • formation", country: "HK" };
  if (cc === "be") return { label: "belgium • formation", country: "BE" };
  if (cc === "ue") return { label: "uae • formation", country: "AE" };
  return { label: "formation", country: "US" };
}

export const ScopeCell: FC<{
  scope?: string | null;
  map?: Record<string, FormationInfo>;
}> = ({ scope, map }) => {
  const info = useMemo(() => infer(scope, map), [scope, map]);
  return (
    <div className="inline-flex items-center gap-2">
      <Flag country={info.country} size={18} />
      <span className="text-sm font-medium text-primary">{info.label}</span>
    </div>
  );
};

export default ScopeCell;
