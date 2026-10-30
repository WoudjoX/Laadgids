// Merkpagina (template make_hub): sjabloonintro uit de data, keuzeveld, alle uitvoeringen van het merk, andere merken.
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CostTable } from "@/components/CostTable";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { ModelCards, type ModelCardItem } from "@/components/ModelCards";
import { ModelPicker } from "@/components/ModelPicker";
import { COST_SECTION, LOCALE_CONFIG, makePath, type Copy, type MakeFaqVars, type MakeHubVars } from "@/lib/copy";
import type { Locale, MakeRow } from "@/lib/db/types";
import { int } from "@/lib/format";
import { COST_DEFAULT_KM, centsPerKwh } from "@/lib/pages/cost";
import type { CostRow } from "@/lib/pages/costRows";

interface Props {
  copy: Copy;
  locale: Locale;
  make: MakeRow;
  items: ModelCardItem[]; // dit merk
  all: ModelCardItem[]; // alle modellen, voor het keuzeveld
  otherMakes: MakeRow[];
  vars: MakeHubVars;
  costs: CostRow[]; // dit merk, referentietarief; leeg zonder tarieven
  faq: MakeFaqVars;
  canonical: string;
}

export function MakePage({ copy, locale, make, items, all, otherMakes, vars, costs, faq, canonical }: Props) {
  const cfg = LOCALE_CONFIG[locale];
  const c = copy.makeHub;
  const crumbs = [
    { label: copy.site.home, href: `/${cfg.segment}` },
    { label: copy.charger.breadcrumbSection, href: `/${cfg.segment}/${copy.charger.sectionSlug}` },
    { label: make.name },
  ];
  const faqItems = c.faq(faq);
  const lang = locale.startsWith("fr") ? "fr" : "nl";
  const t = costs[0]?.tariff;
  const km = int(COST_DEFAULT_KM, locale);
  const sorted = [...costs].sort((a, b) => `${a.v.vehicle.model} ${a.v.trim}`.localeCompare(`${b.v.vehicle.model} ${b.v.trim}`, undefined, { numeric: true }));
  return (
    <article className="mx-auto max-w-content px-4 pb-16 pt-6">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((cr, i) => ({ "@type": "ListItem", position: i + 1, name: cr.label, item: cr.href ? new URL(cr.href, canonical).toString() : canonical })) }} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <Breadcrumb items={crumbs} />
      <h1 className="mt-4 max-w-prose">{c.h1(make.name)}</h1>
      <p className="mt-3 max-w-prose text-[18px] text-ink2">{c.intro(vars)}</p>
      <div className="mt-6">
        <ModelPicker items={all} copy={copy} locale={locale} />
      </div>
      <section className="mt-10">
        <h2>{c.modelsHeading(make.name)}</h2>
        <div className="mt-4">
          <ModelCards items={items} copy={copy} locale={locale} />
        </div>
      </section>
      {t && (
        <section className="mt-10">
          <h2>{c.costHeading}</h2>
          <p className="mt-2 max-w-prose text-ink2">{c.costIntro(t.label[lang] ?? t.slug, centsPerKwh(Number(t.price_cents_per_kwh), locale), `${int(Number(t.charging_loss_pct), locale)} %`, km)}</p>
          <div className="mt-4">
            <CostTable rows={sorted} copy={copy} locale={locale} km={km} />
          </div>
          <p className="mt-3 text-[15px]">
            <Link href={`/${cfg.segment}/${COST_SECTION[locale]}`}>{c.allCostsLink} →</Link>
          </p>
        </section>
      )}
      <div className="mt-10">
        <Faq heading={copy.charger.faq.heading} items={faqItems} />
      </div>
      {otherMakes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[18px]">{c.otherMakes}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
            {otherMakes.map((m) => (
              <li key={m.id}>
                <Link href={makePath(locale, m.slug)} className="inline-block py-1">
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
