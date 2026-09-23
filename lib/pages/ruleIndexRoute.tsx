// Overzicht van regelpagina's per regio (/nl-be/regels/be). Doel van de broodkruimel op elke regelpagina.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Shell } from "@/components/Shell";
import { LOCALES, LOCALE_CONFIG, RULES_SECTION, getCopy, localeFromSegment, rulePath } from "@/lib/copy";
import { RULES } from "@/lib/content/rules";
import type { Locale, Region } from "@/lib/db/types";
import { dateLong } from "@/lib/format";
import { siteUrl } from "@/lib/seo/alternates";

function resolve(section: string, seg: string, region: string): { locale: Locale; rules: typeof RULES } | null {
  const locale = localeFromSegment(seg);
  if (!locale || RULES_SECTION[locale] !== section) return null;
  const rules = RULES.filter((r) => r.locale === locale && r.region === region);
  return rules.length ? { locale, rules } : null;
}

export function ruleIndexStaticParams(section: string): { locale: string; region: string }[] {
  const seen = new Set<string>();
  const out: { locale: string; region: string }[] = [];
  for (const r of RULES) {
    if (RULES_SECTION[r.locale] !== section) continue;
    const key = `${r.locale}/${r.region}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ locale: LOCALE_CONFIG[r.locale].segment, region: r.region });
  }
  return out;
}

export function ruleIndexMetadata(section: string, seg: string, region: string): Metadata {
  const r = resolve(section, seg, region);
  if (!r) return {};
  const copy = getCopy(r.locale);
  const path = `/${LOCALE_CONFIG[r.locale].segment}/${RULES_SECTION[r.locale]}/${region}`;
  return { title: `${copy.charger.related.rules} | ${copy.site.name}`, description: r.rules.map((x) => x.linkText).join(" · "), alternates: { canonical: siteUrl() + path } };
}

export function renderRuleIndex(section: string, seg: string, region: string) {
  const r = resolve(section, seg, region);
  if (!r) notFound();
  const copy = getCopy(r.locale);
  const cfg = LOCALE_CONFIG[r.locale];
  const regionLabel = region === "be" || region === "nl" ? copy.site.regionNone : copy.site.regionLabel[region.toUpperCase() as Region];
  const alternates = Object.fromEntries(LOCALES.filter((l) => RULES.some((x) => x.locale === l)).map((l) => [l, `/${LOCALE_CONFIG[l].segment}/${RULES_SECTION[l]}/${region}`]));
  return (
    <Shell copy={copy} locale={r.locale} alternates={alternates}>
      <div className="mx-auto max-w-content px-4 pb-16 pt-6">
        <Breadcrumb items={[{ label: copy.site.home, href: `/${cfg.segment}` }, { label: copy.charger.related.rules }]} />
        <h1 className="mt-4 max-w-prose">{copy.charger.related.rules}</h1>
        <p className="mt-2 text-[14px] text-ink2">{regionLabel}</p>
        <ul className="mt-8 space-y-3">
          {r.rules.map((x) => (
            <li key={x.topic}>
              <Link href={rulePath(r.locale, x.region, x.topic)} className="block rounded-card border-hair border-line bg-card p-4 no-underline hover:border-line2">
                <p className="text-[18px] font-semibold text-ink">{x.linkText}</p>
                <p className="mt-1 max-w-prose text-[15px] text-ink2">{x.intro}</p>
                <p className="mt-2 text-[13px] text-ink3">
                  {copy.site.updated} {dateLong(x.updated, r.locale)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}
