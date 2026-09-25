import type { Country, Locale, Region } from "@/lib/db/types";
import { frBE } from "./fr-BE";
import { nlBE } from "./nl-BE";
import { nlNL } from "./nl-NL";
import type { Copy } from "./types";

export type { Copy, ChargerPageVars, CostPageVars, FaqItem } from "./types";

export const LOCALES: readonly Locale[] = ["nl-BE", "fr-BE", "nl-NL"];

/** Locale-configuratie: padsegment, land, standaardgewest voor P1-pagina's. */
export interface LocaleConfig {
  locale: Locale;
  segment: string; // "nl-be"
  country: Country;
  /** Gewest waarvoor de P1-pagina rekent. fr-BE rekent voor Wallonië; Brussel krijgt later een eigen variant. */
  region: Region | null;
  htmlLang: string;
  ogLocale: string;
}

export const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  "nl-BE": { locale: "nl-BE", segment: "nl-be", country: "BE", region: "VLA", htmlLang: "nl-BE", ogLocale: "nl_BE" },
  "fr-BE": { locale: "fr-BE", segment: "fr-be", country: "BE", region: "WAL", htmlLang: "fr-BE", ogLocale: "fr_BE" },
  "nl-NL": { locale: "nl-NL", segment: "nl-nl", country: "NL", region: null, htmlLang: "nl-NL", ogLocale: "nl_NL" },
};

export function localeFromSegment(segment: string): Locale | null {
  const found = LOCALES.find((l) => LOCALE_CONFIG[l].segment === segment);
  return found ?? null;
}

export function getCopy(locale: Locale): Copy {
  switch (locale) {
    case "nl-BE":
      return nlBE;
    case "fr-BE":
      return frBE;
    case "nl-NL":
      return nlNL;
  }
}

/** Pad van een P1-pagina in een locale. */
export function chargerPath(locale: Locale, versionSlug: string): string {
  return `/${LOCALE_CONFIG[locale].segment}/${getCopy(locale).charger.sectionSlug}/${versionSlug}`;
}

/** Pad van een laadkosten-pagina: /nl-be/laadkosten/{versie}/{tarief}. */
export function costPath(locale: Locale, versionSlug: string, tariffSlug: string): string {
  return `/${LOCALE_CONFIG[locale].segment}/${COST_SECTION[locale]}/${versionSlug}/${tariffSlug}`;
}

/** Pad van een regelpagina: /nl-be/regels/vla/btw-6. */
export function rulePath(locale: Locale, region: string, topic: string): string {
  return `/${LOCALE_CONFIG[locale].segment}/${RULES_SECTION[locale]}/${region}/${topic}`;
}

/** Slug van de sectie laadkosten per locale (fase 2). */
export const COST_SECTION: Record<Locale, string> = { "nl-BE": "laadkosten", "fr-BE": "cout-recharge", "nl-NL": "laadkosten" };
export const RULES_SECTION: Record<Locale, string> = { "nl-BE": "regels", "fr-BE": "regles", "nl-NL": "regels" };

/** Pad van de vergelijkingspagina, optioneel met model A voorgeselecteerd. */
export function comparePath(locale: Locale, a?: string, b?: string): string {
  const base = `/${LOCALE_CONFIG[locale].segment}/${getCopy(locale).compare.sectionSlug}`;
  const q = new URLSearchParams();
  if (a) q.set("a", a);
  if (b) q.set("b", b);
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}
