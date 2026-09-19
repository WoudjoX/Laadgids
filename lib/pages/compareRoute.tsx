// Vergelijkingstool (vergelijk / comparer). Gebruikerstool, noindex: geen pSEO-pagina (CLAUDE.md §2 sluit specs-vergelijkingen als as uit).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { ComparePage } from "@/components/pages/ComparePage";
import { LOCALES, LOCALE_CONFIG, comparePath, getCopy, localeFromSegment } from "@/lib/copy";
import { loadRules, loadTariffs } from "@/lib/db/cached";
import type { Locale } from "@/lib/db/types";
import { compareVersions } from "./compare";
import { modelIndex } from "./modelIndex";

export interface CompareSearch {
  a?: string;
  b?: string;
}

function resolve(section: string, seg: string): Locale | null {
  const locale = localeFromSegment(seg);
  return locale && getCopy(locale).compare.sectionSlug === section ? locale : null;
}

export function compareStaticParams(section: string): { locale: string }[] {
  return LOCALES.filter((l) => getCopy(l).compare.sectionSlug === section).map((l) => ({ locale: LOCALE_CONFIG[l].segment }));
}

export function compareMetadata(section: string, seg: string): Metadata {
  const locale = resolve(section, seg);
  if (!locale) return {};
  const copy = getCopy(locale);
  return { title: `${copy.compare.title} | ${copy.site.name}`, description: copy.compare.metaDescription, robots: { index: false, follow: true } };
}

export async function renderCompare(section: string, seg: string, search: CompareSearch) {
  const locale = resolve(section, seg);
  if (!locale) notFound();
  const copy = getCopy(locale);
  const cfg = LOCALE_CONFIG[locale];
  const options = await modelIndex(locale);
  const a = search.a && options.some((o) => o.v.slug === search.a) ? search.a : null;
  const b = search.b && options.some((o) => o.v.slug === search.b) ? search.b : null;
  const sameError = Boolean(a && b && a === b);

  let result = null;
  if (a && b && !sameError) {
    const [rules, tariffs] = await Promise.all([loadRules(cfg.country), loadTariffs(cfg.country, cfg.region)]);
    const va = options.find((o) => o.v.slug === a)!.v;
    const vb = options.find((o) => o.v.slug === b)!.v;
    result = compareVersions(va, vb, locale, copy, rules, tariffs, new Date().toISOString().slice(0, 10));
  }
  const alternates = Object.fromEntries(LOCALES.map((l) => [l, comparePath(l, a ?? undefined, b ?? undefined)]));
  return (
    <Shell copy={copy} locale={locale} alternates={alternates}>
      <ComparePage copy={copy} locale={locale} options={options} a={a} b={b} result={result} sameError={sameError} />
    </Shell>
  );
}
