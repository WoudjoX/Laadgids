// Statische pagina's: over, contact, privacy (lib/content/static.ts). Eén niveau onder de locale.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Shell } from "@/components/Shell";
import { LOCALES, LOCALE_CONFIG, getCopy, localeFromSegment } from "@/lib/copy";
import { STATIC_PAGES, staticPageBySlug, type StaticKey } from "@/lib/content/static";
import type { Locale } from "@/lib/db/types";
import { siteUrl } from "@/lib/seo/alternates";

interface Params {
  locale: string;
  page: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return LOCALES.flatMap((l) => Object.values(STATIC_PAGES[l]).map((p) => ({ locale: LOCALE_CONFIG[l].segment, page: p.slug })));
}

function resolve(params: Params) {
  const locale = localeFromSegment(params.locale);
  if (!locale) return null;
  const page = staticPageBySlug(locale, params.page);
  if (!page) return null;
  const key = (Object.keys(STATIC_PAGES[locale]) as StaticKey[]).find((k) => STATIC_PAGES[locale][k].slug === params.page)!;
  return { locale, page, key };
}

function alternatesFor(key: StaticKey): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {};
  for (const l of LOCALES) out[l] = `/${LOCALE_CONFIG[l].segment}/${STATIC_PAGES[l][key].slug}`;
  return out;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const r = resolve(await params);
  if (!r) return {};
  const alt = alternatesFor(r.key);
  const base = siteUrl();
  const languages: Record<string, string> = {};
  for (const [l, p] of Object.entries(alt)) languages[l] = base + p;
  languages["x-default"] = base + alt["nl-BE"]!;
  return {
    title: `${r.page.title} | ${getCopy(r.locale).site.name}`,
    description: r.page.paragraphs[0],
    robots: r.page.noindex ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical: base + alt[r.locale], languages },
  };
}

export default async function StaticPage({ params }: { params: Promise<Params> }) {
  const r = resolve(await params);
  if (!r) notFound();
  const copy = getCopy(r.locale);
  const seg = LOCALE_CONFIG[r.locale].segment;
  return (
    <Shell copy={copy} locale={r.locale} alternates={alternatesFor(r.key)}>
      <article className="mx-auto max-w-content px-4 pb-16 pt-6">
        <Breadcrumb items={[{ label: copy.site.home, href: `/${seg}` }, { label: r.page.title }]} />
        <h1 className="mt-4 max-w-prose">{r.page.title}</h1>
        <div className="mt-6 max-w-prose space-y-4 text-ink">
          {r.page.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </article>
    </Shell>
  );
}
