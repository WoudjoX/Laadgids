import { describe, expect, it } from "vitest";
import type { RuleRow } from "@/lib/db/types";
import { selectRule } from "./select";
import { parseRuleParams } from "./schemas";

const rules: RuleRow[] = [
  {
    id: 1,
    country: "BE",
    region: "VLA",
    rule_type: "capacity_tariff",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    params: { cents_per_kw_year: 5600, min_kw: 2.5, household_baseline_w: 3500 },
    source_url: "https://example.com/vreg",
    source_checked_at: "2026-09-01",
    notes: null,
  },
  {
    id: 2,
    country: "BE",
    region: "VLA",
    rule_type: "capacity_tariff",
    valid_from: "2025-01-01",
    valid_to: "2025-12-31",
    params: { cents_per_kw_year: 5200, min_kw: 2.5, household_baseline_w: 3500 },
    source_url: "https://example.com/vreg",
    source_checked_at: "2025-01-01",
    notes: null,
  },
  {
    id: 3,
    country: "NL",
    region: null,
    rule_type: "bijtelling",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    params: { cap_cents: 3_000_000, low_pct: 0.18, high_pct: 0.22 },
    source_url: "https://example.com/belastingdienst",
    source_checked_at: "2026-09-01",
    notes: null,
  },
];

describe("selectRule", () => {
  it("kiest de regel die geldt op de datum", () => {
    const r = selectRule(rules, { country: "BE", region: "VLA", rule_type: "capacity_tariff", onDate: "2026-06-01" });
    expect(r?.id).toBe(1);
    expect(r?.params.cents_per_kw_year).toBe(5600);
  });
  it("geeft null voor een gewest zonder regel", () => {
    expect(selectRule(rules, { country: "BE", region: "WAL", rule_type: "capacity_tariff", onDate: "2026-06-01" })).toBeNull();
  });
  it("landregel (region null) geldt voor elk gewest en vult defaults in", () => {
    const r = selectRule(rules, { country: "NL", region: null, rule_type: "bijtelling", onDate: "2026-03-01" });
    expect(r?.params.fixed_months).toBe(60);
    expect(r?.params.net_rates).toEqual([0.37, 0.495]);
  });
  it("parseRuleParams weigert onvolledige params", () => {
    expect(() => parseRuleParams("capacity_tariff", { min_kw: 2.5 })).toThrow();
  });
});
