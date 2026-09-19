// Lijst van modellen met een levende P1-pagina in een locale, gesorteerd op merk en model.
import type { ModelCardItem } from "@/components/ModelCards";
import { LOCALE_CONFIG } from "@/lib/copy";
import { loadAllVersions, loadPages } from "@/lib/db/cached";
import type { Locale, VersionFull } from "@/lib/db/types";

export async function modelIndex(locale: Locale): Promise<ModelCardItem[]> {
  const cfg = LOCALE_CONFIG[locale];
  const [pages, versions] = await Promise.all([loadPages(locale, "charger_for_model"), loadAllVersions()]);
  const bySlug = new Map(versions.map((v) => [v.slug, v]));
  return pages
    .filter((p) => p.status !== "draft")
    .map((p) => ({ path: p.path, v: bySlug.get(p.path.split("/").pop() ?? "") as VersionFull }))
    .filter((x) => x.v && x.v.sold_in.includes(cfg.country))
    .sort((a, b) => `${a.v.make.name} ${a.v.vehicle.model}`.localeCompare(`${b.v.make.name} ${b.v.vehicle.model}`));
}
