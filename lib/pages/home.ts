// Gegevens voor de startpagina: voorbeeldmodel, vertrouwensdatum. Geen tekst.
import type { ModelCardItem } from "@/components/ModelCards";
import { LOCALE_CONFIG } from "@/lib/copy";
import { loadPages, loadRules, loadTariffs } from "@/lib/db/cached";
import type { Locale, RuleRow, TariffRow } from "@/lib/db/types";

export interface HomeData {
  example: ModelCardItem | null;
  rules: RuleRow[];
  tariffs: TariffRow[];
  /** Meest recente controledatum van regels en tarieven in dit land (ISO), null als er geen zijn. */
  checkedAt: string | null;
}

/** Voorbeeld: liefst een gepubliceerde pagina, anders de ID.3, anders het eerste model. */
function pickExample(items: ModelCardItem[], indexPaths: Set<string>): ModelCardItem | null {
  return items.find((i) => indexPaths.has(i.path)) ?? items.find((i) => i.v.slug.startsWith("volkswagen-id3")) ?? items[0] ?? null;
}

export async function homeData(locale: Locale, items: ModelCardItem[]): Promise<HomeData> {
  const cfg = LOCALE_CONFIG[locale];
  const [rules, tariffs, pages] = await Promise.all([loadRules(cfg.country), loadTariffs(cfg.country, cfg.region), loadPages(locale, "charger_for_model")]);
  const indexPaths = new Set(pages.filter((p) => p.status === "index").map((p) => p.path));
  const dates = [...rules.map((r) => r.source_checked_at), ...tariffs.map((t) => t.source_checked_at)].filter(Boolean).sort();
  return { example: pickExample(items, indexPaths), rules, tariffs, checkedAt: dates.at(-1) ?? null };
}
