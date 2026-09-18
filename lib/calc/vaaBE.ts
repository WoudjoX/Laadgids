import type { VaaParams } from "@/lib/rules/schemas";

export interface VaaInput {
  catalog_price_be_cents: number;
  co2_wltp_g_km: number;
  first_registration_year: number;
}

export interface VaaResult {
  co2_pct: number;
  age_years: number;
  age_coeff: number;
  vaa_year_cents: number;
  vaa_month_cents: number;
  net_year_cents: number; // indicatief bij marginale voet
  net_month_cents: number;
  marginal_rate: number;
  min_applied: boolean;
}

/** VAA Belgie (CLAUDE.md 6.5). Parameters uit `rules`, verifieren per aanslagjaar. */
export function vaaBE(input: VaaInput, p: VaaParams, taxYear: number, marginalRate = p.marginal_rate_default): VaaResult {
  if (!(input.catalog_price_be_cents > 0)) throw new Error("catalog_price_be_cents must be positive");
  const raw_pct = p.base_pct + (input.co2_wltp_g_km - p.ref_co2_g_km) * p.step_pct;
  const co2_pct = Math.min(p.max_pct, Math.max(p.min_pct, raw_pct));
  const age_years = Math.max(0, taxYear - input.first_registration_year);
  const age_coeff = p.age_table[Math.min(age_years, p.age_table.length - 1)] ?? 1;
  const computed = input.catalog_price_be_cents * p.catalog_factor * co2_pct * age_coeff;
  const min_applied = computed < p.min_vaa_cents;
  const vaa_year_cents = Math.max(computed, p.min_vaa_cents);
  return {
    co2_pct,
    age_years,
    age_coeff,
    vaa_year_cents,
    vaa_month_cents: vaa_year_cents / 12,
    net_year_cents: vaa_year_cents * marginalRate,
    net_month_cents: (vaa_year_cents * marginalRate) / 12,
    marginal_rate: marginalRate,
    min_applied,
  };
}
