// Gegevens voor een merkpagina: uitvoeringen van het merk in deze locale en de sjabloonvariabelen. Geen tekst.
import { advice } from "@/lib/calc";
import type { ModelCardItem } from "@/components/ModelCards";
import { recommendedSeconds } from "@/components/ModelCards";
import type { MakeHubVars } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { duration, kw } from "@/lib/format";

export function makeHubVars(items: ModelCardItem[], locale: Locale): MakeHubVars {
  const make = items[0]!.v.make.name;
  const powers = [...new Set(items.map((i) => i.v.ac_max_w))].sort((a, b) => a - b).map((w) => kw(w, locale));
  const powersText = powers.length === 1 ? powers[0]! : `${powers.slice(0, -1).join(", ")} ${locale === "fr-BE" ? "et" : "en"} ${powers.at(-1)}`;
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
