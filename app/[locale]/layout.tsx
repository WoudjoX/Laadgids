import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { RootDocument } from "@/components/RootDocument";
import { LOCALES, LOCALE_CONFIG, localeFromSegment } from "@/lib/copy";
import { siteUrl } from "@/lib/seo/alternates";

export const metadata: Metadata = {
  title: "Laadgids",
  metadataBase: new URL(siteUrl()),
};

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: LOCALE_CONFIG[l].segment }));
}

/**
 * Root-layout per locale: het lang-attribuut op <html> volgt het pad (nl-BE, fr-BE, nl-NL).
 * Header en footer komen uit components/Shell per pagina. Een onbekende pagina binnen een locale geeft de 404 van not-found.tsx in de taal van het pad; een adres dat bij geen enkele route hoort
 * geeft app/global-not-found.tsx. Geen dynamicParams = false hier: dat schakelt ook het op aanvraag renderen van nieuwe modelpagina's uit.
 */
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  return <RootDocument lang={LOCALE_CONFIG[locale].htmlLang}>{children}</RootDocument>;
}
