import type { Locale } from "@/lib/db/types";
import { dateLong } from "@/lib/format";
import type { SourceItem } from "@/lib/pages/charger";

interface Props {
  heading: string;
  checkedLabel: string;
  sources: SourceItem[];
  locale: Locale;
}

/** Vertrouwenselement, 13px ink2, niet onzichtbaar klein (DESIGN.md §3). */
export function SourcesBlock({ heading, checkedLabel, sources, locale }: Props) {
  return (
    <section className="border-t-hair border-line pt-6 text-[13px] text-ink2">
      <h2 className="text-[15px]">{heading}</h2>
      <ul className="mt-2 space-y-1">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} rel="noopener" target="_blank">
              {s.title}
            </a>
            , {checkedLabel} {dateLong(s.checked, locale)}
          </li>
        ))}
      </ul>
    </section>
  );
}
