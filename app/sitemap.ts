// Eén sitemap per (locale, template), alleen status='index', max 5.000 URL's per bestand (CLAUDE.md §7).
import type { MetadataRoute } from "next";
import { COST_SECTION, LOCALES, LOCALE_CONFIG, RULES_SECTION, getCopy } from "@/lib/copy";
import { STATIC_PAGES } from "@/lib/content/static";
import { indexableLocales } from "@/lib/seo/locales";
import { loadPages } from "@/lib/db/cached";
import type { Locale, Template } from "@/lib/db/types";
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

// Next 16: `id` is een Promise.
export default async function sitemap({ id }: { id: Promise<string> | string }): Promise<MetadataRoute.Sitemap> {
  const [locale, template, chunkStr] = (await id).split(".") as [Locale, Template | "hub", string];
  const chunk = Number(chunkStr ?? 0);
  const base = siteUrl();
  if (template === "hub") {
    const all = await loadPages(locale);
    const last = all.reduce<string | null>((m, p) => (p.last_calculated_at && (!m || p.last_calculated_at > m) ? p.last_calculated_at : m), null);
    return (await hubUrls(locale)).map((u) => ({ url: base + u, lastModified: last ? new Date(last) : undefined }));
  }
  const pages = (await loadPages(locale, template)).filter((p) => p.status === "index").sort((a, b) => a.path.localeCompare(b.path));
  return pages.slice(chunk * MAX, (chunk + 1) * MAX).map((p) => ({
    url: base + p.path,
    lastModified: p.last_calculated_at ? new Date(p.last_calculated_at) : undefined,
  }));
}
