// Sectie-index (/nl-be/laadpaal-voor, /fr-be/borne-pour): alle modellen met een P1-pagina. Doel van de broodkruimel.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ModelCards } from "@/components/ModelCards";
import { Shell } from "@/components/Shell";
import { LOCALES, LOCALE_CONFIG, comparePath, getCopy, localeFromSegment } from "@/lib/copy";
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

export async function renderChargerIndex(section: string, seg: string) {
  const locale = resolve(section, seg);
  if (!locale) notFound();
  const copy = getCopy(locale);
  const items = await modelIndex(locale);
  const alternates = Object.fromEntries(LOCALES.map((l) => [l, sectionPath(l)]));
  return (
    <Shell copy={copy} locale={locale} alternates={alternates}>
      <div className="mx-auto max-w-content px-4 pb-16 pt-6">
        <Breadcrumb items={[{ label: copy.site.home, href: `/${LOCALE_CONFIG[locale].segment}` }, { label: copy.charger.breadcrumbSection }]} />
        <h1 className="mt-4 max-w-prose">{copy.charger.breadcrumbSection}</h1>
        <p className="mt-3 max-w-prose text-ink2">{copy.site.homeIntro}</p>
        <p className="mt-3 text-[15px]">
          <Link href={comparePath(locale)}>{copy.compare.linkFromIndex} →</Link>
        </p>
        <div className="mt-8">
          <ModelCards items={items} copy={copy} locale={locale} />
        </div>
      </div>
    </Shell>
  );
}
