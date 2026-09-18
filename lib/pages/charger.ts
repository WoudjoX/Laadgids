// Assemblage van een charger_for_model-pagina: data + calc + copy-variabelen. Geen I/O.
import { advice, compareTariffs, connection, type AdviceResult, type TariffComparison } from "@/lib/calc";
import { LOCALE_CONFIG, getCopy, type ChargerPageVars, type Copy } from "@/lib/copy";
import type { Locale, RuleRow, TariffRow, VersionFull } from "@/lib/db/types";
import { duration, euro, int, kw, kwh } from "@/lib/format";
import { selectRule } from "@/lib/rules/select";

export interface SourceItem {
  title: string;
  url: string;
  checked: string; // ISO
}

export interface ChargerPageData {
  copy: Copy;
  vars: ChargerPageVars;
  advice: AdviceResult;
  cost: TariffComparison | null;
  tariffs: TariffRow[];
  sources: SourceItem[];
  updatedAt: string; // ISO
  capacityRuleNotes: string | null;
}

export const CHARGE_FROM = 20;
export const CHARGE_TO = 80;
export const KM_PER_YEAR = 12_000;

/** Kostenblok P1 (CLAUDE.md 4.2 punt 7): vast dag / vast nacht / dynamisch slim. Zonnepanelen pas op de laadkosten-pagina's. */
export const P1_TARIFF_SLUGS = ["vast-dag", "vast-nacht", "dynamisch-slim"] as const;

export function buildChargerPage(version: VersionFull, locale: Locale, rules: RuleRow[], allTariffs: TariffRow[], today: string): ChargerPageData {
  const cfg = LOCALE_CONFIG[locale];
  const copy = getCopy(locale);
  const tariffs = P1_TARIFF_SLUGS.map((s) => allTariffs.find((t) => t.slug === s)).filter((t): t is TariffRow => Boolean(t));

  const capRule = selectRule(rules, { country: cfg.country, region: cfg.region, rule_type: "capacity_tariff", onDate: today });
  const a = advice(version, { region: cfg.region, capacity_rule: capRule?.params ?? null, charge: { from_pct: CHARGE_FROM, to_pct: CHARGE_TO } });
  const cost = compareTariffs(version, tariffs, { km_per_year: KM_PER_YEAR });

  const rec = a.table.find((r) => r.connection === a.recommended_connection)!;
  const recConn = connection(a.recommended_connection);
  const cheapestTariff = cost ? tariffs.find((t) => t.slug === cost.cheapest.tariff_slug) : null;
  const lang = locale.startsWith("fr") ? "fr" : "nl";

  const cap11 = a.capacity?.scenarios.find((s) => s.charger_w === 11000) ?? null;
  const cap74 = a.capacity?.scenarios.find((s) => s.charger_w === 7400) ?? null;
  const capMain = cap11 ?? cap74;

  const vars: ChargerPageVars = {
    locale,
    make: version.make.name,
    model: version.vehicle.model,
    trim: version.trim,
    model_year: version.model_year,
    fullName: `${version.make.name} ${version.vehicle.model} ${version.trim}${version.model_year ? ` (${version.model_year})` : ""}`,
    region: cfg.region,
    batteryNet: kwh(version.battery_net_wh, locale),
    acMax: kw(version.ac_max_w, locale),
    acPhases: version.ac_phases,
    recommendedLabel: `${copy.connections[a.recommended_connection]}, ${kw(recConn.max_w, locale)}`,
    recommendedKw: kw(a.recommended_w, locale),
    recommendedTime: duration(rec.seconds, locale),
    fromPct: CHARGE_FROM,
    toPct: CHARGE_TO,
    advice: a,
    cost,
    cheapestLabel: cheapestTariff ? (cheapestTariff.label[lang] ?? cheapestTariff.slug) : null,
    cheapestFull: cost ? euro(cost.cheapest.full_charge_cents, locale, { decimals: 2 }) : null,
    savingYear: cost && cost.saving_cents_per_year > 0 ? euro(cost.saving_cents_per_year, locale, { decimals: 0 }) : null,
    kmPerYear: int(KM_PER_YEAR, locale),
    capacity11: cap11,
    capacity74: cap74,
    capacityDelta: capMain ? euro(capMain.delta_cents, locale, { decimals: 0 }) : null,
    capacityDeltaLb: capMain ? euro(capMain.delta_lb_cents, locale, { decimals: 0 }) : null,
  };

  const sources: SourceItem[] = [{ title: `${version.make.name} ${version.vehicle.model}: specificaties`, url: version.spec_source_url, checked: version.spec_source_date }];
  if (capRule) sources.push({ title: "VREG / Fluvius: capaciteitstarief", url: capRule.source_url, checked: capRule.source_checked_at });
  const seenTariffSources = new Set<string>();
  for (const t of tariffs) {
    if (seenTariffSources.has(t.source_url)) continue;
    seenTariffSources.add(t.source_url);
    sources.push({ title: "CREG boordtabel: elektriciteitsprijzen", url: t.source_url, checked: t.source_checked_at });
  }

  const updatedAt = [version.spec_source_date, capRule?.source_checked_at, ...tariffs.map((t) => t.source_checked_at)].filter(Boolean).sort().at(-1) ?? today;

  return { copy, vars, advice: a, cost, tariffs, sources, updatedAt, capacityRuleNotes: capRule?.notes ?? null };
}
