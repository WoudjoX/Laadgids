// Regelpagina's (CLAUDE.md 4.1, template 'rule'): handgeschreven hubs met bronnen en datum. Geen berekening.
// Een pagina bestaat alleen als hier een entry staat. De tekst schrijft Erwin; dit bestand is de registry.
// Topic-slugs per locale staan in lib/copy/{locale}.ts onder rulesPages; de region-slug is het gewest in kleine letters.
import type { Locale } from "@/lib/db/types";

export type RegionSlug = "vla" | "wal" | "bru" | "nl";

export interface RuleSection {
  heading: string;
  paragraphs: string[];
}

export interface RuleContent {
  locale: Locale;
  region: RegionSlug;
  topic: string; // slug uit copy.rulesPages
  title: string;
  intro: string; // 2 tot 4 zinnen, het antwoord eerst
  updated: string; // ISO-datum van de laatste inhoudelijke controle
  sections: RuleSection[];
  sources: { title: string; url: string; checked: string }[];
  /** Tegenhangers in andere locales delen dezelfde entity_key, zodat hreflang ze kan koppelen. */
  entity_key: string; // bv. "vla:btw-6"
}

/** Leeg tot de eerste zes nl-BE-pagina's geschreven zijn. Voeg entries toe en draai pnpm recalc-pages. */
export const RULES: RuleContent[] = [];

export function ruleContent(locale: Locale, region: string, topic: string): RuleContent | null {
  return RULES.find((r) => r.locale === locale && r.region === region && r.topic === topic) ?? null;
}

/** Stabiel numeriek id per entity_key, voor pages.entity_id. */
export function ruleEntityId(entity_key: string): number {
  let h = 0;
  for (const ch of entity_key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 1_000_000_000;
}
