// Sectie-index (/nl-be/laadpaal-voor, /fr-be/borne-pour): alle modellen met een P1-pagina. Doel van de broodkruimel.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ModelCards, groupByMake } from "@/components/ModelCards";
import { ModelPicker, pickLabel } from "@/components/ModelPicker";
import { matchPicks } from "@/lib/pages/pick";
import { Shell } from "@/components/Shell";
import { LOCALES, LOCALE_CONFIG, comparePath, getCopy, localeFromSegment, makePath } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { modelIndex } from "./modelIndex";
import { siteUrl } from "@/lib/seo/alternates";

function resolve(section: string, seg: string): Locale | null {
  const locale = localeFromSegment(seg);
  return locale && getCopy(locale).charger.sectionSlug === section ? locale : null;
}

function sectionPath(locale: Locale): string {
  return `/${LOCALE_CONFIG[locale].segment}/${getCopy(locale).charger.sectionSlug}`;
}

export function chargerIndexStaticParams(section: string): { locale: string }[] {
  return LOCALES.filter((l) => getCopy(l).charger.sectionSlug === section).map((l) => ({ locale: LOCALE_CONFIG[l].segment }));
}

export async function chargerIndexMetadata(section: string, seg: string): Promise<Metadata> {
  const locale = resolve(section, seg);
  if (!locale) return {};
  const copy = getCopy(locale);
  const base = siteUrl();
  const languages: Record<string, string> = Object.fromEntries(LOCALES.map((l) => [l, base + sectionPath(l)]));
  languages["x-default"] = base + sectionPath("nl-BE");
  return {
    title: `${copy.charger.breadcrumbSection} | ${copy.site.name}`,
    description: copy.site.homeIntro,
    alternates: { canonical: base + sectionPath(locale), languages },
  };
}

export async function renderChargerIndex(section: string, seg: string, query?: string) {
  const locale = resolve(section, seg);
  if (!locale) notFound();
  const copy = getCopy(locale);
  const items = await modelIndex(locale);
  const alternates = Object.fromEntries(LOCALES.map((l) => [l, sectionPath(l)]));
  const q = query?.trim().slice(0, 80) ?? "";
  const matches = q ? matchPicks(q, items.map((i) => ({ ...i, slug: i.v.slug, label: pickLabel(i) }))) : [];
  const groups = groupByMake(items);
  return (
    <Shell copy={copy} locale={locale} alternates={alternates}>
      <div className="mx-auto max-w-content px-4 pb-16 pt-6">
        <Breadcrumb items={[{ label: copy.site.home, href: `/${LOCALE_CONFIG[locale].segment}` }, { label: copy.charger.breadcrumbSection }]} />
        <h1 className="mt-4 max-w-prose">{copy.charger.breadcrumbSection}</h1>
        <p className="mt-3 max-w-prose text-ink2">{copy.site.homeIntro}</p>
        <div className="mt-6">
          <ModelPicker items={items} copy={copy} locale={locale} query={q || undefined} />
        </div>
        {q && (
          <section className="mt-6">
            {matches.length === 0 && <p className="text-[15px] text-bad">{copy.home.noMatch(q)}</p>}
            {matches.length > 0 && <ModelCards items={matches} copy={copy} locale={locale} />}
          </section>
        )}
        <p className="mt-4 text-[15px]">
          <Link href={comparePath(locale)}>{copy.compare.linkFromIndex} →</Link>
        </p>
        <nav aria-label={copy.home.makesHeading} className="mt-8">
          <h2 className="text-[18px]">{copy.home.makesHeading}</h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
            {groups.map((g) => (
              <li key={g.make.id}>
                <Link href={makePath(locale, g.make.slug)}>
                  {g.make.name} <span className="tnum text-ink3">{g.items.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 space-y-10">
          {groups.map((g) => (
            <section key={g.make.id} id={g.make.slug}>
              <h2 className="text-[18px]">
                <Link href={makePath(locale, g.make.slug)} className="no-underline hover:underline">
                  {g.make.name}
                </Link>{" "}
                <span className="tnum font-normal text-ink3">· {g.items.length}</span>
              </h2>
              <div className="mt-3">
                <ModelCards items={g.items} copy={copy} locale={locale} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </Shell>
  );
}
