// 404 voor adressen die bij geen enkele route horen (bv. /foo). Staat buiten de layouts, dus laadt zelf stijl en lettertype.
import type { Metadata } from "next";
import "./globals.css";
import { inter } from "@/app/fonts";
import { NotFoundBody } from "@/components/NotFoundBody";
import { Shell } from "@/components/Shell";
import { LOCALE_CONFIG, getCopy } from "@/lib/copy";

const LOCALE = "nl-BE" as const;

export const metadata: Metadata = { title: getCopy(LOCALE).site.notFound.title, robots: { index: false, follow: true } };

export default function GlobalNotFound() {
  const copy = getCopy(LOCALE);
  return (
    <html lang={LOCALE_CONFIG[LOCALE].htmlLang} className={inter.variable}>
      <body>
        <Shell copy={copy} locale={LOCALE}>
          <NotFoundBody copy={copy} locale={LOCALE} />
        </Shell>
      </body>
    </html>
  );
}
