import type { CapacityTariffParams } from "@/lib/rules/schemas";
import type { VersionInput } from "./types";

export interface CapacityScenario {
  charger_w: number;
  peak_without_w: number;
  peak_with_w: number;
  peak_with_lb_w: number;
  /** Jaarkost capaciteitstarief in eurocent (kan fractioneel zijn; afronden bij renderen). */
  cost_without_cents: number;
  cost_with_cents: number;
  cost_with_lb_cents: number;
  delta_cents: number; // extra t.o.v. zonder lader, zonder load balancing
  delta_lb_cents: number; // extra t.o.v. zonder lader, met load balancing
}

export interface CapacityImpactResult {
  household_baseline_w: number;
  min_kw: number;
  cents_per_kw_year: number;
  scenarios: CapacityScenario[];
}

/** Kost van het capaciteitstarief voor een piek in watt (CLAUDE.md 6.3). Nooit onder nul. */
export function capacityCostCents(peak_w: number, p: CapacityTariffParams): number {
  const billable_kw = Math.max(peak_w / 1000, p.min_kw) - p.min_kw;
  return billable_kw * p.cents_per_kw_year;
}

/**
 * Piekimpact van een thuislader op het capaciteitstarief, per ladervermogen (7,4 en 11 kW),
 * zonder en met load balancing. Laders boven het AC-maximum van de auto worden weggelaten
 * (een 7,4 kW-auto trekt geen 11 kW, ook niet aan een 11 kW-paal).
 */
export function capacityImpact(
  version: VersionInput,
  params: CapacityTariffParams,
  household_baseline_w: number = params.household_baseline_w,
  charger_options_w: number[] = [7400, 11000],
): CapacityImpactResult {
  const scenarios = charger_options_w
    .filter((w) => w <= Math.max(version.ac_max_w, 7400))
    .map((charger_w) => {
      const draw_w = Math.min(charger_w, version.ac_max_w);
      const peak_without_w = household_baseline_w;
      const peak_with_w = household_baseline_w + draw_w;
      const peak_with_lb_w = Math.max(household_baseline_w, draw_w);
      const cost_without_cents = capacityCostCents(peak_without_w, params);
      const cost_with_cents = capacityCostCents(peak_with_w, params);
      const cost_with_lb_cents = capacityCostCents(peak_with_lb_w, params);
      return {
        charger_w,
        peak_without_w,
        peak_with_w,
        peak_with_lb_w,
        cost_without_cents,
        cost_with_cents,
        cost_with_lb_cents,
        delta_cents: cost_with_cents - cost_without_cents,
        delta_lb_cents: cost_with_lb_cents - cost_without_cents,
      };
    });
  return { household_baseline_w, min_kw: params.min_kw, cents_per_kw_year: params.cents_per_kw_year, scenarios };
}
