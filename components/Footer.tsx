import Link from "next/link";
import type { Copy } from "@/lib/copy";
import { LOCALE_CONFIG } from "@/lib/copy";
import { STATIC_PAGES } from "@/lib/content/static";
import type { Locale } from "@/lib/db/types";

interface Props {
  copy: Copy;
  locale: Locale;
}

/** Over ons, contact, privacy, taalversies. Een echte naam erachter (DESIGN.md §3). */
export function Footer({ copy, locale }: Props) {
  const seg = LOCALE_CONFIG[locale].segment;
  const pages = STATIC_PAGES[locale];
  return (
    <footer className="mt-16 border-t-hair border-line">
      <div className="mx-auto max-w-content px-4 py-10 text-[14px] text-ink2">
        <p className="mb-4 max-w-prose">{copy.site.tagline}</p>
        <p className="mb-4">Erwin Martens, SaasSolutions BV.</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href={`/${seg}/${pages.about.slug}`}>{copy.site.footerAbout}</Link>
          <Link href={`/${seg}/${pages.contact.slug}`}>{copy.site.footerContact}</Link>
          <Link href={`/${seg}/${pages.privacy.slug}`}>{copy.site.footerPrivacy}</Link>
        </nav>
      </div>
    </footer>
  );
}
