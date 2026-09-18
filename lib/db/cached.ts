// Gecachte loaders met tags voor on-demand revalidate (CLAUDE.md §7).
// Tagconventie: version:{slug} | rules:{country} | tariffs:{country} | pages:{locale}
import { unstable_cache } from "next/cache";
import { getRepo } from "./index";
import type { Country, Locale, Region, Template } from "./types";

export const tags = {
  version: (slug: string) => `version:${slug}`,
  rules: (country: Country) => `rules:${country}`,
  rule: (country: Country, region: Region | null, type: string) => `rule:${country}:${region ?? "ALL"}:${type}`,
  tariffs: (country: Country) => `tariffs:${country}`,
  pages: (locale: Locale) => `pages:${locale}`,
  allPages: "pages",
};

export const loadVersion = (slug: string) =>
  unstable_cache(async () => (await getRepo()).getVersionBySlug(slug), ["version", slug], { tags: [tags.version(slug)], revalidate: 86400 })();

export const loadRules = (country: Country) =>
  unstable_cache(async () => (await (await getRepo()).listRules()).filter((r) => r.country === country), ["rules", country], {
    tags: [tags.rules(country)],
    revalidate: 86400,
  })();

export const loadTariffs = (country: Country, region: Region | null) =>
  unstable_cache(async () => (await getRepo()).listTariffs(country, region), ["tariffs", country, region ?? "ALL"], {
    tags: [tags.tariffs(country)],
    revalidate: 86400,
  })();

export const loadPages = (locale?: Locale, template?: Template) =>
  unstable_cache(
    async () => (await getRepo()).listPages({ locale, template, status: ["index", "noindex"] }),
    ["pages", locale ?? "ALL", template ?? "ALL"],
    { tags: [tags.allPages, ...(locale ? [tags.pages(locale)] : [])], revalidate: 86400 },
  )();

export const loadAllVersions = () =>
  unstable_cache(async () => (await getRepo()).listVersions(), ["versions-all"], { tags: ["versions"], revalidate: 86400 })();
