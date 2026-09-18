// Zod-schema's voor rules.params per rule_type (CLAUDE.md §5, §6).
// Regels komen uit de database, nooit uit code. Dit bestand beschrijft alleen de vorm.
import { z } from "zod";

const int = z.number().int();

/** 6.3 Capaciteitstarief (Vlaanderen). Kosten in eurocent per kW per jaar. */
export const capacityTariffParams = z.object({
  cents_per_kw_year: int.positive(),
  min_kw: z.number().positive().default(2.5),
  household_baseline_w: int.positive().default(3500),
});
export type CapacityTariffParams = z.infer<typeof capacityTariffParams>;

/** 6.5 VAA België. Percentages als fractie (0.04 = 4%). */
export const vaaParams = z.object({
  base_pct: z.number(), // 0.055
  ref_co2_g_km: int, // referentie-CO2 voor benzine/elektrisch; per aanslagjaar
  step_pct: z.number(), // 0.001 per gram
  min_pct: z.number(), // 0.04
  max_pct: z.number(), // 0.18
  age_table: z.array(z.number()).min(1), // coëfficiënt per leeftijdsjaar, index 0 = jaar 1
  min_vaa_cents: int.nonnegative(),
  catalog_factor: z.number().default(6 / 7),
  marginal_rate_default: z.number().default(0.5),
});
export type VaaParams = z.infer<typeof vaaParams>;

/** 6.6 Bijtelling Nederland. */
export const bijtellingParams = z.object({
  cap_cents: int.positive(), // 3_000_000
  low_pct: z.number(), // 0.18
  high_pct: z.number(), // 0.22
  fixed_months: int.positive().default(60),
  net_rates: z.array(z.number()).default([0.37, 0.495]),
});
export type BijtellingParams = z.infer<typeof bijtellingParams>;

/** 6.7 Aftrekbaarheid vennootschappen BE, per aankoopjaar en powertrain. Fracties. */
export const deductibilityParams = z.object({
  by_purchase_year: z.record(
    z.string().regex(/^\d{4}$/),
    z.object({ bev: z.number(), phev: z.number().optional(), erev: z.number().optional() }),
  ),
});
export type DeductibilityParams = z.infer<typeof deductibilityParams>;

/** 6% btw op laadpaalinstallatie. */
export const vatReducedParams = z.object({
  rate_pct: int, // 6
  home_min_age_years: int, // 10
  conditions: z.array(z.string()).default([]),
});
export type VatReducedParams = z.infer<typeof vatReducedParams>;

/** ISDE-subsidie NL. */
export const isdeParams = z.object({
  max_cents: int.nonnegative(),
  requires_smart: z.boolean().default(true),
});
export type IsdeParams = z.infer<typeof isdeParams>;

/** CREG-tarief terugbetaling thuisladen bedrijfswagens. */
export const cregTariffParams = z.object({
  cents_per_kwh_by_region: z.object({
    VLA: int.optional(),
    WAL: int.optional(),
    BRU: int.optional(),
  }),
  quarter: z.string(), // "2026-Q3"
});
export type CregTariffParams = z.infer<typeof cregTariffParams>;

export const ruleParamSchemas = {
  capacity_tariff: capacityTariffParams,
  vaa: vaaParams,
  bijtelling: bijtellingParams,
  deductibility: deductibilityParams,
  vat_reduced: vatReducedParams,
  isde: isdeParams,
  creg_tariff: cregTariffParams,
} as const;

export type RuleTypeKey = keyof typeof ruleParamSchemas;
export type RuleParamsFor<T extends RuleTypeKey> = z.infer<(typeof ruleParamSchemas)[T]>;

export function parseRuleParams<T extends RuleTypeKey>(ruleType: T, params: unknown): RuleParamsFor<T> {
  return ruleParamSchemas[ruleType].parse(params) as RuleParamsFor<T>;
}
