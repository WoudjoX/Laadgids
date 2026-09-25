import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/alternates";

// Eén sitemap-index (app/sitemap-index.xml/route.ts); Google negeert changefreq en priority, dus die staan niet in de deelbestanden.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/design-lab"] }],
    sitemap: `${base}/sitemap-index.xml`,
  };
}
