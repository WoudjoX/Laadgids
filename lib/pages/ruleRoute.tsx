// Gedeelde logica voor de regel-routes (regels / regles): params, metadata, render.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { RulePage } from "@/components/pages/RulePage";
import { LOCALE_CONFIG, LOCALES, RULES_SECTION, getCopy, localeFromSegment, rulePath } from "@/lib/copy";
import { RULES, ruleContent } from "@/lib/content/rules";
import { loadAllVersions, loadPages } from "@/lib/db/cached";
import type { Locale } from "@/lib/db/types";
import { alternatesFor, assertValidHreflangKeys } from "@/lib/seo/alternates";

export interface RuleParams {
  locale: string;
  region: string;
  topic: string;
}

function localesForSection(section: string): Locale[] {
  return LOCALES.filter((l) => RULES_SECTION[l] === section);
}

export function ruleStaticParams(section: string): RuleParams[] {
  return RULES.filter((r) => localesForSection(section).includes(r.locale)).map((r) => ({
    locale: LOCALE_CONFIG[r.locale].segment,
    region: r.region,
    topic: r.topic,
  }));
}

async function resolve(section: string, params: RuleParams) {
  const locale = localeFromSegment(params.locale);
  if (!locale || RULES_SECTION[locale] !== section) return null;
  const rule = ruleContent(locale, params.region, params.topic);
  if (!rule) return null;
  const pages = await loadPages(undefined, "rule");
  const page = pages.find((p) => p.path === rulePath(locale, rule.region, rule.topic));
  if (!page || page.status === "draft") return null;
  return { locale, rule, page, pages };
}

export async function ruleMetadata(section: string, params: RuleParams): Promise<Metadata> {
  const r = await resolve(section, params);
  if (!r) return {};
  const alt = alternatesFor(r.page, r.pages);
  assertValidHreflangKeys(alt.languages as Record<string, string>);
  return {
    title: `${r.rule.title} | ${getCopy(r.locale).site.name}`,
    description: r.rule.intro,
    alternates: { canonical: alt.canonical, languages: alt.languages },
    robots: r.page.status === "index" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: r.rule.title, description: r.rule.intro, url: alt.canonical, locale: alt.ogLocale, alternateLocale: alt.ogAlternateLocales, type: "article" },
  };
}

export async function renderRule(section: string, params: RuleParams) {
  const r = await resolve(section, params);
  if (!r) notFound();
  const copy = getCopy(r.locale);
  const cfg = LOCALE_CONFIG[r.locale];
  const [versions, chargerPages] = await Promise.all([loadAllVersions(), loadPages(r.locale, "charger_for_model")]);
  const live = new Set(chargerPages.filter((p) => p.status !== "draft").map((p) => p.path));
  const modelLinks = versions
    .filter((v) => v.sold_in.includes(cfg.country))
    .map((v) => ({ path: `/${cfg.segment}/${copy.charger.sectionSlug}/${v.slug}`, label: `${v.make.name} ${v.vehicle.model} ${v.trim}` }))
    .filter((l) => live.has(l.path))
    .sort((a, b) => a.label.localeCompare(b.label));
  const alt = alternatesFor(r.page, r.pages);
  return (
    <Shell copy={copy} locale={r.locale} alternates={alt.languages}>
      <RulePage rule={r.rule} copy={copy} locale={r.locale} canonical={alt.canonical} modelLinks={modelLinks} />
    </Shell>
  );
}
