import Link from "next/link";
import type { Copy } from "@/lib/copy";
import { LOCALE_CONFIG } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";

interface Props {
  copy: Copy;
  locale: Locale;
  /** Paden van deze pagina in andere locales; ontbreekt een locale, dan linkt de wissel naar de locale-home. */
  alternates?: Partial<Record<Locale, string>>;
}

/** Wordmark links, taalwissel rechts. Meer niet (DESIGN.md §3). */
export function Header({ copy, locale, alternates = {} }: Props) {
  return (
    <header className="border-b-hair border-line">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-4">
        <Link href={`/${LOCALE_CONFIG[locale].segment}`} className="text-[17px] font-semibold no-underline">
          {copy.site.name}
        </Link>
        {copy.site.langSwitch.length > 1 && (
          <nav aria-label="language" className="flex gap-3 text-[14px] text-ink2">
            {copy.site.langSwitch.map((l, i) => {
              const href = alternates[l.locale] ?? `/${LOCALE_CONFIG[l.locale].segment}`;
              const active = l.locale === locale;
              return (
                <span key={l.locale} className="flex gap-3">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {active ? (
                    <span className="text-ink" aria-current="true">
                      {l.label}
                    </span>
                  ) : (
                    <Link href={href} hrefLang={l.locale} className="no-underline hover:underline">
                      {l.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
