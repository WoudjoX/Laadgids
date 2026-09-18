import { notFound } from "next/navigation";
import { LOCALES, LOCALE_CONFIG, localeFromSegment } from "@/lib/copy";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: LOCALE_CONFIG[l].segment }));
}

/** Alleen locale-validatie en lang-attribuut. Header en footer komen uit components/Shell per pagina. */
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  return <div lang={LOCALE_CONFIG[locale].htmlLang}>{children}</div>;
}
