// Laadkostenoverzicht (/nl-be/laadkosten, /fr-be/cout-recharge): alle uitvoeringen met kost per 100 km en per jaar,
// per merk. Doel van de tweede stap in het kruimelpad van elke laadkostenpagina. Alles server-side, geen client-JS.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { Shell } from "@/components/Shell";
import { chargingCost } from "@/lib/calc";
import { COST_SECTION, LOCALES, LOCALE_CONFIG, getCopy, localeFromSegment, makePath } from "@/lib/copy";
import { loadAllVersions, loadPages, loadTariffs } from "@/lib/db/cached";
import type { Locale, TariffRow, VersionFull } from "@/lib/db/types";
import { euro, euroPer100Km, int } from "@/lib/format";
import { COST_DEFAULT_KM, centsPerKwh } from "@/lib/pages/cost";
import { defaultOgImages, fitDescription, fitTitle, sectionAlternates, siteUrl } from "@/lib/seo/alternates";
import { indexableLocales } from "@/lib/seo/locales";

function resolve(section: string, seg: string): Locale | null {
  const locale = localeFromSegment(seg);
  return locale && COST_SECTION[locale] === section ? locale : null;
}

function sectionPath(locale: Locale): string {
  return `/${LOCALE_CONFIG[locale].segment}/${COST_SECTION[locale]}`;
}

export function costIndexStaticParams(section: string): { locale: string }[] {
  return LOCALES.filter((l) => COST_SECTION[l] === section).map((l) => ({ locale: LOCALE_CONFIG[l].segment }));
}

interface Row {
  path: string;
  v: VersionFull;
  tariff: TariffRow;
  per100: number;
  perYear: number;
}

/** Laadkostenpagina's van deze locale die bestaan (index of noindex), met de berekening erbij. Leeg = geen overzicht. */
async function rows(locale: Locale): Promise<Row[]> {
  const cfg = LOCALE_CONFIG[locale];
  const [pages, versions, tariffs] = await Promise.all([loadPages(locale, "charging_cost"), loadAllVersions(), loadTariffs(cfg.country, cfg.region)]);
  const bySlug = new Map(versions.map((v) => [v.slug, v]));
  const out: Row[] = [];
  for (const p of pages) {
    if (p.status === "draft") continue;
    const parts = p.path.split("/");
    const tariffSlug = parts.pop()!;
    const v = bySlug.get(parts.pop()!);
    const tariff = tariffs.find((t) => t.slug === tariffSlug);
    if (!v || !tariff) continue;
    const r = chargingCost(v, tariff, { km_per_year: COST_DEFAULT_KM });
    out.push({ path: p.path, v, tariff, per100: r.cents_per_100km, perYear: r.cents_per_year });
  }
  return out;
}

/** Locales waarvoor een overzicht bestaat: alleen waar laadkostenpagina's zijn (nl-NL heeft nog geen tarieven). */
async function localesWithCost(): Promise<Locale[]> {
  const out: Locale[] = [];
  for (const l of LOCALES) if ((await loadPages(l, "charging_cost")).some((p) => p.status !== "draft")) out.push(l);
  return out;
}

export async function costIndexMetadata(section: string, seg: string): Promise<Metadata> {
  const locale = resolve(section, seg);
  if (!locale) return {};
  const list = await rows(locale);
  if (list.length === 0) return {};
  const copy = getCopy(locale);
  const lang = locale.startsWith("fr") ? "fr" : "nl";
  const t = list[0]!.tariff;
  const [withCost, indexable] = await Promise.all([localesWithCost(), indexableLocales()]);
  const alt = sectionAlternates(Object.fromEntries(withCost.map((l) => [l, sectionPath(l)])), locale, indexable.filter((l) => withCost.includes(l)));
  const title = fitTitle(copy.cost.breadcrumbSection, copy.site.name);
  const description = fitDescription(copy.cost.index.intro(t.label[lang] ?? t.slug, centsPerKwh(Number(t.price_cents_per_kwh), locale), `${int(Number(t.charging_loss_pct), locale)} %`, int(COST_DEFAULT_KM, locale)));
  return {
    title,
    description,
    alternates: { canonical: alt.canonical, languages: alt.languages },
    robots: indexable.includes(locale) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url: alt.canonical, locale: alt.ogLocale, alternateLocale: alt.ogAlternateLocales, type: "website", siteName: copy.site.name, images: defaultOgImages() },
    twitter: { card: "summary_large_image" },
  };
}

export async function renderCostIndex(section: string, seg: string) {
  const locale = resolve(section, seg);
  if (!locale) notFound();
  const list = await rows(locale);
  if (list.length === 0) notFound();
  const copy = getCopy(locale);
  const cfg = LOCALE_CONFIG[locale];
  const lang = locale.startsWith("fr") ? "fr" : "nl";
  const t = list[0]!.tariff;
  const km = int(COST_DEFAULT_KM, locale);
  const withCost = await localesWithCost();
  const switcher = Object.fromEntries(withCost.map((l) => [l, sectionPath(l)]));
  const groups = new Map<string, Row[]>();
  for (const r of list) groups.set(r.v.make.slug, [...(groups.get(r.v.make.slug) ?? []), r]);
  const sorted = [...groups.values()]
    .map((g) => g.sort((a, b) => `${a.v.vehicle.model} ${a.v.trim}`.localeCompare(`${b.v.vehicle.model} ${b.v.trim}`, undefined, { numeric: true })))
    .sort((a, b) => a[0]!.v.make.name.localeCompare(b[0]!.v.make.name));
  const base = siteUrl();
  const crumbs = [{ label: copy.site.home, href: `/${cfg.segment}` }, { label: copy.cost.breadcrumbSection }];
  return (
    <Shell copy={copy} locale={locale} alternates={switcher}>
      <div className="mx-auto max-w-content px-4 pb-16 pt-6">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: base + (c.href ?? sectionPath(locale)) })),
          }}
        />
        <Breadcrumb items={crumbs} />
        <h1 className="mt-4 max-w-prose">{copy.cost.breadcrumbSection}</h1>
        <p className="mt-3 max-w-prose text-ink2">{copy.cost.index.intro(t.label[lang] ?? t.slug, centsPerKwh(Number(t.price_cents_per_kwh), locale), `${int(Number(t.charging_loss_pct), locale)} %`, km)}</p>
        <div className="mt-8 space-y-8">
          {sorted.map((g) => {
            const make = g[0]!.v.make;
            return (
              <section key={make.slug} id={make.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h2 className="text-[18px]">{make.name}</h2>
                  <Link href={makePath(locale, make.slug)} className="text-[14px]">
                    {copy.cost.index.makeLink(make.name)} →
                  </Link>
                </div>
                <div className="mt-2 overflow-x-auto rounded-card border-hair border-line bg-card">
                  <table className="tnum w-full border-collapse text-[15px]">
                    <thead>
                      <tr className="bg-paper text-left text-[13px] text-ink2">
                        <th className="px-4 py-2 font-normal">{copy.cost.index.colModel}</th>
                        <th className="px-4 py-2 text-right font-normal">{copy.cost.index.colPer100}</th>
                        <th className="px-4 py-2 text-right font-normal">{copy.cost.index.colYear(km)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.map((r) => (
                        <tr key={r.path} className="border-t-hair border-line">
                          <td className="px-4 py-2.5">
                            <Link href={r.path}>
                              {r.v.vehicle.model} {r.v.trim}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right">{euroPer100Km(r.per100, locale)}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-ink2">{euro(r.perYear, locale, { decimals: 0 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
