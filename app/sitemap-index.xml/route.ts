// Sitemap-index op /sitemap-index.xml: één adres voor Search Console, verwijst naar de sitemaps per (locale, template) in /sitemap/.
// Next heeft geen ingebouwde index en reserveert /sitemap.xml voor app/sitemap.ts; de deelbestanden blijven op /sitemap/{id}.xml.
import { generateSitemaps } from "@/app/sitemap";
import { siteUrl } from "@/lib/seo/alternates";

export const revalidate = 86400;

export async function GET() {
  const base = siteUrl();
  const ids = await generateSitemaps();
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    ids.map((s) => `<sitemap><loc>${base}/sitemap/${s.id}.xml</loc></sitemap>`).join("\n") +
    `\n</sitemapindex>\n`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
