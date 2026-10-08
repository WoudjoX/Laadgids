import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerBox } from "@/components/AnswerBox";
import { ExceptionList } from "@/components/ExceptionList";
import { MakeGrid } from "@/components/MakeGrid";
import { ModelPicker } from "@/components/ModelPicker";
import { Shell } from "@/components/Shell";
import { LOCALES, LOCALE_CONFIG, comparePath, getCopy, localeFromSegment } from "@/lib/copy";
import { dateLong } from "@/lib/format";
import { buildChargerPage } from "@/lib/pages/charger";
import { homeData } from "@/lib/pages/home";
import { makeTiles, modelExceptions } from "@/lib/pages/homeOverview";
import { modelIndex } from "@/lib/pages/modelIndex";
import { defaultOgImages, fitTitle, sectionAlternates } from "@/lib/seo/alternates";
import { indexableLocales } from "@/lib/seo/locales";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = localeFromSegment((await params).locale);
  if (!locale) return {};
  const copy = getCopy(locale);
  const indexable = await indexableLocales();
  const alt = sectionAlternates(Object.fromEntries(LOCALES.map((l) => [l, `/${LOCALE_CONFIG[l].segment}`])), locale, indexable);
  const title = fitTitle(copy.home.h1, copy.site.name);
  return {
    title,
    description: copy.site.tagline,
    alternates: { canonical: alt.canonical, languages: alt.languages },
    robots: indexable.includes(locale) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description: copy.site.tagline, url: alt.canonical, locale: alt.ogLocale, alternateLocale: alt.ogAlternateLocales, type: "website", siteName: copy.site.name, images: defaultOgImages() },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * Startpagina (DESIGN.md §5: geen hero). Volgorde: belofte, keuzeveld, één uitgewerkt antwoord,
 * vertrouwensregel, merken met aantal en laadtijd, uitvoeringen met een afwijkend advies, link naar alle modellen.
 */
export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeFromSegment((await params).locale);
  if (!locale) notFound();
  const copy = getCopy(locale);
  const items = await modelIndex(locale);
  const data = await homeData(locale, items);
  const example = data.example ? buildChargerPage(data.example.v, locale, data.rules, data.tariffs, new Date().toISOString().slice(0, 10)) : null;
  const exceptions = modelExceptions(items);
  const alternates = Object.fromEntries(LOCALES.map((l) => [l, `/${LOCALE_CONFIG[l].segment}`]));

  return (
    <Shell copy={copy} locale={locale} alternates={alternates}>
      <div className="mx-auto max-w-content px-4 pb-16 pt-8">
        <h1 className="max-w-prose">{copy.home.h1}</h1>
        <p className="mt-3 max-w-prose text-[18px] text-ink2">{copy.site.tagline}</p>
        {data.checkedAt && <p className="mt-2 max-w-prose text-[13px] text-ink3">{copy.home.trust(dateLong(data.checkedAt, locale))}</p>}

        <div className="mt-6">
          <ModelPicker items={items} copy={copy} locale={locale} />
        </div>

        {example && data.example && (
          <section className="mt-10">
            <p className="mb-2 text-[13px] text-ink2">{copy.home.exampleLabel}</p>
            <AnswerBox label={`${copy.charger.shortAnswerLabel} · ${example.vars.fullName}`} text={copy.charger.shortAnswer(example.vars)} />
            <p className="mt-2 text-[15px]">
              <Link href={data.example.path}>{copy.home.exampleLink(`${example.vars.make} ${example.vars.model}`)} →</Link>
            </p>
          </section>
        )}

        <section className="mt-12">
          <h2>{copy.home.makesHeading}</h2>
          <p className="mt-2 max-w-prose text-ink2">{copy.home.makesIntro}</p>
          <div className="mt-4">
            <MakeGrid tiles={makeTiles(items)} copy={copy} locale={locale} />
          </div>
        </section>

        {exceptions.length > 0 && (
          <section className="mt-12">
            <h2>{copy.home.exceptionsHeading}</h2>
            <p className="mt-2 max-w-prose text-ink2">{copy.home.exceptionsIntro}</p>
            <div className="mt-4">
              <ExceptionList items={exceptions} copy={copy} locale={locale} />
            </div>
          </section>
        )}

        <p className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
          <Link href={`/${LOCALE_CONFIG[locale].segment}/${copy.charger.sectionSlug}`}>{copy.home.allModelsLink(items.length)} →</Link>
          <Link href={comparePath(locale)}>{copy.compare.linkFromIndex} →</Link>
        </p>
      </div>
    </Shell>
  );
}
