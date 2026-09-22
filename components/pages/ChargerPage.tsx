// Template charger_for_model: vaste volgorde uit CLAUDE.md §4.2. Server component, geen client-JS behalve LeadForm.
import { AnswerBox } from "@/components/AnswerBox";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ChargeTimeTable } from "@/components/ChargeTimeTable";
import { CompanyCarBlock } from "@/components/CompanyCarBlock";
import { CostBlock } from "@/components/CostBlock";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { MetricCards } from "@/components/MetricCards";
import { PeakBlock } from "@/components/PeakBlock";
import { RelatedLinks } from "@/components/RelatedLinks";
import { SourcesBlock } from "@/components/SourcesBlock";
import Link from "next/link";
import { LOCALE_CONFIG, comparePath } from "@/lib/copy";
import type { Locale, PageRow } from "@/lib/db/types";
import { PhaseDiagram } from "@/components/viz/PhaseDiagram";
import { dateLong, durationCompact, kw } from "@/lib/format";
import type { ChargerPageData } from "@/lib/pages/charger";
import type { RelatedLink } from "@/lib/seo/related";

interface Props {
  data: ChargerPageData;
  locale: Locale;
  page: PageRow;
  related: RelatedLink[];
  canonical: string;
}

export function ChargerPage({ data, locale, page, related, canonical }: Props) {
  const { copy, vars, advice, cost, tariffs, sources } = data;
  const cfg = LOCALE_CONFIG[locale];
  const c = copy.charger;
  const faq = c.faq.items(vars);
  const { intro: leadIntro, ...leadCopy } = c.lead;
  const recRow = advice.table.find((r) => r.connection === advice.recommended_connection)!;
  const recTime = durationCompact(recRow.seconds, locale);
  const singleW = advice.table.find((r) => r.connection === "1f_32a_7400")!.effective_w;
  const threeW = advice.table.find((r) => r.connection === "3f_16a_11000")!.effective_w;
  const regionLabel = vars.region ? copy.site.regionLabel[vars.region] : copy.site.regionNone;
  const cregPath = related.find((l) => l.kind === "rule" && /creg/.test(l.path))?.path ?? null;
  // Affiliate-/vergelijkingslink per locale uit env; zonder env naar de locale-home (nooit een dode link).
  const energyCta = process.env[`ENERGY_CTA_URL_${cfg.country}`] ?? `/${cfg.segment}`;

  const crumbs = [
    { label: copy.site.home, href: `/${cfg.segment}` },
    { label: c.breadcrumbSection, href: `/${cfg.segment}/${c.sectionSlug}` },
    { label: `${vars.make} ${vars.model} ${vars.trim}` },
  ];

  return (
    <article className="mx-auto max-w-content px-4 pb-16 pt-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((cr, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: cr.label,
            item: cr.href ? new URL(cr.href, canonical).toString() : canonical,
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />

      {/* 1 */}
      <Breadcrumb items={crumbs} />
      {/* 2 */}
      <h1 className="mt-4 max-w-prose">{c.h1(vars)}</h1>
      {/* 3 */}
      <p className="mt-2 text-[14px] text-ink2">
        {copy.site.updated} {dateLong(data.updatedAt, locale)} · {regionLabel}
      </p>
      {/* 4 */}
      <div className="mt-6">
        <AnswerBox label={c.shortAnswerLabel} text={c.shortAnswer(vars)} />
      </div>
      {/* 5 */}
      <div className="mt-6">
        <MetricCards
          items={[
            { label: c.metrics.acMax, value: vars.acMax.replace(" kW", ""), unit: "kW" },
            { label: c.metrics.battery, value: vars.batteryNet.replace(" kWh", ""), unit: "kWh" },
            { label: c.metrics.time(vars), ...recTime },
          ]}
        />
      </div>
      <p className="mt-3 text-[14px]">
        <Link href={comparePath(locale, page.path.split("/").pop() ?? "")}>{copy.compare.linkFromModel} →</Link>
      </p>
      {/* 6 */}
      <section className="mt-10">
        <h2>{c.table.heading(vars)}</h2>
        <div className="mt-4">
          <ChargeTimeTable rows={advice.table} recommended={advice.recommended_connection} copy={copy} locale={locale} />
        </div>
        <p className="mt-2 max-w-prose text-[13px] text-ink3">{c.table.note(vars)}</p>
        <div className="mt-6">
          <h3 className="mb-3 text-[15px] text-ink2">{c.diagram.title}</h3>
          <PhaseDiagram
            acPhases={vars.acPhases}
            recommendedPhases={advice.recommended_connection.startsWith("3f") ? 3 : 1}
            singleKw={kw(singleW, locale)}
            threeKw={kw(threeW, locale)}
            copy={c.diagram}
          />
          <p className="mt-2 max-w-prose text-[13px] text-ink2">{c.diagram.caption(vars)}</p>
        </div>
        <ul className="mt-4 max-w-prose space-y-2 text-[15px] text-ink2">
          {advice.reasons.map((r) => (
            <li key={r}>{c.reasons[r](vars)}</li>
          ))}
          {advice.warnings
            .filter((w) => c.warnings[w](vars))
            .map((w) => (
              <li key={w}>{c.warnings[w](vars)}</li>
            ))}
        </ul>
      </section>
      {/* 7 */}
      <section className="mt-10">
        <h2>{c.cost.heading(vars)}</h2>
        <div className="mt-4">
          <CostBlock comparison={cost} tariffs={tariffs} vars={vars} copy={copy} locale={locale} ctaHref={energyCta} />
        </div>
      </section>
      {/* 8 */}
      {advice.capacity && vars.region === "VLA" && (
        <div className="mt-10">
          <PeakBlock capacity={advice.capacity} vars={vars} copy={copy} locale={locale} />
        </div>
      )}
      {/* 9 */}
      <section className="mt-10" id="offerte">
        <h2>{c.lead.heading}</h2>
        <div className="mt-4">
          <LeadForm
            lead={leadCopy}
            locale={locale}
            pagePath={page.path}
            defaultPowerW={advice.recommended_w >= 22000 ? 22000 : advice.recommended_w >= 11000 ? 11000 : 7400}
            intro={leadIntro(vars)}
            showCompanyCar={cfg.country === "BE"}
          />
        </div>
      </section>
      {/* 10 */}
      {cfg.country === "BE" && (
        <div className="mt-10">
          <CompanyCarBlock copy={copy} href={cregPath} />
        </div>
      )}
      {/* 11 */}
      <div className="mt-10">
        <Faq heading={c.faq.heading} items={faq} />
      </div>
      {/* 12 */}
      <div className="mt-10">
        <RelatedLinks links={related} copy={copy} />
      </div>
      {vars.specNotes && (
        <div className="mt-10 rounded-card border-hair border-line bg-card px-5 py-4">
          <p className="text-[13px] font-semibold text-ink2">{c.sources.specNotes}</p>
          <p className="mt-1 max-w-prose text-[14px] text-ink2">{vars.specNotes}</p>
        </div>
      )}
      {/* 13 */}
      <div className="mt-10">
        <SourcesBlock heading={c.sources.heading} checkedLabel={c.sources.checked} sources={sources} locale={locale} />
      </div>
    </article>
  );
}
