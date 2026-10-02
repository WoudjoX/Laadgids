import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { NotFoundBody } from "@/components/NotFoundBody";
import { Shell } from "@/components/Shell";
import { getCopy, localeFromSegment } from "@/lib/copy";

export const metadata: Metadata = { robots: { index: false, follow: true } };

/** 404 binnen een locale (onbekend model, draft-pagina): in de taal van het pad, met header en footer. */
export default async function NotFound() {
  const locale = localeFromSegment((await rootLocale()) ?? "") ?? "nl-BE";
  const copy = getCopy(locale);
  return (
    <Shell copy={copy} locale={locale}>
      <NotFoundBody copy={copy} locale={locale} />
    </Shell>
  );
}
