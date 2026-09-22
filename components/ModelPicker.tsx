import type { ModelCardItem } from "@/components/ModelCards";
import { LOCALE_CONFIG, type Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";

interface Props {
  items: ModelCardItem[];
  copy: Copy;
  locale: Locale;
}

function label(o: ModelCardItem): string {
  return `${o.v.make.name} ${o.v.vehicle.model} ${o.v.trim}${o.v.model_year ? ` (${o.v.model_year})` : ""}`;
}

/** Het antwoord op de eerste vraag van de bezoeker: één select, één knop, geen JavaScript (GET naar /go). */
export function ModelPicker({ items, copy, locale }: Props) {
  const seg = LOCALE_CONFIG[locale].segment;
  return (
    <form method="get" action={`/${seg}/go`} className="rounded-card border-hair border-line bg-card p-4">
      <label htmlFor="pick-slug" className="mb-1 block text-[14px] text-ink2">
        {copy.home.pickLabel}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select id="pick-slug" name="slug" required defaultValue="" className="h-12 w-full rounded-btn border border-line2 bg-card px-3 text-[16px] text-ink">
          <option value="" disabled>
            –
          </option>
          {items.map((o) => (
            <option key={o.v.slug} value={o.v.slug}>
              {label(o)}
            </option>
          ))}
        </select>
        <button type="submit" className="h-12 shrink-0 rounded-btn bg-accent px-5 text-[16px] font-semibold text-card">
          {copy.home.pickButton}
        </button>
      </div>
    </form>
  );
}
