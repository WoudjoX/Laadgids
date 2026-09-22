// Indexatiebeleid (CLAUDE.md 4.3). Pure functie; gebruikt door recalc-pages en de lokale repo.
import { completeness } from "@/lib/calc/completeness";
import { LOCALE_CONFIG } from "@/lib/copy";
import type { Locale, PageStatus, Template, VersionRow } from "@/lib/db/types";

export interface PageDecision {
  completeness_score: number;
  status: PageStatus;
  reasons: string[];
}

export interface DecisionOptions {
  /** Bronnen die nog een TODO(verify) hebben: pagina blijft noindex tot Erwin ze nakijkt. */
  unverified?: boolean;
}

/**
 * index alleen als: completeness 1.0, model verkocht in het land van de locale,
 * de berekening onderscheidend is (auto heeft echte AC-specs, geen importer-defaults),
 * en Erwin de specs tegen de fabrikantenbron gelegd heeft (verified_at, definition of done punt 5).
 * Anders noindex (wel intern gelinkt). draft alleen als de berekening zelf onmogelijk is.
 */
export function decidePageStatus(version: VersionRow, locale: Locale, template: Template, opts: DecisionOptions = {}): PageDecision {
  const reasons: string[] = [];
  const score = completeness(version, template);
  const country = LOCALE_CONFIG[locale].country;

  if (!(version.battery_net_wh > 0) || !(version.ac_max_w > 0)) {
    return { completeness_score: score, status: "draft", reasons: ["calculation impossible: missing battery or ac power"] };
  }
  if (score < 1) reasons.push(`completeness ${score.toFixed(2)} < 1`);
  if (!version.sold_in.includes(country)) reasons.push(`not sold in ${country}`);
  if (!isDistinctive(version)) reasons.push("all calc inputs at default values");
  if (opts.unverified) reasons.push("source not verified (TODO(verify))");
  if (!version.verified_at) reasons.push("specs not verified against manufacturer source (versions.verified_at is null)");

  return { completeness_score: score, status: reasons.length === 0 ? "index" : "noindex", reasons };
}

/**
 * Een pagina is onderscheidend als de rekeninput niet louter uit importer-defaults bestaat.
 * We importeren zonder defaults (leeg in plaats van raden), dus dit vangt alleen rijen die
 * per ongeluk toch een placeholder-profiel kregen.
 */
export function isDistinctive(version: Pick<VersionRow, "ac_max_w" | "ac_phases" | "battery_net_wh" | "consumption_wh_per_km">): boolean {
  const placeholder = version.ac_max_w === 11000 && version.ac_phases === 3 && version.battery_net_wh === 60000 && version.consumption_wh_per_km === 160;
  return !placeholder;
}
