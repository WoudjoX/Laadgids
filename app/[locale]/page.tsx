import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerBox } from "@/components/AnswerBox";
import { GroupedModelCards } from "@/components/ModelCards";
import { ModelPicker } from "@/components/ModelPicker";
import { Shell } from "@/components/Shell";
import { LOCALES, LOCALE_CONFIG, comparePath, getCopy, localeFromSegment } from "@/lib/copy";
import { dateLong } from "@/lib/format";
import { buildChargerPage } from "@/lib/pages/charger";
import { homeData } from "@/lib/pages/home";
import { modelIndex } from "@/lib/pages/modelIndex";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = localeFromSegment((await params).locale);
  if (!locale) return {};
  const copy = getCopy(locale);
  return { title: `${copy.home.h1} | ${copy.site.name}`, description: copy.site.tagline };
}

/**
 * Startpagina (DESIGN.md §5: geen hero). Volgorde: belofte, keuzeveld, één uitgewerkt antwoord,
 * vertrouwensregel, modellen gegroepeerd op vermogen met laadtijd.
 */
export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeFromSegment((await params).locale);
  if (!locale) notFound();
  const copy = getCopy(locale);
  const items = await modelIndex(locale);
  const data = await homeData(locale, items);
  const example = data.example ? buildChargerPage(data.example.v, locale, data.rules, data.tariffs, new Date().toISOString().slice(0, 10)) : null;
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
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2>{copy.home.allModels}</h2>
            <Link href={comparePath(locale)} className="text-[15px]">
              {copy.compare.linkFromIndex} →
            </Link>
          </div>
          <div className="mt-5">
            <GroupedModelCards items={items} copy={copy} locale={locale} />
          </div>
        </section>
      </div>
    </Shell>
  );
}
