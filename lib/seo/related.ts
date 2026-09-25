// Interne links (CLAUDE.md §7): deterministisch 4 tot 8 links. Geen random.
import type { Locale, PageRow, VersionFull } from "@/lib/db/types";
import { chargerPath, COST_SECTION, LOCALE_CONFIG, RULES_SECTION } from "@/lib/copy";

export interface RelatedLink {
  kind: "sister" | "same_make" | "cost" | "rule";
  path: string;
  label: string;
}

export interface RelatedOptions {
  maxSisters?: number; // default 4
  ruleTopics?: string[]; // topic-slugs in volgorde van voorkeur
}

function fullName(v: VersionFull): string {
  return `${v.make.name} ${v.vehicle.model} ${v.trim}`;
}

/**
 * Zustermodellen: zelfde segment, ander voertuig, gesorteerd op slug; daarna zelfde merk.
 * Laadkosten-tegenhanger en regelpagina's alleen als ze in `pages` bestaan (index of noindex).
 */
export function relatedFor(version: VersionFull, all: VersionFull[], locale: Locale, pages: PageRow[], opts: RelatedOptions = {}): RelatedLink[] {
  const maxSisters = opts.maxSisters ?? 4;
  const cfg = LOCALE_CONFIG[locale];
  const live = new Set(pages.filter((p) => p.locale === locale && p.status !== "draft").map((p) => p.path));
  const out: RelatedLink[] = [];

  const candidates = all
    .filter((v) => v.id !== version.id && v.vehicle_id !== version.vehicle_id && v.sold_in.includes(cfg.country))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const sisters = candidates.filter((v) => v.vehicle.segment && v.vehicle.segment === version.vehicle.segment);
  for (const v of sisters) {
    if (out.length >= maxSisters) break;
    const p = chargerPath(locale, v.slug);
    if (live.has(p)) out.push({ kind: "sister", path: p, label: fullName(v) });
  }
  if (out.length < maxSisters) {
    const sameMake = candidates.filter((v) => v.make.id === version.make.id && !out.some((o) => o.path === chargerPath(locale, v.slug)));
    for (const v of sameMake) {
      if (out.length >= maxSisters) break;
      const p = chargerPath(locale, v.slug);
      if (live.has(p)) out.push({ kind: "same_make", path: p, label: fullName(v) });
    }
  }

  // Laadkosten-tegenhanger: de eerste levende kostenpagina van dit model (baseline-tarief eerst).
  const costPrefix = `/${cfg.segment}/${COST_SECTION[locale]}/${version.slug}/`;
  const costLive = [...live].filter((p) => p.startsWith(costPrefix)).sort((a, b) => (a.endsWith("/vast-dag") ? -1 : b.endsWith("/vast-dag") ? 1 : a.localeCompare(b)));
  if (costLive[0]) out.push({ kind: "cost", path: costLive[0], label: fullName(version) });

  // Regelpagina's staan op gewestniveau (vla/wal/bru) of op landniveau (be/nl); het gewest wint.
  const regions = [cfg.region?.toLowerCase(), cfg.country.toLowerCase()].filter((x): x is string => Boolean(x));
  let rules = 0;
  for (const topic of opts.ruleTopics ?? []) {
    if (rules >= 2) break;
    const p = regions.map((rg) => `/${cfg.segment}/${RULES_SECTION[locale]}/${rg}/${topic}`).find((x) => live.has(x));
    if (p) {
      out.push({ kind: "rule", path: p, label: topic });
      rules++;
    }
  }
  return out;
}
