import Link from "next/link";
import type { Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { kw } from "@/lib/format";
import type { ModelException } from "@/lib/pages/homeOverview";

/** Uitvoeringen waarvan het laadadvies afwijkt van de gewone 11 kW-driefasige auto, met de reden in één regel. */
export function ExceptionList({ items, copy, locale }: { items: ModelException[]; copy: Copy; locale: Locale }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-card border-hair border-line bg-card">
      <ul className="divide-y divide-line">
        {items.map(({ item, kind }) => (
          <li key={item.path}>
            <Link href={item.path} className="flex flex-col gap-0.5 px-4 py-3 no-underline hover:bg-paper sm:flex-row sm:items-baseline sm:gap-3">
              <span className="text-[15px] font-semibold text-ink sm:w-64 sm:shrink-0">
                {item.v.make.name} {item.v.vehicle.model} {item.v.trim}
              </span>
              <span className="text-[14px] text-ink2">{copy.home.exceptionReason[kind](kw(item.v.ac_max_w, locale))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
