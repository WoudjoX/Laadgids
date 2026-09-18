import type { TariffRow } from "@/lib/db/types";
import type { VersionInput } from "./types";

export const DEFAULT_REAL_WORLD_FACTOR = 1.15;
export const DEFAULT_KM_PER_YEAR = 12_000;

export type TariffInput = Pick<TariffRow, "slug" | "price_cents_per_kwh" | "charging_loss_pct">;

export interface ChargingCostOptions {
  km_per_year?: number;
  real_world_factor?: number;
}

export interface ChargingCostResult {
  tariff_slug: string;
  price_cents_per_kwh: number;
  charging_loss: number;
  km_per_year: number;
  wh_per_km_real: number;
  wh_charged_per_year: number;
  cents_per_year: number;
  cents_per_100km: number;
  full_charge_cents: number;
}

/** Laadkosten per tarief (CLAUDE.md 6.4). Output niet afgerond. */
export function chargingCost(version: VersionInput, tariff: TariffInput, opts: ChargingCostOptions = {}): ChargingCostResult {
  const km_per_year = opts.km_per_year ?? DEFAULT_KM_PER_YEAR;
  const factor = opts.real_world_factor ?? DEFAULT_REAL_WORLD_FACTOR;
  const loss = Number(tariff.charging_loss_pct) / 100;
  if (!(version.consumption_wh_per_km > 0)) throw new Error("consumption_wh_per_km must be positive");
  const wh_per_km_real = version.consumption_wh_per_km * factor;
  const wh_charged_per_year = (wh_per_km_real * km_per_year) / (1 - loss);
  const cents_per_year = (wh_charged_per_year / 1000) * tariff.price_cents_per_kwh;
  const cents_per_100km = ((wh_per_km_real * 100) / (1 - loss) / 1000) * tariff.price_cents_per_kwh;
  const full_charge_cents = (version.battery_net_wh / 1000 / (1 - loss)) * tariff.price_cents_per_kwh;
  return {
    tariff_slug: tariff.slug,
    price_cents_per_kwh: tariff.price_cents_per_kwh,
    charging_loss: loss,
    km_per_year,
    wh_per_km_real,
    wh_charged_per_year,
    cents_per_year,
    cents_per_100km,
    full_charge_cents,
  };
}

export interface TariffComparison {
  rows: ChargingCostResult[];
  cheapest: ChargingCostResult;
  /** 'vast-dag' als aanwezig, anders het duurste tarief. */
  baseline: ChargingCostResult;
  saving_cents_per_year: number; // baseline min cheapest, nooit < 0
}

export function compareTariffs(
  version: VersionInput,
  tariffs: TariffInput[],
  opts: ChargingCostOptions = {},
  baselineSlug = "vast-dag",
): TariffComparison | null {
  if (tariffs.length === 0) return null;
  const rows = tariffs.map((t) => chargingCost(version, t, opts));
  const cheapest = rows.reduce((a, b) => (b.cents_per_year < a.cents_per_year ? b : a));
  const baseline =
    rows.find((r) => r.tariff_slug === baselineSlug) ?? rows.reduce((a, b) => (b.cents_per_year > a.cents_per_year ? b : a));
  return { rows, cheapest, baseline, saving_cents_per_year: Math.max(0, baseline.cents_per_year - cheapest.cents_per_year) };
}
