import Link from "next/link";
import { makePath, type Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { durationShort, kw } from "@/lib/format";
import type { MakeTile } from "@/lib/pages/homeOverview";

interface Props {
  tiles: MakeTile[];
  copy: Copy;
  locale: Locale;
  /** Link en aantal voor de laatste tegel "Alle modellen". */
  allHref: string;
  allCount: number;
}

/** Aantal modelnamen per tegel: twee op gsm (smalle tegel), drie vanaf tablet. */
const SHOWN_MOBILE = 2;
const SHOWN_MODELS = 3;

/**
 * Merkentegels: naam en aantal, de modelnamen (zodat je ziet of je auto erbij staat), de laadtijd van 20 naar 80 %
 * als klein cijfer, en een etiket alleen als het merk eenfasig of boven 11 kW laadt. Laatste tegel: alle modellen.
 * Geen client-JS: hover via CSS.
 */
export function MakeGridV2({ tiles, copy, locale, allHref, allCount }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
      {tiles.map((t) => {
        const from = durationShort(t.minSeconds, locale);
        const to = durationShort(t.maxSeconds, locale);
        const moreMobile = t.models.length - SHOWN_MOBILE;
        const moreDesktop = t.models.length - SHOWN_MODELS;
        const badge = t.badge ? (t.badge.kind === "one_phase" ? copy.home.makeBadge.one_phase : copy.home.makeBadge.above_11(kw(t.badge.ac_max_w, locale))) : null;
        return (
          <li key={t.slug}>
            <Link
              href={makePath(locale, t.slug)}
              className="group flex h-full flex-col rounded-card border-hair border-line bg-card px-3 py-3 no-underline transition-colors hover:border-accent sm:px-4"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[16px] font-semibold text-ink group-hover:text-accent">{t.name}</span>
                <span className="tnum shrink-0 text-[13px] text-ink3">{t.count}</span>
              </span>
              <span className="mt-1 block truncate text-[14px] text-ink2">
                {t.models.slice(0, SHOWN_MODELS).map((m, i) => (
                  <span key={m} className={i >= SHOWN_MOBILE ? "hidden sm:inline" : undefined}>
                    {i > 0 ? " · " : ""}
                    {m}
                  </span>
                ))}
                {moreMobile > 0 && <span className="text-ink3 sm:hidden"> {copy.home.moreModels(moreMobile)}</span>}
                {moreDesktop > 0 && <span className="hidden text-ink3 sm:inline"> {copy.home.moreModels(moreDesktop)}</span>}
              </span>
              <span className="mt-auto flex items-center justify-between gap-2 pt-2">
                <span className="tnum whitespace-nowrap text-[13px] text-ink3">{copy.home.makeTileRange(from, to, from === to)}</span>
                {badge && <span className="whitespace-nowrap rounded-btn bg-warnSoft px-1.5 py-0.5 text-[12px] font-medium text-warn">{badge}</span>}
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
  );
}
