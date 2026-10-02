import Link from "next/link";
import { LOCALE_CONFIG, type Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";

/** Inhoud van de 404-pagina: korte melding en twee uitwegen. */
export function NotFoundBody({ copy, locale }: { copy: Copy; locale: Locale }) {
  const seg = LOCALE_CONFIG[locale].segment;
  return (
    <div className="mx-auto max-w-content px-4 pb-16 pt-10">
      <h1 className="max-w-prose">{copy.site.notFound.title}</h1>
      <p className="mt-3 max-w-prose text-[18px] text-ink2">{copy.site.notFound.body}</p>
      <ul className="mt-6 space-y-2 text-[16px]">
        <li>
          <Link href={`/${seg}`}>{copy.site.notFound.home} →</Link>
        </li>
        <li>
          <Link href={`/${seg}/${copy.charger.sectionSlug}`}>{copy.site.notFound.models} →</Link>
        </li>
      </ul>
    </div>
  );
}
