// Merkpagina (template make_hub): sjabloonintro uit de data, keuzeveld, alle uitvoeringen van het merk, andere merken.
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { ModelCards, type ModelCardItem } from "@/components/ModelCards";
import { ModelPicker } from "@/components/ModelPicker";
import { LOCALE_CONFIG, makePath, type Copy, type MakeHubVars } from "@/lib/copy";
import type { Locale, MakeRow } from "@/lib/db/types";

interface Props {
  copy: Copy;
  locale: Locale;
  make: MakeRow;
  items: ModelCardItem[]; // dit merk
  all: ModelCardItem[]; // alle modellen, voor het keuzeveld
  otherMakes: MakeRow[];
  vars: MakeHubVars;
  canonical: string;
}

export function MakePage({ copy, locale, make, items, all, otherMakes, vars, canonical }: Props) {
  const cfg = LOCALE_CONFIG[locale];
  const c = copy.makeHub;
  const crumbs = [
    { label: copy.site.home, href: `/${cfg.segment}` },
    { label: copy.charger.breadcrumbSection, href: `/${cfg.segment}/${copy.charger.sectionSlug}` },
    { label: make.name },
  ];
  return (
    <article className="mx-auto max-w-content px-4 pb-16 pt-6">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((cr, i) => ({ "@type": "ListItem", position: i + 1, name: cr.label, item: cr.href ? new URL(cr.href, canonical).toString() : canonical })) }} />
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
      {otherMakes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[18px]">{c.otherMakes}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
            {otherMakes.map((m) => (
              <li key={m.id}>
                <Link href={makePath(locale, m.slug)}>{m.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
