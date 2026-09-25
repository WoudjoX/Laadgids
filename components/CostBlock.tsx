import type { TariffComparison } from "@/lib/calc";
import type { ChargerPageVars, Copy } from "@/lib/copy";
import type { Locale, TariffRow } from "@/lib/db/types";
import { eventAttrs } from "@/lib/analytics";
import { euro, euroPer100Km } from "@/lib/format";

interface Props {
  comparison: TariffComparison | null;
  tariffs: TariffRow[];
  vars: ChargerPageVars;
  copy: Copy;
  locale: Locale;
  ctaHref: string | null;
}

/** Kaart met één regel per tarief plus kostenbalk; goedkoopste in accent (DESIGN.md §3). */
export function CostBlock({ comparison, tariffs, vars, copy, locale, ctaHref }: Props) {
  const c = copy.charger.cost;
  const lang = locale.startsWith("fr") ? "fr" : "nl";
  if (!comparison) {
    return <p className="max-w-prose text-[15px] text-ink2">{c.unavailable}</p>;
  }
  const saving = c.saving(vars);
  const max = Math.max(...comparison.rows.map((r) => r.full_charge_cents));
  return (
    <div>
      <div className="rounded-card border-hair border-line bg-card px-5 py-2">
        {comparison.rows.map((r) => {
          const t = tariffs.find((x) => x.slug === r.tariff_slug);
          const cheapest = r.tariff_slug === comparison.cheapest.tariff_slug;
          const pct = Math.round((r.full_charge_cents / max) * 100);
          return (
            <div key={r.tariff_slug} className={`border-b-hair border-line py-3 last:border-b-0 ${cheapest ? "font-semibold text-accent" : "text-ink"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-[15px]">{t?.label[lang] ?? r.tariff_slug}</span>
                <span className="tnum whitespace-nowrap text-[15px]">
                  {euro(r.full_charge_cents, locale, { decimals: 2 })} <span className="font-normal text-ink2">{c.perFull}</span>
                  <span className="mx-2 font-normal text-ink3" aria-hidden="true">
                    ·
                  </span>
                  {euroPer100Km(r.cents_per_100km, locale)} <span className="font-normal text-ink2">{c.perKm}</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-sm bg-paper" aria-hidden="true">
                <div className={`h-1.5 rounded-sm ${cheapest ? "bg-accent" : "bg-line2"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {saving && <p className="mt-3 max-w-prose text-[14px] text-ink2">{saving}</p>}
      <p className="mt-1 max-w-prose text-[13px] text-ink3">{c.perYear(vars)}</p>
      {ctaHref && (
      <a
        href={ctaHref}
        {...eventAttrs("energy_cta_click", "mt-4 inline-block rounded-btn border border-ink px-4 py-2 text-[15px] font-semibold text-ink no-underline hover:bg-card")}
      >
        {c.cta} →
      </a>
      )}
    </div>
  );
}
