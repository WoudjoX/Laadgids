// Gedeelde logica voor de laadkosten-routes (laadkosten / cout-recharge): params, metadata, render.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { CostPage } from "@/components/pages/CostPage";
import { COST_SECTION, LOCALE_CONFIG, LOCALES, getCopy, localeFromSegment } from "@/lib/copy";
import { loadPages, loadTariffs, loadVersion } from "@/lib/db/cached";
import type { Locale } from "@/lib/db/types";
import { buildCostPage } from "@/lib/pages/cost";
import { alternatesFor, assertValidHreflangKeys } from "@/lib/seo/alternates";

export interface CostParams {
  locale: string;
  slug: string;
  tariff: string;
}

function localesForSection(section: string): Locale[] {
  return LOCALES.filter((l) => COST_SECTION[l] === section);
}

export async function costStaticParams(section: string): Promise<CostParams[]> {
  const out: CostParams[] = [];
  for (const locale of localesForSection(section)) {
    const pages = await loadPages(locale, "charging_cost");
    for (const p of pages) {
      const parts = p.path.split("/");
      const tariff = parts.pop();
      const slug = parts.pop();
      if (slug && tariff) out.push({ locale: LOCALE_CONFIG[locale].segment, slug, tariff });
    }
  }
  return out;
}

async function resolve(section: string, params: CostParams) {
  const locale = localeFromSegment(params.locale);
  if (!locale || COST_SECTION[locale] !== section) return null;
  const path = `/${params.locale}/${section}/${params.slug}/${params.tariff}`;
  const pages = await loadPages(undefined, "charging_cost");
  const page = pages.find((p) => p.path === path && p.locale === locale);
  if (!page || page.status === "draft") return null;
  const cfg = LOCALE_CONFIG[locale];
  const [version, tariffs] = await Promise.all([loadVersion(params.slug), loadTariffs(cfg.country, cfg.region)]);
  const tariff = tariffs.find((t) => t.slug === params.tariff);
  if (!version || !tariff) return null;
  return { locale, page, pages, version, tariff, tariffs };
}

export async function costMetadata(section: string, params: CostParams): Promise<Metadata> {
  const r = await resolve(section, params);
  if (!r) return {};
  const data = buildCostPage(r.version, r.locale, r.tariff, r.tariffs, new Date().toISOString().slice(0, 10));
  const alt = alternatesFor(r.page, r.pages);
  assertValidHreflangKeys(alt.languages as Record<string, string>);
  return {
    title: data.copy.cost.metaTitle(data.vars),
    description: data.copy.cost.metaDescription(data.vars),
    alternates: { canonical: alt.canonical, languages: alt.languages },
    robots: r.page.status === "index" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: data.copy.cost.metaTitle(data.vars), description: data.copy.cost.metaDescription(data.vars), url: alt.canonical, locale: alt.ogLocale, alternateLocale: alt.ogAlternateLocales, type: "article", siteName: getCopy(r.locale).site.name },
  };
}

export async function renderCost(section: string, params: CostParams) {
  const r = await resolve(section, params);
  if (!r) notFound();
  const cfg = LOCALE_CONFIG[r.locale];
  const data = buildCostPage(r.version, r.locale, r.tariff, r.tariffs, new Date().toISOString().slice(0, 10));
  const alt = alternatesFor(r.page, r.pages);
  const energyCta = process.env[`ENERGY_CTA_URL_${cfg.country}`]?.trim() || null;
  return (
    <Shell copy={data.copy} locale={r.locale} alternates={alt.languages}>
      <CostPage data={data} locale={r.locale} page={r.page} canonical={alt.canonical} energyCta={energyCta} />
    </Shell>
  );
}
