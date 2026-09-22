import { PeakChart } from "@/components/viz/PeakChart";
import type { CapacityImpactResult } from "@/lib/calc";
import type { ChargerPageVars, Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { euro, kw } from "@/lib/format";

interface Props {
  capacity: CapacityImpactResult;
  vars: ChargerPageVars;
  copy: Copy;
  locale: Locale;
}

/** warnSoft/warn, piekgrafiek per lader, twee bedragen naast elkaar, geen icoon (DESIGN.md §3). */
export function PeakBlock({ capacity, vars, copy, locale }: Props) {
  const p = copy.charger.peak;
  return (
    <section className="rounded-card bg-warnSoft px-5 py-5 text-warn">
      <h2 className="text-warn">{p.heading}</h2>
      <p className="mt-2 max-w-prose text-[15px]">{p.intro(vars)}</p>
      {p.tariffLine(vars) && <p className="tnum mt-2 max-w-prose text-[14px]">{p.tariffLine(vars)}</p>}
      <div className="mt-5 space-y-6">
        {capacity.scenarios.map((s) => (
          <div key={s.charger_w}>
            <p className="text-[13px] font-semibold">{p.scenario(kw(s.charger_w, locale))}</p>
            <div className="mt-2">
              <PeakChart s={s} minKw={capacity.min_kw} copy={p} locale={locale} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-card bg-card/60 p-3">
                <p className="text-[13px]">{p.without}</p>
                <p className="tnum text-[22px] font-medium leading-tight">{euro(s.delta_cents, locale, { decimals: 0 })}</p>
                <p className="text-[12px]">{p.perYear}</p>
              </div>
              <div className="rounded-card bg-card/60 p-3">
                <p className="text-[13px]">{p.with}</p>
                <p className="tnum text-[22px] font-medium leading-tight">{euro(s.delta_lb_cents, locale, { decimals: 0 })}</p>
                <p className="text-[12px]">{p.perYear}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px]">{p.verify}</p>
    </section>
  );
}
