// Regelpagina's (CLAUDE.md 4.1, template 'rule'): handgeschreven hubs met bronnen en datum. Geen berekening.
// Bron van de tekst: data/content/ev-kennisbank.json (geschreven door Erwin). Dit bestand vertaalt die naar de registry.
// Het JSON-bestand is nl-BE en behandelt de drie gewesten in één tekst; de pagina staat daarom op landniveau ("be").
import kennisbankNl from "@/data/content/ev-kennisbank.json";
import kennisbankFr from "@/data/content/ev-kennisbank.fr-BE.json";
import type { Locale } from "@/lib/db/types";

export type RegionSlug = "be" | "vla" | "wal" | "bru" | "nl";

export interface RuleContent {
  locale: Locale;
  region: RegionSlug;
  topic: string; // URL-slug, gelijk aan regels[].slug in de kennisbank
  title: string; // SEO-titel
  h1: string;
  metaDescription: string;
  intro: string; // samenvatting: het antwoord eerst
  linkText: string; // tekst voor interne links naar deze pagina
  updated: string; // laatst gecontroleerd, ISO
  reviewBy: string | null; // herzien voor, ISO
  bodyMd: string; // markdown zonder de eerste H1 (die staat in h1)
  related: string[]; // topic-slugs
  sources: { title: string; url: string; checked: string }[];
  /** Tegenhangers in andere locales delen dezelfde entity_key, zodat hreflang ze kan koppelen. */
  entity_key: string; // "be:btw-6-procent-laadpaal"
  /** false zolang een vertaling niet door Erwin nagelezen is: pagina bestaat, maar staat op noindex. */
  reviewed: boolean;
}

interface KbRule {
  slug: string;
  nl_slug?: string; // bij vertalingen: slug van de Nederlandse tegenhanger
  titel: string;
  h1: string;
  meta_description: string;
  samenvatting: string;
  linktekst: string;
  gewesten: string[];
  gerelateerd: string[];
  laatst_gecontroleerd: string;
  herzien_voor?: string;
  bronnen: { titel: string; url: string }[];
  body_md: string;
}

function stripLeadingH1(md: string): string {
  return md.replace(/^\s*#\s[^\n]*\n+/, "");
}

interface Kb {
  meta: { taal: string; vertaling_gecontroleerd?: boolean };
  regels: KbRule[];
}

function fromKb(r: KbRule, locale: Locale, reviewed: boolean): RuleContent {
  return {
    locale,
    region: "be",
    topic: r.slug,
    title: r.titel,
    h1: r.h1,
    metaDescription: r.meta_description,
    intro: r.samenvatting,
    linkText: r.linktekst,
    updated: r.laatst_gecontroleerd,
    reviewBy: r.herzien_voor ?? null,
    bodyMd: stripLeadingH1(r.body_md),
    related: r.gerelateerd,
    sources: r.bronnen.map((b) => ({ title: b.titel, url: b.url, checked: r.laatst_gecontroleerd })),
    entity_key: `be:${r.nl_slug ?? r.slug}`,
    reviewed,
  };
}

function load(kb: Kb): RuleContent[] {
  const locale = kb.meta.taal as Locale;
  const reviewed = kb.meta.vertaling_gecontroleerd ?? true;
  return kb.regels.map((r) => fromKb(r, locale, reviewed));
}

export const RULES: RuleContent[] = [...load(kennisbankNl as Kb), ...load(kennisbankFr as Kb)];

export function ruleContent(locale: Locale, region: string, topic: string): RuleContent | null {
  return RULES.find((r) => r.locale === locale && r.region === region && r.topic === topic) ?? null;
}

/** Titel voor een interne link naar een regelpagina; null als de pagina niet bestaat in die locale. */
export function ruleLinkText(locale: Locale, topic: string): string | null {
  return RULES.find((r) => r.locale === locale && r.topic === topic)?.linkText ?? null;
}

/** Stabiel numeriek id per entity_key, voor pages.entity_id. */
export function ruleEntityId(entity_key: string): number {
  let h = 0;
  for (const ch of entity_key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 1_000_000_000;
}
