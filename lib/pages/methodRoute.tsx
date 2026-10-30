// Pagina "Hoe we rekenen" / "Notre méthode de calcul": vaste tekst uit lib/copy, alle waarden uit rules, tariffs en calc-parameters.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { Shell } from "@/components/Shell";
import { DEFAULT_CHARGING_LOSS, DEFAULT_REAL_WORLD_FACTOR } from "@/lib/calc";
import { LOCALES, LOCALE_CONFIG, getCopy, localeFromSegment, type MethodVars } from "@/lib/copy";
import { METHOD_REVIEWED } from "@/lib/content/method";
import { loadRules, loadTariffs } from "@/lib/db/cached";
import type { Locale, Region } from "@/lib/db/types";
import { centsPerKwh, dateLong, euro, int, kw, pct } from "@/lib/format";
import { CHARGE_FROM, CHARGE_TO, KM_PER_YEAR } from "@/lib/pages/charger";
import { selectRule } from "@/lib/rules/select";
import { defaultOgImages, fitDescription, fitTitle, sectionAlternates, siteUrl } from "@/lib/seo/alternates";

const BE_REGIONS: Region[] = ["VLA", "WAL", "BRU"];

function resolve(slug: string, seg: string): Locale | null {
  const locale = localeFromSegment(seg);
  return locale && getCopy(locale).method.slug === slug ? locale : null;
}

function path(l: Locale): string {
  return `/${LOCALE_CONFIG[l].segment}/${getCopy(l).method.slug}`;
}

export function methodStaticParams(slug: string): { locale: string }[] {
  return LOCALES.filter((l) => getCopy(l).method.slug === slug).map((l) => ({ locale: LOCALE_CONFIG[l].segment }));
}

async function methodVars(locale: Locale): Promise<MethodVars> {
  const cfg = LOCALE_CONFIG[locale];
  const copy = getCopy(locale);
  const today = new Date().toISOString().slice(0, 10);
  const rules = await loadRules(cfg.country);
  // Alle gewesten van het land, zodat de pagina elke referentieprijs toont die op de site gebruikt wordt.
  const lists = await Promise.all(BE_REGIONS.map((r) => loadTariffs(cfg.country, r)));
  const seen = new Set<number>();
  const tariffs = lists
    .flat()
    .filter((t) => t.slug === "vast-dag" && !seen.has(t.id) && seen.add(t.id))
    .map((t) => ({ region: t.region ? copy.site.regionLabel[t.region] : copy.site.regionNone, price: centsPerKwh(Number(t.price_cents_per_kwh), locale), checked: dateLong(t.source_checked_at, locale) }));
  const cap = selectRule(rules, { country: cfg.country, region: "VLA", rule_type: "capacity_tariff", onDate: today });
  const creg = selectRule(rules, { country: cfg.country, region: null, rule_type: "creg_tariff", onDate: today });
  const [year, quarter] = creg?.params.quarter.split("-") ?? [];
  return {
    fromPct: CHARGE_FROM,
    toPct: CHARGE_TO,
    lossPct: pct(DEFAULT_CHARGING_LOSS, locale),
    realWorldPct: pct(DEFAULT_REAL_WORLD_FACTOR - 1, locale),
    km: int(KM_PER_YEAR, locale),
    tariffs,
    capacity: cap
      ? {
          incl: euro(cap.params.cents_per_kw_year, locale, { decimals: 2 }),
          excl: cap.params.excl_vat_cents_per_kw_year ? euro(cap.params.excl_vat_cents_per_kw_year, locale, { decimals: 2 }) : null,
          vatPct: cap.params.vat_pct != null ? `${int(cap.params.vat_pct, locale)} %` : null,
          isAverage: Boolean(cap.params.is_regional_average),
          minKw: kw(cap.params.min_kw * 1000, locale),
          baselineKw: kw(cap.params.household_baseline_w, locale),
          checked: dateLong(cap.source_checked_at, locale),
        }
      : null,
    creg: creg ? { quarter: `${quarter} ${year}`, checked: dateLong(creg.source_checked_at, locale) } : null,
  };
}

const reviewedLocales = () => LOCALES.filter((l) => METHOD_REVIEWED[l] && getCopy(l).method.slug);
const switcher = () => Object.fromEntries(LOCALES.filter((l) => getCopy(l).method.slug).map((l) => [l, path(l)]));

export function methodMetadata(slug: string, seg: string): Metadata {
  const locale = resolve(slug, seg);
  if (!locale) return {};
  const c = getCopy(locale);
  const alt = sectionAlternates(switcher(), locale, reviewedLocales());
  const title = fitTitle(c.method.title, c.site.name);
  const description = fitDescription(c.method.metaDescription);
  return {
    title,
    description,
    alternates: { canonical: alt.canonical, languages: alt.languages },
    robots: METHOD_REVIEWED[locale] ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url: alt.canonical, locale: alt.ogLocale, alternateLocale: alt.ogAlternateLocales, type: "article", siteName: c.site.name, images: defaultOgImages() },
  };
}

export async function renderMethod(slug: string, seg: string) {
  const locale = resolve(slug, seg);
  if (!locale) notFound();
  const copy = getCopy(locale);
  const cfg = LOCALE_CONFIG[locale];
  const v = await methodVars(locale);
  const crumbs = [{ label: copy.site.home, href: `/${cfg.segment}` }, { label: copy.method.title }];
  return (
    <Shell copy={copy} locale={locale} alternates={switcher()}>
      <article className="mx-auto max-w-content px-4 pb-16 pt-6">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: siteUrl() + (c.href ?? path(locale)) })),
          }}
        />
        <Breadcrumb items={crumbs} />
        <h1 className="mt-4 max-w-prose">{copy.method.title}</h1>
        <p className="mt-3 max-w-prose text-[18px] text-ink2">{copy.method.intro}</p>
        <div className="mt-8 space-y-8">
          {copy.method.sections(v).map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              <div className="mt-3 max-w-prose space-y-3 text-ink">
                {s.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </Shell>
  );
}
