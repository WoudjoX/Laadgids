import Link from "next/link";
import { makePath, type Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { durationShort } from "@/lib/format";
import type { MakeTile } from "@/lib/pages/homeOverview";

/** Raster van merken: naam, aantal modellen en spreiding van de laadtijd. Elke tegel linkt naar de merkpagina. */
export function MakeGrid({ tiles, copy, locale }: { tiles: MakeTile[]; copy: Copy; locale: Locale }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((t) => {
        const from = durationShort(t.minSeconds, locale);
        const to = durationShort(t.maxSeconds, locale);
        return (
          <li key={t.slug}>
            <Link href={makePath(locale, t.slug)} className="block h-full rounded-card border-hair border-line bg-card p-4 no-underline hover:border-line2">
              <span className="block text-[17px] font-semibold text-ink">{t.name}</span>
              <span className="mt-1 block text-[14px] text-ink2">{copy.home.makeTileCount(t.count)}</span>
              <span className="tnum mt-2 block text-[13px] text-ink3">{copy.home.makeTileTime(from, to, from === to)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
