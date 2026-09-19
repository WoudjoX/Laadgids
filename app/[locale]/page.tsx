import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModelCards } from "@/components/ModelCards";
import { Shell } from "@/components/Shell";
import { LOCALES, LOCALE_CONFIG, comparePath, getCopy, localeFromSegment } from "@/lib/copy";
import { modelIndex } from "@/lib/pages/modelIndex";

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
  const items = await modelIndex(locale);
  const alternates = Object.fromEntries(LOCALES.map((l) => [l, `/${LOCALE_CONFIG[l].segment}`]));
  return (
    <Shell copy={copy} locale={locale} alternates={alternates}>
      <div className="mx-auto max-w-content px-4 pb-16 pt-8">
        <h1 className="max-w-prose">{copy.charger.breadcrumbSection}</h1>
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
