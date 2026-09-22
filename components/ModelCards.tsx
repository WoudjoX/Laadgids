import Link from "next/link";
import { advice } from "@/lib/calc";
import type { Copy } from "@/lib/copy";
import type { Locale, VersionFull } from "@/lib/db/types";
import { duration, kw } from "@/lib/format";

export interface ModelCardItem {
  path: string;
  v: VersionFull;
}

/** Laadtijd 20 naar 80 % op de aanbevolen aansluiting, in seconden. Zelfde berekening als de modelpagina. */
export function recommendedSeconds(v: VersionFull): number {
  const a = advice(v, { region: null, capacity_rule: null });
  return a.table.find((r) => r.connection === a.recommended_connection)!.seconds;
}

/** Groepen op AC-maximum, aflopend: 22 kW, 11 kW, 7,4 kW. Lege groepen vallen weg. */
export function groupByPower(items: ModelCardItem[]): { ac_max_w: number; items: ModelCardItem[] }[] {
  const map = new Map<number, ModelCardItem[]>();
  for (const it of items) map.set(it.v.ac_max_w, [...(map.get(it.v.ac_max_w) ?? []), it]);
  return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([ac_max_w, items]) => ({ ac_max_w, items }));
}

interface Props {
  items: ModelCardItem[];
  copy: Copy;
  locale: Locale;
  /** Langste laadtijd in de hele lijst, zodat balkjes over groepen heen vergelijkbaar blijven. */
  maxSeconds?: number;
}

/** Modelkaarten: AC-maximum, laadtijd met balk, aanbevolen aansluiting. De laadtijd is het cijfer dat verschilt. */
export function ModelCards({ items, copy, locale, maxSeconds }: Props) {
  const max = maxSeconds ?? Math.max(...items.map(({ v }) => recommendedSeconds(v)));
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map(({ path, v }) => {
        const a = advice(v, { region: null, capacity_rule: null });
        const secs = a.table.find((r) => r.connection === a.recommended_connection)!.seconds;
        const pct = Math.max(6, Math.round((secs / max) * 100));
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
              <dl className="tnum mt-3 grid grid-cols-[1fr_1.2fr_1.6fr] gap-2 text-[13px] text-ink2">
                <div>
                  <dt>{copy.site.cardAc}</dt>
                  <dd className="whitespace-nowrap text-[16px] font-medium text-ink">{kw(v.ac_max_w, locale)}</dd>
                </div>
                <div>
                  <dt>{copy.site.cardTime}</dt>
                  <dd className="whitespace-nowrap text-[16px] font-medium text-ink">{duration(secs, locale)}</dd>
                </div>
                <div>
                  <dt>{copy.site.cardRecommended}</dt>
                  <dd className="whitespace-nowrap text-[16px] font-medium text-ok">{copy.connections[a.recommended_connection]}</dd>
                </div>
              </dl>
              <div className="mt-3 h-1.5 w-full rounded-sm bg-paper" aria-hidden="true">
                <div className="h-1.5 rounded-sm bg-ink2" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Kaarten in groepen per AC-vermogen, met een kop per groep. */
export function GroupedModelCards({ items, copy, locale }: { items: ModelCardItem[]; copy: Copy; locale: Locale }) {
  const max = Math.max(...items.map(({ v }) => recommendedSeconds(v)));
  return (
    <div className="space-y-10">
      {groupByPower(items).map((g) => (
        <section key={g.ac_max_w}>
          <h2 className="text-[18px]">
            {copy.home.group(kw(g.ac_max_w, locale))} <span className="tnum font-normal text-ink3">· {g.items.length}</span>
          </h2>
          <div className="mt-3">
            <ModelCards items={g.items} copy={copy} locale={locale} maxSeconds={max} />
          </div>
        </section>
      ))}
    </div>
  );
}
