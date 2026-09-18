import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { advice } from "@/lib/calc";
import { Shell } from "@/components/Shell";
import { LOCALES, LOCALE_CONFIG, getCopy, localeFromSegment } from "@/lib/copy";
import { loadAllVersions, loadPages } from "@/lib/db/cached";
import { kw, kwh } from "@/lib/format";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = localeFromSegment((await params).locale);
  if (!locale) return {};
  const copy = getCopy(locale);
  return { title: `${copy.site.name}`, description: copy.site.tagline };
}

/** Locale-home: modelkaarten met de drie cijfers die tellen. Geen hero (DESIGN.md §5). */
export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeFromSegment((await params).locale);
  if (!locale) notFound();
  const copy = getCopy(locale);
  const cfg = LOCALE_CONFIG[locale];
  const [pages, versions] = await Promise.all([loadPages(locale, "charger_for_model"), loadAllVersions()]);
  const bySlug = new Map(versions.map((v) => [v.slug, v]));
  const items = pages
    .map((p) => ({ page: p, v: bySlug.get(p.path.split("/").pop() ?? "")! }))
    .filter((x) => x.v && x.v.sold_in.includes(cfg.country))
    .sort((a, b) => `${a.v.make.name} ${a.v.vehicle.model}`.localeCompare(`${b.v.make.name} ${b.v.vehicle.model}`));

  const alternates = Object.fromEntries(LOCALES.map((l) => [l, `/${LOCALE_CONFIG[l].segment}`]));
  return (
    <Shell copy={copy} locale={locale} alternates={alternates}>
    <div className="mx-auto max-w-content px-4 pb-16 pt-8">
      <h1 className="max-w-prose">{copy.charger.breadcrumbSection}</h1>
      <p className="mt-3 max-w-prose text-ink2">{copy.site.homeIntro}</p>
      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ page, v }) => {
          const a = advice(v, { region: null, capacity_rule: null });
          return (
            <li key={page.path}>
              <Link href={page.path} className="block rounded-card border-hair border-line bg-card p-4 no-underline hover:border-line2">
                <p className="text-[13px] text-ink2">
                  {v.make.name}
                  {v.model_year ? ` · ${v.model_year}` : ""}
                </p>
                <p className="text-[18px] font-semibold text-ink">
                  {v.vehicle.model} {v.trim}
                </p>
                <dl className="tnum mt-3 grid grid-cols-[1fr_1fr_1.6fr] gap-2 text-[13px] text-ink2">
                  <div>
                    <dt>{copy.site.cardAc}</dt>
                    <dd className="whitespace-nowrap text-[16px] font-medium text-ink">{kw(v.ac_max_w, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy.site.cardBattery}</dt>
                    <dd className="whitespace-nowrap text-[16px] font-medium text-ink">{kwh(v.battery_net_wh, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy.site.cardRecommended}</dt>
                    <dd className="whitespace-nowrap text-[16px] font-medium text-ok">{copy.connections[a.recommended_connection]}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
    </Shell>
  );
}
