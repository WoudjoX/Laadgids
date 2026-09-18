import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";

interface Props {
  copy: Copy;
  locale: Locale;
  /** Paden of URL's van deze pagina in andere locales, voor de taalwissel. */
  alternates?: Partial<Record<Locale, string>>;
  children: React.ReactNode;
}

/** Header en footer rond een pagina. Pagina's renderen dit zelf, zodat de taalwissel de vertaalde pagina kent. */
export function Shell({ copy, locale, alternates, children }: Props) {
  return (
    <>
      <Header copy={copy} locale={locale} alternates={alternates} />
      <main>{children}</main>
      <Footer copy={copy} locale={locale} />
    </>
  );
}
