// Gegevens voor een merkpagina: uitvoeringen van het merk in deze locale en de sjabloonvariabelen. Geen tekst.
import { advice, type ConnectionKey } from "@/lib/calc";
import type { ModelCardItem } from "@/components/ModelCards";
import { recommendedSeconds } from "@/components/ModelCards";
import type { Copy, MakeFaqVars, MakeHubVars } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { duration, euro, euroPer100Km, int, joinList, kw } from "@/lib/format";
import { COST_DEFAULT_KM, centsPerKwh } from "@/lib/pages/cost";
import type { CostRow } from "@/lib/pages/costRows";

export function makeHubVars(items: ModelCardItem[], locale: Locale): MakeHubVars {
  const make = items[0]!.v.make.name;
  const powers = [...new Set(items.map((i) => i.v.ac_max_w))].sort((a, b) => a - b).map((w) => kw(w, locale));
  const powersText = joinList(powers, locale);
  const secs = items.map((i) => recommendedSeconds(i.v));
  return {
    make,
    count: items.length,
    powers: powersText,
    singlePhaseCount: items.filter((i) => advice(i.v, { region: null, capacity_rule: null }).recommended_connection.startsWith("1f")).length,
    minTime: duration(Math.min(...secs), locale),
    maxTime: duration(Math.max(...secs), locale),
  };
}

const name = (i: ModelCardItem) => `${i.v.vehicle.model} ${i.v.trim}`;

/** Variabelen voor de FAQ van een merkpagina, uit dezelfde berekening als de modelkaarten en de kostentabel. */
export function makeFaqVars(items: ModelCardItem[], costs: CostRow[], locale: Locale, copy: Copy): MakeFaqVars {
  const withAdvice = items.map((i) => ({ i, a: advice(i.v, { region: null, capacity_rule: null }) }));
  const byConn = new Map<ConnectionKey, { w: number; names: string[] }>();
  for (const { i, a } of withAdvice) {
    const w = a.table.find((r) => r.connection === a.recommended_connection)!.effective_w;
    const g = byConn.get(a.recommended_connection) ?? { w, names: [] };
    g.names.push(name(i));
    byConn.set(a.recommended_connection, g);
  }
  const groups = [...byConn.entries()]
    .sort((a, b) => b[1].w - a[1].w)
    .map(([conn, g]) => ({ power: kw(g.w, locale), connection: copy.connections[conn], names: joinList(g.names, locale) }));
  const single = items.filter((i) => i.v.ac_phases === 1);
  const timed = items.map((i) => ({ i, s: recommendedSeconds(i.v) })).sort((a, b) => a.s - b.s);
  const fast = timed[0]!;
  const slow = timed.at(-1)!;
  const own = costs.filter((c) => items.some((i) => i.v.id === c.v.id)).sort((a, b) => a.per100 - b.per100);
  const lang = locale.startsWith("fr") ? "fr" : "nl";
  const lo = own[0];
  const hi = own.at(-1);
  return {
    make: items[0]!.v.make.name,
    count: items.length,
    groups,
    singlePhase: single.length ? { count: single.length, names: joinList(single.map(name), locale), power: kw(Math.max(...single.map((i) => i.v.ac_max_w)), locale) } : null,
    time: { min: duration(fast.s, locale), minName: name(fast.i), max: duration(slow.s, locale), maxName: name(slow.i) },
    cost:
      lo && hi && own.length === items.length
        ? {
            tariff: lo.tariff.label[lang] ?? lo.tariff.slug,
            price: centsPerKwh(Number(lo.tariff.price_cents_per_kwh), locale),
            km: int(COST_DEFAULT_KM, locale),
            min: euroPer100Km(lo.per100, locale),
            minName: `${lo.v.vehicle.model} ${lo.v.trim}`,
            max: euroPer100Km(hi.per100, locale),
            maxName: `${hi.v.vehicle.model} ${hi.v.trim}`,
            yearMin: euro(lo.perYear, locale, { decimals: 0 }),
            yearMax: euro(hi.perYear, locale, { decimals: 0 }),
          }
        : null,
  };
}
