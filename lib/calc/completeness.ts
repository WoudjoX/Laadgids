import type { Template, VersionRow } from "@/lib/db/types";

/** Vereiste velden per template (CLAUDE.md 6.8). */
export const REQUIRED_FIELDS: Record<Template, (keyof VersionRow)[]> = {
  charger_for_model: [
    "trim",
    "model_year",
    "battery_net_wh",
    "consumption_wh_per_km",
    "ac_max_w",
    "ac_phases",
    "spec_source_url",
    "spec_source_date",
  ],
  charging_cost: ["trim", "battery_net_wh", "consumption_wh_per_km", "spec_source_url", "spec_source_date"],
  vaa: ["trim", "catalog_price_be_cents", "spec_source_url", "spec_source_date"],
  bijtelling: ["trim", "catalog_price_nl_cents", "spec_source_url", "spec_source_date"],
  used_battery: ["trim", "model_year", "battery_gross_wh", "battery_net_wh", "spec_source_url", "spec_source_date"],
  rule: [],
  installer_city: [],
  make_hub: [],
};

function present(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v) && v > 0;
  return true;
}

/** 0 tot 1: fractie van de vereiste velden die ingevuld is. Templates zonder vereisten geven 1. */
export function completeness(version: Partial<VersionRow>, template: Template): number {
  const req = REQUIRED_FIELDS[template];
  if (req.length === 0) return 1;
  const filled = req.filter((k) => present(version[k])).length;
  return filled / req.length;
}
