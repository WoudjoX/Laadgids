// Vergelijking van twee versies: dezelfde assemblage als de P1-pagina, naast elkaar gezet. Geen eigen berekening.
import type { Copy } from "@/lib/copy";
import type { Locale, RuleRow, TariffRow, VersionFull } from "@/lib/db/types";
import { duration, euro, kw, kwh } from "@/lib/format";
import { buildChargerPage, type ChargerPageData } from "./charger";

export interface CompareRow {
  label: string;
  a: string;
  b: string;
  /** Welke kant beter is: lager is beter voor tijd en kosten, hoger voor vermogen, batterij en range. */
  better: "a" | "b" | null;
}

export interface CompareResult {
  a: ChargerPageData;
  b: ChargerPageData;
  rows: CompareRow[];
}

function pick(a: number | null | undefined, b: number | null | undefined, lowerIsBetter: boolean): "a" | "b" | null {
  if (a == null || b == null || a === b) return null;
  return (a < b) === lowerIsBetter ? "a" : "b";
}

export function compareVersions(va: VersionFull, vb: VersionFull, locale: Locale, copy: Copy, rules: RuleRow[], tariffs: TariffRow[], today: string): CompareResult {
  const a = buildChargerPage(va, locale, rules, tariffs, today);
  const b = buildChargerPage(vb, locale, rules, tariffs, today);
  const r = copy.compare.rows;
  const t = (d: ChargerPageData, key: "1f_32a_7400" | "3f_16a_11000") => d.advice.table.find((x) => x.connection === key)!;
  const rec = (d: ChargerPageData) => d.advice.table.find((x) => x.connection === d.advice.recommended_connection)!;
  const day = (d: ChargerPageData) => d.cost?.baseline ?? null;
  const cap11 = (d: ChargerPageData) => d.advice.capacity?.scenarios.find((s) => s.charger_w === 11000) ?? null;

  const rows: CompareRow[] = [
    { label: r.acMax, a: kw(va.ac_max_w, locale), b: kw(vb.ac_max_w, locale), better: pick(va.ac_max_w, vb.ac_max_w, false) },
    { label: r.battery, a: kwh(va.battery_net_wh, locale), b: kwh(vb.battery_net_wh, locale), better: pick(va.battery_net_wh, vb.battery_net_wh, false) },
    {
      label: r.range,
      a: va.wltp_range_km ? `${va.wltp_range_km} km` : "–",
      b: vb.wltp_range_km ? `${vb.wltp_range_km} km` : "–",
      better: pick(va.wltp_range_km, vb.wltp_range_km, false),
    },
    { label: r.recommended, a: copy.connections[a.advice.recommended_connection], b: copy.connections[b.advice.recommended_connection], better: null },
    { label: r.timeRecommended, a: duration(rec(a).seconds, locale), b: duration(rec(b).seconds, locale), better: pick(rec(a).seconds, rec(b).seconds, true) },
    { label: r.time74, a: duration(t(a, "1f_32a_7400").seconds, locale), b: duration(t(b, "1f_32a_7400").seconds, locale), better: pick(t(a, "1f_32a_7400").seconds, t(b, "1f_32a_7400").seconds, true) },
    { label: r.time11, a: duration(t(a, "3f_16a_11000").seconds, locale), b: duration(t(b, "3f_16a_11000").seconds, locale), better: pick(t(a, "3f_16a_11000").seconds, t(b, "3f_16a_11000").seconds, true) },
  ];
  if (a.cost && b.cost) {
    rows.push(
      { label: r.costFullCheapest, a: euro(a.cost.cheapest.full_charge_cents, locale, { decimals: 2 }), b: euro(b.cost.cheapest.full_charge_cents, locale, { decimals: 2 }), better: pick(a.cost.cheapest.full_charge_cents, b.cost.cheapest.full_charge_cents, true) },
      ...(a.cost.baseline.tariff_slug !== a.cost.cheapest.tariff_slug
        ? [{ label: r.costFullDay, a: euro(day(a)!.full_charge_cents, locale, { decimals: 2 }), b: euro(day(b)!.full_charge_cents, locale, { decimals: 2 }), better: pick(day(a)!.full_charge_cents, day(b)!.full_charge_cents, true) }]
        : []),
      { label: r.cost100Cheapest, a: euro(a.cost.cheapest.cents_per_100km, locale, { decimals: 2 }), b: euro(b.cost.cheapest.cents_per_100km, locale, { decimals: 2 }), better: pick(a.cost.cheapest.cents_per_100km, b.cost.cheapest.cents_per_100km, true) },
    );
  }
  if (r.capacity11 && (cap11(a) || cap11(b))) {
    const ca = cap11(a);
    const cb = cap11(b);
    rows.push({
      label: r.capacity11,
      a: ca ? euro(ca.delta_cents, locale, { decimals: 0 }) : "–",
      b: cb ? euro(cb.delta_cents, locale, { decimals: 0 }) : "–",
      better: pick(ca?.delta_cents, cb?.delta_cents, true),
    });
  }
  return { a, b, rows };
}
