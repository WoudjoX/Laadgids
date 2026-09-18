import type { BijtellingParams } from "@/lib/rules/schemas";

export interface BijtellingResult {
  capped_cents: number;
  bijtelling_year_cents: number;
  bijtelling_month_cents: number;
  net_per_month_by_rate: { rate: number; cents: number }[];
  fixed_months: number;
}

/** Bijtelling NL (CLAUDE.md 6.6). Percentages uit de regel voor het registratiejaar. */
export function bijtellingNL(catalog_price_nl_cents: number, p: BijtellingParams): BijtellingResult {
  if (!(catalog_price_nl_cents > 0)) throw new Error("catalog_price_nl_cents must be positive");
  const capped_cents = Math.min(catalog_price_nl_cents, p.cap_cents);
  const bijtelling_year_cents = capped_cents * p.low_pct + (catalog_price_nl_cents - capped_cents) * p.high_pct;
  return {
    capped_cents,
    bijtelling_year_cents,
    bijtelling_month_cents: bijtelling_year_cents / 12,
    net_per_month_by_rate: p.net_rates.map((rate) => ({ rate, cents: (bijtelling_year_cents * rate) / 12 })),
    fixed_months: p.fixed_months,
  };
}
