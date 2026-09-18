import type { MetadataRoute } from "next";
import { generateSitemaps } from "./sitemap";
import { siteUrl } from "@/lib/seo/alternates";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl();
  const ids = await generateSitemaps();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/design-lab"] }],
    sitemap: ids.map((s) => `${base}/sitemap/${s.id}.xml`),
  };
}
