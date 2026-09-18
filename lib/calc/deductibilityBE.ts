import type { Powertrain } from "@/lib/db/types";
import type { DeductibilityParams } from "@/lib/rules/schemas";

/** Aftrekbaarheid vennootschappen BE (CLAUDE.md 6.7). null als de regel het jaar of de powertrain niet kent. */
export function deductibilityBE(powertrain: Powertrain, purchaseYear: number, p: DeductibilityParams): number | null {
  const row = p.by_purchase_year[String(purchaseYear)];
  if (!row) return null;
  const v = row[powertrain];
  return typeof v === "number" ? v : null;
}
