// Gedeelde logica voor de P1-routes (laadpaal-voor / borne-pour): params, metadata, render.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { ChargerPage } from "@/components/pages/ChargerPage";
import { LOCALE_CONFIG, LOCALES, getCopy, localeFromSegment } from "@/lib/copy";
import { loadAllVersions, loadPages, loadRules, loadTariffs, loadVersion } from "@/lib/db/cached";
import type { Locale } from "@/lib/db/types";
import { buildChargerPage } from "@/lib/pages/charger";
import { alternatesFor, assertValidHreflangKeys } from "@/lib/seo/alternates";
import { relatedFor } from "@/lib/seo/related";

export interface ChargerParams {
  locale: string;
  slug: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Locales waarvan de sectie-slug bij deze route hoort (nl: laadpaal-voor, fr: borne-pour). */
function localesForSection(section: string): Locale[] {
  return LOCALES.filter((l) => getCopy(l).charger.sectionSlug === section);
}

export async function chargerStaticParams(section: string): Promise<ChargerParams[]> {
  const out: ChargerParams[] = [];
  for (const locale of localesForSection(section)) {
    const pages = await loadPages(locale, "charger_for_model");
    for (const p of pages) {
      const slug = p.path.split("/").pop();
      if (slug) out.push({ locale: LOCALE_CONFIG[locale].segment, slug });
    }
  }
  return out;
}

async function resolve(section: string, params: ChargerParams) {
  const locale = localeFromSegment(params.locale);
  if (!locale || getCopy(locale).charger.sectionSlug !== section) return null;
  const path = `/${params.locale}/${section}/${params.slug}`;
  const pages = await loadPages(undefined, "charger_for_model");
  const page = pages.find((p) => p.path === path && p.locale === locale);
  if (!page || page.status === "draft") return null;
  const version = await loadVersion(params.slug);
  if (!version) return null;
  return { locale, page, pages, version };
}

export async function chargerMetadata(section: string, params: ChargerParams): Promise<Metadata> {
  const r = await resolve(section, params);
  if (!r) return {};
  const cfg = LOCALE_CONFIG[r.locale];
  const [rules, tariffs] = await Promise.all([loadRules(cfg.country), loadTariffs(cfg.country, cfg.region)]);
  const data = buildChargerPage(r.version, r.locale, rules, tariffs, today());
  const alt = alternatesFor(r.page, r.pages);
  assertValidHreflangKeys(alt.languages as Record<string, string>);
  return {
    title: data.copy.charger.metaTitle(data.vars),
    description: data.copy.charger.metaDescription(data.vars),
    alternates: { canonical: alt.canonical, languages: alt.languages },
    robots: r.page.status === "index" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: data.copy.charger.metaTitle(data.vars),
      description: data.copy.charger.metaDescription(data.vars),
      url: alt.canonical,
      locale: alt.ogLocale,
      alternateLocale: alt.ogAlternateLocales,
      type: "article",
      siteName: data.copy.site.name,
    },
  };
}

export async function renderCharger(section: string, params: ChargerParams) {
  const r = await resolve(section, params);
  if (!r) notFound();
  const cfg = LOCALE_CONFIG[r.locale];
  const [rules, tariffs, all, allPages] = await Promise.all([
    loadRules(cfg.country),
    loadTariffs(cfg.country, cfg.region),
    loadAllVersions(),
    loadPages(r.locale),
  ]);
  const data = buildChargerPage(r.version, r.locale, rules, tariffs, today());
  const related = relatedFor(r.version, all, r.locale, allPages, { ruleTopics: Object.keys(data.copy.rulesPages) });
  const alt = alternatesFor(r.page, r.pages);
  return (
    <Shell copy={data.copy} locale={r.locale} alternates={alt.languages}>
      <ChargerPage data={data} locale={r.locale} page={r.page} related={related} canonical={alt.canonical} />
    </Shell>
  );
}
