// hreflang-helper (CLAUDE.md §7). Pure functie: pages in, alternates uit.
// Regels: nooit kale "nl"; hreflang alleen naar tegenhangers op index (Google negeert verwijzingen naar noindex-pagina's
// en meldt ze als fout). De taalwissel in de header mag wel naar elke bestaande tegenhanger (index of noindex).
import type { Locale, PageRow } from "@/lib/db/types";
import { LOCALES, LOCALE_CONFIG } from "@/lib/copy";

export type HreflangKey = Locale | "x-default";

export interface Alternates {
  canonical: string; // absolute URL van deze pagina
  languages: Partial<Record<HreflangKey, string>>;
  /** Paden van alle bestaande tegenhangers (index of noindex), voor de taalwissel in de header. */
  switcher: Partial<Record<Locale, string>>;
  ogLocale: string;
  ogAlternateLocales: string[];
}

/**
 * Publieke basis-URL. Volgorde: NEXT_PUBLIC_SITE_URL, Vercel-productiedomein, Vercel-previewdomein, localhost.
 * Lege strings tellen als niet gezet (Vercel geeft lege env-waarden door).
 */
/** "laadgids.be" of "laadgids.be/" wordt "https://laadgids.be"; een volledige URL blijft zoals ze is. */
function withScheme(u: string): string {
  const full = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  return full.replace(/\/+$/, "");
}

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return withScheme(explicit);
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${prod}`;
  const preview = process.env.VERCEL_URL?.trim();
  if (preview) return `https://${preview}`;
  return "http://localhost:3000";
}

/** Vind de tegenhangers van een pagina: zelfde template + entity_id + secondary_id, andere locale. */
export function findCounterparts(page: PageRow, pages: PageRow[]): PageRow[] {
  return pages.filter(
    (p) =>
      p.template === page.template &&
      p.entity_id === page.entity_id &&
      p.secondary_id === page.secondary_id &&
      p.status !== "draft" &&
      LOCALES.includes(p.locale),
  );
}

export function alternatesFor(page: PageRow, pages: PageRow[], base: string = siteUrl()): Alternates {
  const all = findCounterparts(page, pages);
  const self = all.find((p) => p.locale === page.locale) ?? page;
  const indexed = all.filter((p) => p.status === "index");
  const languages: Partial<Record<HreflangKey, string>> = {};
  const switcher: Partial<Record<Locale, string>> = {};
  for (const p of all) switcher[p.locale] = p.path;
  for (const p of indexed) languages[p.locale] = base + p.path;
  // x-default: nl-BE als die op index staat (eerste locale), anders de pagina zelf als die op index staat, anders de eerste op index.
  const xDefault = indexed.find((p) => p.locale === "nl-BE") ?? indexed.find((p) => p.locale === page.locale) ?? indexed[0];
  if (xDefault) languages["x-default"] = base + xDefault.path;

  return {
    canonical: base + self.path,
    languages,
    switcher,
    ogLocale: LOCALE_CONFIG[page.locale].ogLocale,
    ogAlternateLocales: indexed.filter((p) => p.locale !== page.locale).map((p) => LOCALE_CONFIG[p.locale].ogLocale),
  };
}

/**
 * Alternates voor pagina's zonder rij in `pages` (startpagina, sectie-index, statische pagina's): één pad per locale.
 * `indexable` zijn de locales met minstens één pagina op index; alleen die krijgen een hreflang-regel.
 */
export function sectionAlternates(paths: Partial<Record<Locale, string>>, locale: Locale, indexable: Locale[], base: string = siteUrl()): Alternates {
  const languages: Partial<Record<HreflangKey, string>> = {};
  for (const l of LOCALES) if (paths[l] && indexable.includes(l)) languages[l] = base + paths[l];
  const xDefault = (indexable.includes("nl-BE") && paths["nl-BE"]) || (indexable.includes(locale) && paths[locale]) || null;
  if (xDefault) languages["x-default"] = base + xDefault;
  return {
    canonical: base + (paths[locale] ?? ""),
    languages,
    switcher: paths,
    ogLocale: LOCALE_CONFIG[locale].ogLocale,
    ogAlternateLocales: LOCALES.filter((l) => l !== locale && paths[l] && indexable.includes(l)).map((l) => LOCALE_CONFIG[l].ogLocale),
  };
}

/** Titel met sitenaam erachter; past dat niet binnen `max` tekens, dan zonder sitenaam (het zoekwoord staat vooraan). */
export function fitTitle(title: string, siteName: string, max = 60): string {
  const suffix = ` | ${siteName}`;
  const bare = title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
  return bare.length + suffix.length <= max ? bare + suffix : bare;
}

/** Deelafbeelding van de site (app/opengraph-image.tsx) voor pagina's zonder eigen afbeelding. */
export function defaultOgImages(): { url: string; width: number; height: number; alt: string }[] {
  return [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Laadgids" }];
}

/** Bewaker: gooit als een hreflang-sleutel geen regio-code heeft. Gebruikt in tests en in de metadata-laag. */
export function assertValidHreflangKeys(languages: Record<string, string>): void {
  for (const k of Object.keys(languages)) {
    if (k !== "x-default" && !/^[a-z]{2}-[A-Z]{2}$/.test(k)) throw new Error(`invalid hreflang key "${k}"`);
  }
}
