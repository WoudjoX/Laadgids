// Template charging_cost: kort antwoord, drie cijfers, jaarkost per kilometrage, factoren, andere tarieven, lead, FAQ, bronnen.
import Link from "next/link";
import { AnswerBox } from "@/components/AnswerBox";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { MetricCards } from "@/components/MetricCards";
import { SourcesBlock } from "@/components/SourcesBlock";
import { eventAttrs } from "@/lib/analytics";
import { LOCALE_CONFIG, type ChargerPageVars } from "@/lib/copy";
import type { Locale, PageRow } from "@/lib/db/types";
import { dateLong, euro, int } from "@/lib/format";
import type { CostPageData } from "@/lib/pages/cost";

interface Props {
  data: CostPageData;
  locale: Locale;
  page: PageRow;
  canonical: string;
  energyCta: string | null;
}

export function CostPage({ data, locale, page, canonical, energyCta }: Props) {
  const { copy, vars } = data;
  const cfg = LOCALE_CONFIG[locale];
  const c = copy.cost;
  const faq = c.faq(vars);
  const { intro: leadIntro, ...leadCopy } = copy.charger.lead;
  const regionLabel = vars.region ? copy.site.regionLabel[vars.region] : copy.site.regionNone;
  const crumbs = [
    { label: copy.site.home, href: `/${cfg.segment}` },
    { label: c.breadcrumbSection, href: `/${cfg.segment}/${c.sectionSlug}` },
    { label: `${vars.make} ${vars.model} ${vars.trim}` },
  ];
  return (
    <article className="mx-auto max-w-content px-4 pb-16 pt-6">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((cr, i) => ({ "@type": "ListItem", position: i + 1, name: cr.label, item: cr.href ? new URL(cr.href, canonical).toString() : canonical })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <Breadcrumb items={crumbs} />
      <h1 className="mt-4 max-w-prose">{c.h1(vars)}</h1>
      <p className="mt-2 text-[14px] text-ink2">
        {copy.site.updated} {dateLong(data.updatedAt, locale)} · {regionLabel} · {vars.tariffLabel}
      </p>
      <div className="mt-6">
        <AnswerBox label={copy.charger.shortAnswerLabel} text={c.shortAnswer(vars)} />
      </div>
      <div className="mt-6">
        <MetricCards items={[{ label: c.metrics.per100km, value: vars.per100km }, { label: c.metrics.perFull, value: vars.perFull }, { label: c.metrics.perYear(vars), value: vars.perYear }]} />
      </div>
      <p className="mt-3 text-[14px]">
        <Link href={vars.chargerPath}>{c.backToCharger(vars)} →</Link>
      </p>

      <section className="mt-10">
        <h2>{c.kmTable.heading}</h2>
        <div className="mt-4 overflow-x-auto rounded-card border-hair border-line bg-card">
          <table className="tnum w-full table-fixed border-collapse text-[15px]">
            <thead>
              <tr className="bg-paper text-left text-[13px] text-ink2">
                <th className="px-4 py-2 font-normal">{c.kmTable.colKm}</th>
                <th className="px-4 py-2 font-normal">{c.kmTable.colYear}</th>
                <th className="px-4 py-2 font-normal">{c.kmTable.colMonth}</th>
              </tr>
            </thead>
            <tbody>
              {data.byKm.map((r) => (
                <tr key={r.km} className={`border-t-hair border-line ${r.km === 12000 ? "bg-okSoft text-ok" : "text-ink"}`}>
                  <td className="px-4 py-3">{int(r.km, locale)} km</td>
                  <td className="px-4 py-3">{euro(r.cents_per_year, locale, { decimals: 0 })}</td>
                  <td className="px-4 py-3">{euro(r.cents_per_year / 12, locale, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2>{c.factors.heading}</h2>
        <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 text-[15px] text-ink2">
          {c.factors.items(vars).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {energyCta && (
          <a href={energyCta} rel="sponsored noopener" target="_blank" {...eventAttrs("energy_cta_click", "mt-5 inline-block rounded-btn border border-ink px-4 py-2 text-[15px] font-semibold text-ink no-underline hover:bg-card")}>
            {copy.charger.cost.cta} →
          </a>
        )}
      </section>

      {vars.otherTariffs.length > 0 && (
        <section className="mt-10">
          <h2>{c.otherTariffs.heading}</h2>
          <div className="mt-4 overflow-x-auto rounded-card border-hair border-line bg-card">
            <table className="tnum w-full table-fixed border-collapse text-[15px]">
              <thead>
                <tr className="bg-paper text-left text-[13px] text-ink2">
                  <th className="px-4 py-2 font-normal">{c.otherTariffs.colTariff}</th>
                  <th className="px-4 py-2 font-normal">{c.otherTariffs.colPer100}</th>
                  <th className="px-4 py-2 font-normal">{c.otherTariffs.colYear}</th>
                </tr>
              </thead>
              <tbody>
                {vars.otherTariffs.map((o) => (
                  <tr key={o.path} className="border-t-hair border-line">
                    <td className="px-4 py-3">
                      <Link href={o.path}>{o.label}</Link>
                    </td>
                    <td className="px-4 py-3">{o.per100km}</td>
                    <td className="px-4 py-3">{o.perYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-10" id="offerte">
        <h2>{copy.charger.lead.heading}</h2>
        <div className="mt-4">
          <LeadForm lead={leadCopy} locale={locale} pagePath={page.path} defaultPowerW={11000} intro={leadIntro({ recommendedKw: vars.recommendedKw } as unknown as ChargerPageVars)} showCompanyCar={cfg.country === "BE"} />
        </div>
      </section>

      <div className="mt-10">
        <Faq heading={copy.charger.faq.heading} items={faq} />
      </div>
      <div className="mt-10">
        <SourcesBlock heading={copy.charger.sources.heading} checkedLabel={copy.charger.sources.checked} sources={data.sources} locale={locale} />
      </div>
    </article>
  );
}
