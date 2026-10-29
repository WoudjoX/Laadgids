// Laadkost per uitvoering op het referentietarief, voor de overzichten (laadkostenindex, merkpagina). Eén rij per uitvoering.
import { compareTariffs } from "@/lib/calc";
import { LOCALE_CONFIG } from "@/lib/copy";
import { loadAllVersions, loadPages, loadTariffs } from "@/lib/db/cached";
import type { Locale, TariffRow, VersionFull } from "@/lib/db/types";
import { COST_DEFAULT_KM } from "@/lib/pages/cost";

export interface CostRow {
  path: string; // laadkostenpagina op het referentietarief
  v: VersionFull;
  tariff: TariffRow;
  per100: number; // cent
  perYear: number; // cent, bij COST_DEFAULT_KM
}

/** Leeg als de locale geen laadkostenpagina's heeft (nl-NL heeft nog geen tarieven). */
export async function costRows(locale: Locale): Promise<CostRow[]> {
  const cfg = LOCALE_CONFIG[locale];
  const [pages, versions, tariffs] = await Promise.all([loadPages(locale, "charging_cost"), loadAllVersions(), loadTariffs(cfg.country, cfg.region)]);
  const live = pages.filter((p) => p.status !== "draft");
  const out: CostRow[] = [];
  for (const v of versions) {
    const own = live.filter((p) => p.entity_id === v.id);
    const avail = tariffs.filter((t) => own.some((p) => p.secondary_id === t.id));
    // Referentietarief zoals op de modelpagina: 'vast-dag' als die er is (compareTariffs).
    const base = compareTariffs(v, avail, { km_per_year: COST_DEFAULT_KM })?.baseline;
    const tariff = base && avail.find((t) => t.slug === base.tariff_slug);
    const page = tariff && own.find((p) => p.secondary_id === tariff.id);
    if (!base || !tariff || !page) continue;
    out.push({ path: page.path, v, tariff, per100: base.cents_per_100km, perYear: base.cents_per_year });
  }
  return out;
}
