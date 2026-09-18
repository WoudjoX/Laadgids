// Eén sitemap per (locale, template), alleen status='index', max 5.000 URL's per bestand (CLAUDE.md §7).
import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/copy";
import { loadPages } from "@/lib/db/cached";
import type { Locale, Template } from "@/lib/db/types";
import { siteUrl } from "@/lib/seo/alternates";

const TEMPLATES: Template[] = ["charger_for_model", "charging_cost", "vaa", "bijtelling", "rule", "used_battery", "installer_city"];
const MAX = 5000;

export interface SitemapId {
  id: string; // "nl-BE.charger_for_model.0"
}

export async function generateSitemaps(): Promise<SitemapId[]> {
  const ids: SitemapId[] = [];
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
  const [locale, template, chunkStr] = (await id).split(".") as [Locale, Template, string];
  const chunk = Number(chunkStr ?? 0);
  const base = siteUrl();
  const pages = (await loadPages(locale, template)).filter((p) => p.status === "index").sort((a, b) => a.path.localeCompare(b.path));
  return pages.slice(chunk * MAX, (chunk + 1) * MAX).map((p) => ({
    url: base + p.path,
    lastModified: p.last_calculated_at ? new Date(p.last_calculated_at) : undefined,
    changeFrequency: "monthly",
  }));
}
