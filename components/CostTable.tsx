// Tabel met laadkost per 100 km en per jaar per uitvoering; gedeeld door de laadkostenindex en de merkpagina's.
import Link from "next/link";
import type { Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { euro, euroPer100Km } from "@/lib/format";
import type { CostRow } from "@/lib/pages/costRows";

export function CostTable({ rows, copy, locale, km }: { rows: CostRow[]; copy: Copy; locale: Locale; km: string }) {
  return (
    <div className="overflow-x-auto rounded-card border-hair border-line bg-card">
      <table className="tnum w-full border-collapse text-[15px]">
        <thead>
          <tr className="bg-paper text-left text-[13px] text-ink2">
            <th className="px-4 py-2 font-normal">{copy.cost.index.colModel}</th>
            <th className="px-4 py-2 text-right font-normal">{copy.cost.index.colPer100}</th>
            <th className="px-4 py-2 text-right font-normal">{copy.cost.index.colYear(km)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className="border-t-hair border-line">
              <td className="px-4 py-2.5">
                <Link href={r.path}>
                  {r.v.vehicle.model} {r.v.trim}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">{euroPer100Km(r.per100, locale)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right text-ink2">{euro(r.perYear, locale, { decimals: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
