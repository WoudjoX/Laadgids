import Link from "next/link";
import { makePath, type Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { durationShort } from "@/lib/format";
import type { MakeTile } from "@/lib/pages/homeOverview";

interface Props {
  tiles: MakeTile[];
  copy: Copy;
  locale: Locale;
  /** Link en aantal voor de laatste tegel "Alle modellen". */
  allHref: string;
  allCount: number;
}

/** Schaal in hele uren boven de traagste uitvoering, zodat de balken over merken heen vergelijkbaar zijn. */
export function scaleHours(tiles: MakeTile[]): number {
  const max = Math.max(0, ...tiles.map((t) => t.maxSeconds));
  return Math.max(1, Math.ceil(max / 3600));
}

/**
 * Merkentegels: naam en aantal op één regel, laadtijd (20 naar 80 %) als cijfer en als balk op een gedeelde schaal.
 * Laatste tegel linkt naar alle modellen. Geen client-JS: hover via CSS.
 */
export function MakeGridV2({ tiles, copy, locale, allHref, allCount }: Props) {
  const hours = scaleHours(tiles);
  const scale = hours * 3600;
  return (
    <div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {tiles.map((t) => {
          const from = durationShort(t.minSeconds, locale);
          const to = durationShort(t.maxSeconds, locale);
          const left = (t.minSeconds / scale) * 100;
          const width = Math.max(3, ((t.maxSeconds - t.minSeconds) / scale) * 100);
          return (
            <li key={t.slug}>
              <Link
                href={makePath(locale, t.slug)}
                className="group block h-full rounded-card border-hair border-line bg-card px-3 py-3 no-underline transition-colors hover:border-accent sm:px-4"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[16px] font-semibold text-ink">{t.name}</span>
                  <span className="tnum shrink-0 text-[13px] text-ink3 group-hover:hidden">{t.count}</span>
                  <span className="hidden shrink-0 text-[14px] text-accent group-hover:inline" aria-hidden="true">
                    →
                  </span>
                </span>
                <span className="tnum mt-1 block whitespace-nowrap text-[15px] font-medium text-ink2">{copy.home.makeTileRange(from, to, from === to)}</span>
                <span className="relative mt-2 block h-1.5 w-full rounded-sm bg-paper" aria-hidden="true">
                  <span className="absolute top-0 h-1.5 rounded-sm bg-ink2 group-hover:bg-accent" style={{ left: `${left}%`, width: `${width}%` }} />
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={allHref}
            className="group flex h-full flex-col justify-center rounded-card border-hair border-dashed border-line2 bg-paper px-3 py-3 no-underline transition-colors hover:border-accent sm:px-4"
          >
            <span className="text-[16px] font-semibold text-ink">
              {copy.home.allModelsTile.title} <span className="text-accent">→</span>
            </span>
            <span className="tnum mt-1 text-[13px] text-ink3">{copy.home.allModelsTile.sub(allCount)}</span>
          </Link>
        </li>
      </ul>
      <p className="mt-3 text-[13px] text-ink3">{copy.home.makeScale(hours)}</p>
    </div>
  );
}
