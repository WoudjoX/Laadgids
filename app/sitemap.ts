// Eén sitemap per (locale, template), alleen status='index', max 5.000 URL's per bestand (CLAUDE.md §7).
import type { MetadataRoute } from "next";
import { COST_SECTION, LOCALES, LOCALE_CONFIG, RULES_SECTION, getCopy } from "@/lib/copy";
import { STATIC_PAGES } from "@/lib/content/static";
import { indexableLocales } from "@/lib/seo/locales";
import { ruleContent } from "@/lib/content/rules";
import { loadAllVersions, loadPages, loadRules, loadTariffs } from "@/lib/db/cached";
import type { Locale, PageRow, Template } from "@/lib/db/types";
import { buildChargerPage } from "@/lib/pages/charger";
import { buildCostPage } from "@/lib/pages/cost";
import { siteUrl } from "@/lib/seo/alternates";

const TEMPLATES: Template[] = ["charger_for_model", "charging_cost", "vaa", "bijtelling", "rule", "used_battery", "installer_city", "make_hub"];
const MAX = 5000;

export interface SitemapId {
  id: string; // "nl-BE.charger_for_model.0"
}

/** Overzichtspagina's zonder rij in `pages`: startpagina, sectie-indexen, regelindex, statische pagina's op index. */
async function hubUrls(locale: Locale): Promise<string[]> {
  const seg = `/${LOCALE_CONFIG[locale].segment}`;
  const copy = getCopy(locale);
  const out = [seg, `${seg}/${copy.charger.sectionSlug}`];
  if ((await loadPages(locale, "charging_cost")).some((p) => p.status === "index")) out.push(`${seg}/${COST_SECTION[locale]}`);
  if ((await loadPages(locale, "rule")).some((p) => p.status === "index")) out.push(`${seg}/${RULES_SECTION[locale]}/be`);
  for (const p of Object.values(STATIC_PAGES[locale])) if (!p.noindex) out.push(`${seg}/${p.slug}`);
  return out;
}

export async function generateSitemaps(): Promise<SitemapId[]> {
  const ids: SitemapId[] = [];
  for (const locale of await indexableLocales()) ids.push({ id: `${locale}.hub.0` });
  for (const locale of LOCALES) {
    for (const t of TEMPLATES) {
      const n = (await loadPages(locale, t)).filter((p) => p.status === "index").length;
      const chunks = Math.max(1, Math.ceil(n / MAX));
      for (let i = 0; i < chunks; i++) if (n > 0) ids.push({ id: `${locale}.${t}.${i}` });
    }
  }
  return ids;
}

/**
 * lastmod = de datum "Bijgewerkt" op de pagina zelf: de jongste brondatum van wat de pagina gebruikt. Zo is lastmod
 * alleen nieuw als de inhoud echt veranderde, niet bij elke herberekening. Valt terug op last_calculated_at.
 */
async function lastModifiedFor(locale: Locale): Promise<(p: PageRow) => string | null> {
  const cfg = LOCALE_CONFIG[locale];
  const today = new Date().toISOString().slice(0, 10);
  const [versions, rules, tariffs, chargerPages] = await Promise.all([loadAllVersions(), loadRules(cfg.country), loadTariffs(cfg.country, cfg.region), loadPages(locale, "charger_for_model")]);
  const byId = new Map(versions.map((v) => [v.id, v]));
  const charger = new Map<number, string>();
  for (const p of chargerPages) {
    const v = p.entity_id != null ? byId.get(p.entity_id) : undefined;
    if (v) charger.set(v.id, buildChargerPage(v, locale, rules, tariffs, today).updatedAt);
  }
  const max = (xs: (string | undefined)[]) => xs.filter((x): x is string => Boolean(x)).sort().at(-1) ?? null;
  return (p) => {
    const v = p.entity_id != null ? byId.get(p.entity_id) : undefined;
    switch (p.template) {
      case "charger_for_model":
        return (v && charger.get(v.id)) ?? null;
      case "charging_cost": {
        const t = tariffs.find((x) => x.id === p.secondary_id);
        return v && t ? buildCostPage(v, locale, t, tariffs, today).updatedAt : null;
      }
      case "make_hub":
        return max(versions.filter((x) => x.make.id === p.entity_id).map((x) => charger.get(x.id)));
      case "rule": {
        const [, , , region, topic] = p.path.split("/");
        return (region && topic && ruleContent(locale, region, topic)?.updated) || null;
      }
      default:
        return null;
    }
  };
}

// Next 16: `id` is een Promise.
export default async function sitemap({ id }: { id: Promise<string> | string }): Promise<MetadataRoute.Sitemap> {
  const [locale, template, chunkStr] = (await id).split(".") as [Locale, Template | "hub", string];
  const chunk = Number(chunkStr ?? 0);
  const base = siteUrl();
  const lastmod = await lastModifiedFor(locale);
  if (template === "hub") {
    // Overzichten tonen alles van de locale: jongste datum van de pagina's op index.
    const dates = (await loadPages(locale)).filter((p) => p.status === "index").map(lastmod);
    const last = dates.filter((d): d is string => Boolean(d)).sort().at(-1);
    return (await hubUrls(locale)).map((u) => ({ url: base + u, lastModified: last ? new Date(last) : undefined }));
  }
  const pages = (await loadPages(locale, template)).filter((p) => p.status === "index").sort((a, b) => a.path.localeCompare(b.path));
  return pages.slice(chunk * MAX, (chunk + 1) * MAX).map((p) => {
    const d = lastmod(p) ?? p.last_calculated_at;
    return { url: base + p.path, lastModified: d ? new Date(d) : undefined };
  });
}
