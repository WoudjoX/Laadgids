import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { ModelCardItem } from "@/components/ModelCards";
import { LOCALE_CONFIG, chargerPath, comparePath, type Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import type { CompareResult } from "@/lib/pages/compare";

interface Props {
  copy: Copy;
  locale: Locale;
  options: ModelCardItem[];
  a: string | null;
  b: string | null;
  result: CompareResult | null;
  sameError: boolean;
}

function label(o: ModelCardItem): string {
  return `${o.v.make.name} ${o.v.vehicle.model} ${o.v.trim}${o.v.model_year ? ` (${o.v.model_year})` : ""}`;
}

/** Vergelijkingspagina: formulier zonder JS (GET), daarna een tabel met drie kolommen. */
export function ComparePage({ copy, locale, options, a, b, result, sameError }: Props) {
  const c = copy.compare;
  const seg = LOCALE_CONFIG[locale].segment;
  const selectCls = "h-12 w-full rounded-btn border border-line2 bg-card px-3 text-[16px] text-ink";
  const va = result?.a.vars;
  const vb = result?.b.vars;
  return (
    <div className="mx-auto max-w-content px-4 pb-16 pt-6">
      <Breadcrumb items={[{ label: copy.site.home, href: `/${seg}` }, { label: c.title }]} />
      <h1 className="mt-4 max-w-prose">{c.title}</h1>
      <p className="mt-3 max-w-prose text-ink2">{c.intro}</p>

      <form method="get" action={comparePath(locale)} className="mt-6 grid grid-cols-1 gap-3 rounded-card border-hair border-line bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="a" className="mb-1 block text-[14px] text-ink2">
            {c.pickA}
          </label>
          <select id="a" name="a" defaultValue={a ?? ""} className={selectCls} required>
            <option value="" disabled>
              –
            </option>
            {options.map((o) => (
              <option key={o.v.slug} value={o.v.slug}>
                {label(o)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="b" className="mb-1 block text-[14px] text-ink2">
            {c.pickB}
          </label>
          <select id="b" name="b" defaultValue={b ?? ""} className={selectCls} required>
            <option value="" disabled>
              –
            </option>
            {options.map((o) => (
              <option key={o.v.slug} value={o.v.slug}>
                {label(o)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-12 rounded-btn border border-ink px-5 text-[15px] font-semibold text-ink hover:bg-paper">
          {c.submit}
        </button>
      </form>
      {sameError && <p className="mt-2 text-[13px] text-bad">{c.same}</p>}

      {result && va && vb && (
        <div className="mt-8">
          <div className="overflow-x-auto rounded-card border-hair border-line bg-card">
            <table className="w-full table-fixed border-collapse text-[15px]">
              <colgroup>
                <col className="w-[40%]" />
                <col className="w-[30%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead>
                <tr className="bg-paper text-left text-[13px] text-ink2">
                  <th className="px-4 py-2 font-normal">{c.colModel}</th>
                  <th className="px-4 py-2 font-semibold text-ink">
                    <Link href={chargerPath(locale, a!)}>{va.fullName}</Link>
                  </th>
                  <th className="px-4 py-2 font-semibold text-ink">
                    <Link href={chargerPath(locale, b!)}>{vb.fullName}</Link>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.label} className="border-t-hair border-line">
                    <td className="px-4 py-3 text-ink2">{r.label}</td>
                    <td className={`tnum px-4 py-3 ${r.better === "a" ? "font-semibold text-ok" : "text-ink"}`}>{r.a}</td>
                    <td className={`tnum px-4 py-3 ${r.better === "b" ? "font-semibold text-ok" : "text-ink"}`}>{r.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 max-w-prose text-[13px] text-ink3">{c.note}</p>
        </div>
      )}
    </div>
  );
}
