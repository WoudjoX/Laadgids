// Terugbetaling van thuisladen tegen het CREG-tarief (BE, bedrijfswagen): kWh per jaar uit de laadkostberekening
// × het CREG-tarief van het gewest van de locale. Tarief en kwartaal komen uit `rules` (rule_type creg_tariff). Geen I/O.
import { LOCALE_CONFIG, getCopy, type CregVars } from "@/lib/copy";
import type { Locale, RuleRow, VersionFull } from "@/lib/db/types";
import { centsPerKwh, euro, int } from "@/lib/format";
import { selectRule } from "@/lib/rules/select";
import type { SourceItem } from "./charger";

export interface CregReimbursement {
  vars: CregVars;
  source: SourceItem;
}

/** Null buiten België, zonder gewest, of zonder geldige CREG-regel op `today`. */
export function cregReimbursement(version: VersionFull, rules: RuleRow[], locale: Locale, whPerYear: number, km: number, today: string): CregReimbursement | null {
  const cfg = LOCALE_CONFIG[locale];
  if (cfg.country !== "BE" || !cfg.region) return null;
  const rule = selectRule(rules, { country: "BE", region: cfg.region, rule_type: "creg_tariff", onDate: today });
  const rate = rule?.params.cents_per_kwh_by_region[cfg.region as "VLA" | "WAL" | "BRU"];
  if (!rule || !rate) return null;
  const copy = getCopy(locale);
  const kwhYear = whPerYear / 1000;
  const [year, quarter] = rule.params.quarter.split("-");
  return {
    vars: {
      make: version.make.name,
      model: version.vehicle.model,
      km: int(km, locale),
      kwh: int(kwhYear, locale),
      rate: centsPerKwh(rate, locale),
      quarter: `${quarter} ${year}`,
      region: copy.site.regionLabel[cfg.region],
      perYear: euro(kwhYear * rate, locale, { decimals: 0 }),
    },
    source: { title: copy.charger.sources.cregTitle, url: rule.source_url, checked: rule.source_checked_at },
  };
}
