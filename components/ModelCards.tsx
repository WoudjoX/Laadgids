import Link from "next/link";
import { advice } from "@/lib/calc";
import type { Copy } from "@/lib/copy";
import type { Locale, VersionFull } from "@/lib/db/types";
import { kw, kwh } from "@/lib/format";

export interface ModelCardItem {
  path: string;
  v: VersionFull;
}

/** Modelkaarten met de drie cijfers die tellen: AC-maximum, batterij, aanbevolen aansluiting. */
export function ModelCards({ items, copy, locale }: { items: ModelCardItem[]; copy: Copy; locale: Locale }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map(({ path, v }) => {
        const a = advice(v, { region: null, capacity_rule: null });
        return (
          <li key={path}>
            <Link href={path} className="block rounded-card border-hair border-line bg-card p-4 no-underline hover:border-line2">
              <p className="text-[13px] text-ink2">
                {v.make.name}
                {v.model_year ? ` · ${v.model_year}` : ""}
              </p>
              <p className="text-[18px] font-semibold text-ink">
                {v.vehicle.model} {v.trim}
              </p>
              <dl className="tnum mt-3 grid grid-cols-[1fr_1fr_1.6fr] gap-2 text-[13px] text-ink2">
                <div>
                  <dt>{copy.site.cardAc}</dt>
                  <dd className="whitespace-nowrap text-[16px] font-medium text-ink">{kw(v.ac_max_w, locale)}</dd>
                </div>
                <div>
                  <dt>{copy.site.cardBattery}</dt>
                  <dd className="whitespace-nowrap text-[16px] font-medium text-ink">{kwh(v.battery_net_wh, locale)}</dd>
                </div>
                <div>
                  <dt>{copy.site.cardRecommended}</dt>
                  <dd className="whitespace-nowrap text-[16px] font-medium text-ok">{copy.connections[a.recommended_connection]}</dd>
                </div>
              </dl>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
