import type { ChargeTimeRow, ConnectionKey } from "@/lib/calc";
import type { Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { duration, kw } from "@/lib/format";

interface Props {
  rows: ChargeTimeRow[];
  recommended: ConnectionKey;
  copy: Copy;
  locale: Locale;
}

/** table-layout fixed, 40/25/35 %. Aanbevolen rij okSoft, geen-winst rijen ink3, tijdbalk per rij (DESIGN.md §3). */
export function ChargeTimeTable({ rows, recommended, copy, locale }: Props) {
  const t = copy.charger.table;
  const maxSeconds = Math.max(...rows.map((r) => r.seconds));
  return (
    <div className="overflow-x-auto rounded-card border-hair border-line bg-card">
      <table className="w-full table-fixed border-collapse text-[15px]">
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[20%]" />
          <col className="w-[40%]" />
        </colgroup>
        <thead>
          <tr className="bg-paper text-left text-[13px] text-ink2">
            <th className="px-4 py-2 font-normal">{t.colConnection}</th>
            <th className="px-4 py-2 font-normal">{t.colPower}</th>
            <th className="px-4 py-2 font-normal">{t.colTime}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isRec = r.connection === recommended;
            const cls = isRec ? "bg-okSoft text-ok" : r.no_gain ? "text-ink3" : "text-ink";
            const bar = isRec ? "bg-ok" : r.no_gain ? "bg-line2" : "bg-ink2";
            const pct = Math.max(4, Math.round((r.seconds / maxSeconds) * 100));
            return (
              <tr key={r.connection} className={`border-t-hair border-line ${cls}`}>
                <td className="px-4 py-3 align-top">
                  {copy.connections[r.connection]}
                  {isRec && <span className="ml-2 whitespace-nowrap rounded-btn bg-card px-2 py-0.5 text-[12px] text-ok">{t.recommended}</span>}
                </td>
                <td className="tnum px-4 py-3 align-top">{kw(r.effective_w, locale)}</td>
                <td className="px-4 py-3 align-top">
                  <span className="tnum">{duration(r.seconds, locale)}</span>
                  {r.no_gain && <span className="ml-2 text-[13px]">{t.noGain}</span>}
                  <div className="mt-1.5 h-1.5 w-full rounded-sm bg-paper" aria-hidden="true">
                    <div className={`h-1.5 rounded-sm ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
