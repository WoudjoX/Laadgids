// Gedeelde logica voor de merkpagina's (merk / marque).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { MakePage } from "@/components/pages/MakePage";
import { LOCALES, LOCALE_CONFIG, getCopy, localeFromSegment, makePath } from "@/lib/copy";
import { loadPages } from "@/lib/db/cached";
import type { Locale } from "@/lib/db/types";
import { makeHubVars } from "@/lib/pages/makeHub";
import { modelIndex } from "@/lib/pages/modelIndex";
import { alternatesFor, assertValidHreflangKeys } from "@/lib/seo/alternates";

export interface MakeParams {
  locale: string;
  make: string;
}

function localesForSection(section: string): Locale[] {
  return LOCALES.filter((l) => getCopy(l).makeHub.sectionSlug === section);
}

export async function makeStaticParams(section: string): Promise<MakeParams[]> {
  const out: MakeParams[] = [];
  for (const locale of localesForSection(section)) {
    const pages = await loadPages(locale, "make_hub");
    for (const p of pages) {
      const make = p.path.split("/").pop();
      if (make) out.push({ locale: LOCALE_CONFIG[locale].segment, make });
    }
  }
  return out;
}

async function resolve(section: string, params: MakeParams) {
  const locale = localeFromSegment(params.locale);
  if (!locale || getCopy(locale).makeHub.sectionSlug !== section) return null;
  const pages = await loadPages(undefined, "make_hub");
  const page = pages.find((p) => p.path === makePath(locale, params.make) && p.locale === locale);
  if (!page || page.status === "draft") return null;
  const all = await modelIndex(locale);
  const items = all.filter((i) => i.v.make.slug === params.make);
  if (!items.length) return null;
  return { locale, page, pages, all, items };
}

export async function makeMetadata(section: string, params: MakeParams): Promise<Metadata> {
  const r = await resolve(section, params);
  if (!r) return {};
  const copy = getCopy(r.locale);
  const vars = makeHubVars(r.items, r.locale);
  const alt = alternatesFor(r.page, r.pages);
  assertValidHreflangKeys(alt.languages as Record<string, string>);
  return {
    title: copy.makeHub.metaTitle(vars.make, vars.count),
    description: copy.makeHub.metaDescription(vars.make, vars.count, vars.powers),
    alternates: { canonical: alt.canonical, languages: alt.languages },
    robots: r.page.status === "index" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: copy.makeHub.h1(vars.make), description: copy.makeHub.metaDescription(vars.make, vars.count, vars.powers), url: alt.canonical, locale: alt.ogLocale, alternateLocale: alt.ogAlternateLocales, type: "website", siteName: copy.site.name },
  };
}

export async function renderMake(section: string, params: MakeParams) {
  const r = await resolve(section, params);
  if (!r) notFound();
  const copy = getCopy(r.locale);
  const vars = makeHubVars(r.items, r.locale);
  const alt = alternatesFor(r.page, r.pages);
  const make = r.items[0]!.v.make;
  const seen = new Set<number>();
  const otherMakes = r.all.map((i) => i.v.make).filter((m) => m.id !== make.id && !seen.has(m.id) && seen.add(m.id)).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Shell copy={copy} locale={r.locale} alternates={alt.languages}>
      <MakePage copy={copy} locale={r.locale} make={make} items={r.items} all={r.all} otherMakes={otherMakes} vars={vars} canonical={alt.canonical} />
    </Shell>
  );
}
