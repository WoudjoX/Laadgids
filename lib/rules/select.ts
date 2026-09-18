import type { RuleRow, Country, Region, RuleType } from "@/lib/db/types";
import { parseRuleParams, type RuleParamsFor, type RuleTypeKey } from "./schemas";

/**
 * Kiest uit een lijst regels de geldende regel op `onDate` voor (country, region, type).
 * Regels met region=null gelden voor het hele land; een gewestregel wint van een landregel.
 * Pure functie, geen I/O.
 */
export function selectRule<T extends RuleTypeKey>(
  rules: RuleRow[],
  q: { country: Country; region: Region | null; rule_type: T; onDate: string },
): (RuleRow<RuleParamsFor<T>> & { rule_type: T }) | null {
  const candidates = rules.filter(
    (r) =>
      r.country === q.country &&
      r.rule_type === (q.rule_type as RuleType) &&
      (r.region === null || r.region === q.region) &&
      r.valid_from <= q.onDate &&
      (r.valid_to === null || r.valid_to >= q.onDate),
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if ((a.region === null) !== (b.region === null)) return a.region === null ? 1 : -1;
    return b.valid_from.localeCompare(a.valid_from);
  });
  const chosen = candidates[0]!;
  return { ...chosen, rule_type: q.rule_type, params: parseRuleParams(q.rule_type, chosen.params) };
}
