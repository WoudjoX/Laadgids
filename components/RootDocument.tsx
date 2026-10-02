import { inter } from "@/app/fonts";
import { Analytics } from "@/components/Analytics";

/** <html> en <body> voor elke root-layout. `lang` volgt de locale van het pad, zodat een Franse pagina ook als Frans gemarkeerd is. */
export function RootDocument({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    <html lang={lang} className={inter.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
