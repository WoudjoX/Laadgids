// Template 'rule': hub met bronnen en datum, geen berekening (CLAUDE.md 4.1). Linkt naar de P1-pagina's en naar verwante regels.
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { SourcesBlock } from "@/components/SourcesBlock";
import { LOCALE_CONFIG, RULES_SECTION, rulePath, type Copy } from "@/lib/copy";
import { ruleLinkText, type RuleContent } from "@/lib/content/rules";
import type { Locale, Region } from "@/lib/db/types";
import { dateLong } from "@/lib/format";

interface Props {
  rule: RuleContent;
  copy: Copy;
  locale: Locale;
  canonical: string;
  modelLinks: { path: string; label: string }[];
}

export function RulePage({ rule, copy, locale, canonical, modelLinks }: Props) {
  const cfg = LOCALE_CONFIG[locale];
  const regionLabel = rule.region === "be" || rule.region === "nl" ? copy.site.regionNone : copy.site.regionLabel[rule.region.toUpperCase() as Region];
  const crumbs = [
    { label: copy.site.home, href: `/${cfg.segment}` },
    { label: copy.charger.related.rules, href: `/${cfg.segment}/${RULES_SECTION[locale]}/${rule.region}` },
    { label: rule.h1 },
  ];
  // Interne links in de kennisbank zijn geschreven als "/regels/<slug>"; vertaal naar het echte pad.
  const resolveHref = (h: string) => {
    const m = /^\/(?:regels|regles)\/([a-z0-9-]+)$/.exec(h);
    return m ? rulePath(locale, rule.region, m[1]!) : h;
  };
  const related = rule.related.map((t) => ({ path: rulePath(locale, rule.region, t), label: ruleLinkText(locale, t) })).filter((r) => r.label);

  return (
    <article className="mx-auto max-w-content px-4 pb-16 pt-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: c.href ? new URL(c.href, canonical).toString() : canonical })),
        }}
      />
      <Breadcrumb items={crumbs} />
      <h1 className="mt-4 max-w-prose">{rule.h1}</h1>
      <p className="mt-2 text-[14px] text-ink2">
        {copy.site.updated} {dateLong(rule.updated, locale)} · {regionLabel}
      </p>
      <div className="mt-6 rounded-card bg-accentSoft px-5 py-5 md:px-6">
        <p className="mb-2 text-[13px] font-semibold text-accent">{copy.charger.shortAnswerLabel}</p>
        <p className="max-w-prose text-[18px] leading-relaxed text-ink">{rule.intro}</p>
      </div>
      <div className="mt-8">
        <Markdown md={rule.bodyMd} resolveHref={resolveHref} />
      </div>
      {related.length > 0 && (
        <section className="mt-10">
          <h2>{copy.charger.related.heading}</h2>
          <ul className="mt-3 space-y-1">
            {related.map((r) => (
              <li key={r.path}>
                <Link href={r.path}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {modelLinks.length > 0 && (
        <section className="mt-10">
          <h2>{copy.charger.breadcrumbSection}</h2>
          <ul className="mt-3 columns-1 gap-6 space-y-1 sm:columns-2">
            {modelLinks.map((l) => (
              <li key={l.path}>
                <Link href={l.path}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-10">
        <SourcesBlock heading={copy.charger.sources.heading} checkedLabel={copy.charger.sources.checked} sources={rule.sources} locale={locale} />
      </div>
    </article>
  );
}
