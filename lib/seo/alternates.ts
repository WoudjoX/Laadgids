// hreflang-helper (CLAUDE.md §7). Pure functie: pages in, alternates uit.
// Regels: nooit kale "nl"; alleen verwijzen naar pagina's die bestaan (status index of noindex).
import type { Locale, PageRow } from "@/lib/db/types";
import { LOCALES, LOCALE_CONFIG } from "@/lib/copy";

export type HreflangKey = Locale | "x-default";

export interface Alternates {
  canonical: string; // absolute URL van deze pagina
  languages: Partial<Record<HreflangKey, string>>;
  ogLocale: string;
  ogAlternateLocales: string[];
}

/**
 * Publieke basis-URL. Volgorde: NEXT_PUBLIC_SITE_URL, Vercel-productiedomein, Vercel-previewdomein, localhost.
 * Lege strings tellen als niet gezet (Vercel geeft lege env-waarden door).
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
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
  const languages: Partial<Record<HreflangKey, string>> = {};
  for (const p of all) {
    languages[p.locale] = base + p.path;
  }
  // x-default: nl-BE als die bestaat (eerste locale), anders de pagina zelf.
  const xDefault = all.find((p) => p.locale === "nl-BE") ?? self;
  languages["x-default"] = base + xDefault.path;

  return {
    canonical: base + self.path,
    languages,
    ogLocale: LOCALE_CONFIG[page.locale].ogLocale,
    ogAlternateLocales: all.filter((p) => p.locale !== page.locale).map((p) => LOCALE_CONFIG[p.locale].ogLocale),
  };
}

/** Bewaker: gooit als een hreflang-sleutel geen regio-code heeft. Gebruikt in tests en in de metadata-laag. */
export function assertValidHreflangKeys(languages: Record<string, string>): void {
  for (const k of Object.keys(languages)) {
    if (k !== "x-default" && !/^[a-z]{2}-[A-Z]{2}$/.test(k)) throw new Error(`invalid hreflang key "${k}"`);
  }
}
