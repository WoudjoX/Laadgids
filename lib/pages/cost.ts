// Assemblage van een charging_cost-pagina (CLAUDE.md 4.1): één model, één tarief. Geen I/O, geen tekst.
import { advice, chargingCost, DEFAULT_REAL_WORLD_FACTOR, type ChargingCostResult } from "@/lib/calc";
import { LOCALE_CONFIG, chargerPath, costPath, getCopy, type Copy, type CostPageVars } from "@/lib/copy";
import type { Locale, TariffRow, VersionFull } from "@/lib/db/types";
import { euro, euroPer100Km, int, kw, kwh } from "@/lib/format";
import type { SourceItem } from "./charger";

export const COST_KM_SCENARIOS = [8_000, 12_000, 16_000, 20_000, 25_000] as const;
export const COST_DEFAULT_KM = 12_000;

export interface CostPageData {
  copy: Copy;
  vars: CostPageVars;
  tariff: TariffRow;
  result: ChargingCostResult;
  byKm: { km: number; cents_per_year: number }[];
  others: { tariff: TariffRow; result: ChargingCostResult }[];
  sources: SourceItem[];
  updatedAt: string;
}

function centsPerKwh(price: number, locale: Locale): string {
  const n = new Intl.NumberFormat(locale === "fr-BE" ? "fr-BE" : "nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  return locale === "fr-BE" ? `${n} centimes` : `${n} cent`;
}

export function buildCostPage(version: VersionFull, locale: Locale, tariff: TariffRow, allTariffs: TariffRow[], today: string): CostPageData {
  const copy = getCopy(locale);
  const cfg = LOCALE_CONFIG[locale];
  const lang = locale.startsWith("fr") ? "fr" : "nl";
  const result = chargingCost(version, tariff, { km_per_year: COST_DEFAULT_KM });
  const byKm = COST_KM_SCENARIOS.map((km) => ({ km, cents_per_year: chargingCost(version, tariff, { km_per_year: km }).cents_per_year }));
  const others = allTariffs.filter((t) => t.slug !== tariff.slug).map((t) => ({ tariff: t, result: chargingCost(version, t, { km_per_year: COST_DEFAULT_KM }) }));
  const cons = new Intl.NumberFormat(lang === "fr" ? "fr-BE" : "nl-BE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(version.consumption_wh_per_km / 10);

  const vars: CostPageVars = {
    locale,
    make: version.make.name,
    model: version.vehicle.model,
    trim: version.trim,
    fullName: `${version.make.name} ${version.vehicle.model} ${version.trim}${version.model_year ? ` (${version.model_year})` : ""}`,
    region: cfg.region,
    tariffLabel: tariff.label[lang] ?? tariff.slug,
    pricePerKwh: centsPerKwh(Number(tariff.price_cents_per_kwh), locale),
    batteryNet: kwh(version.battery_net_wh, locale),
    consumptionWltp: `${cons} kWh/100 km`,
    per100km: euroPer100Km(result.cents_per_100km, locale),
    perFull: euro(result.full_charge_cents, locale, { decimals: 2 }),
    perYear: euro(result.cents_per_year, locale, { decimals: 0 }),
    kmPerYear: int(COST_DEFAULT_KM, locale),
    realWorldPct: `${int(Math.round((DEFAULT_REAL_WORLD_FACTOR - 1) * 100), locale)} %`,
    lossPct: `${int(Math.round(result.charging_loss * 100), locale)} %`,
    otherTariffs: others.map((o) => ({
      label: o.tariff.label[lang] ?? o.tariff.slug,
      per100km: euroPer100Km(o.result.cents_per_100km, locale),
      perYear: euro(o.result.cents_per_year, locale, { decimals: 0 }),
      path: costPath(locale, version.slug, o.tariff.slug),
    })),
    chargerPath: chargerPath(locale, version.slug),
    recommendedKw: kw(advice(version, { region: null, capacity_rule: null }).recommended_w, locale),
  };

  const sources: SourceItem[] = [
    { title: `${version.make.name} ${version.vehicle.model}: specificaties`, url: version.spec_source_url, checked: version.spec_source_date },
    { title: `${vars.tariffLabel}: ${vars.pricePerKwh}/kWh`, url: tariff.source_url, checked: tariff.source_checked_at },
  ];
  const updatedAt = [version.spec_source_date, tariff.source_checked_at].sort().at(-1) ?? today;
  return { copy, vars, tariff, result, byKm, others, sources, updatedAt };
}
