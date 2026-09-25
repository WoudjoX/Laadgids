import type { ModelCardItem } from "@/components/ModelCards";
import { LOCALE_CONFIG, type Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";

interface Props {
  items: ModelCardItem[];
  copy: Copy;
  locale: Locale;
  /** Eerder ingetypte term, om terug te tonen als er geen unieke match was. */
  query?: string;
}

export function pickLabel(o: ModelCardItem): string {
  return `${o.v.make.name} ${o.v.vehicle.model} ${o.v.trim}${o.v.model_year ? ` (${o.v.model_year})` : ""}`;
}

/**
 * Typ-veld met automatische aanvulling (datalist, standaard browserfunctie, geen script). Werkt bij 200 modellen
 * waar een keuzelijst onleesbaar wordt. Zonder unieke match toont /go de kandidaten op de sectiepagina.
 */
export function ModelPicker({ items, copy, locale, query }: Props) {
  const seg = LOCALE_CONFIG[locale].segment;
  return (
    <form method="get" action={`/${seg}/go`} className="rounded-card border-hair border-line bg-card p-4">
      <label htmlFor="pick-q" className="mb-1 block text-[14px] text-ink2">
        {copy.home.pickLabel}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="pick-q"
          name="q"
          list="pick-models"
          required
          autoComplete="off"
          defaultValue={query ?? ""}
          placeholder={copy.home.pickPlaceholder}
          className="h-12 w-full rounded-btn border border-line2 bg-card px-3 text-[16px] text-ink placeholder:text-ink3"
        />
        <datalist id="pick-models">
          {items.map((o) => (
            <option key={o.v.slug} value={pickLabel(o)} />
          ))}
        </datalist>
        <button type="submit" className="h-12 shrink-0 rounded-btn bg-accent px-5 text-[16px] font-semibold text-card">
          {copy.home.pickButton}
        </button>
      </div>
      <p className="mt-2 text-[13px] text-ink3">{copy.home.pickHelp}</p>
    </form>
  );
}
