// Piekgrafiek capaciteitstarief: drie horizontale balken (zonder lader, lader erbij, met load balancing).
import type { CapacityScenario } from "@/lib/calc/capacityImpact";
import type { Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { kw } from "@/lib/format";

interface Props {
  s: CapacityScenario;
  minKw: number;
  copy: Copy["charger"]["peak"];
  locale: Locale;
}

const W = 640;
const LABEL_W = 170;
const BAR_H = 18;
const ROW_H = 34;

export function PeakChart({ s, minKw, copy, locale }: Props) {
  const rows = [
    { label: copy.chartRows.without, base: s.peak_without_w, charger: 0 },
    { label: copy.chartRows.with, base: s.peak_without_w, charger: s.peak_with_w - s.peak_without_w },
    { label: copy.chartRows.withLb, base: Math.min(s.peak_without_w, s.peak_with_lb_w), charger: Math.max(0, s.peak_with_lb_w - s.peak_without_w) },
  ];
  const maxW = Math.max(...rows.map((r) => r.base + r.charger));
  const scale = (W - LABEL_W - 70) / maxW;
  const minX = LABEL_W + minKw * 1000 * scale;
  const H = rows.length * ROW_H + 22;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={copy.heading} className="h-auto w-full font-sans">
      {rows.map((r, i) => {
        const y = i * ROW_H + 6;
        const bw = r.base * scale;
        const cw = r.charger * scale;
        return (
          <g key={r.label}>
            <text x={0} y={y + BAR_H - 4} className="fill-warn text-[13px]">
              {r.label}
            </text>
            <rect x={LABEL_W} y={y} width={bw} height={BAR_H} className="fill-warn" opacity={0.45} />
            {cw > 0 && <rect x={LABEL_W + bw} y={y} width={cw} height={BAR_H} className="fill-warn" />}
            <text x={LABEL_W + bw + cw + 8} y={y + BAR_H - 4} className="tnum fill-warn text-[13px] font-semibold">
              {kw(r.base + r.charger, locale)}
            </text>
          </g>
        );
      })}
      <line x1={minX} y1={0} x2={minX} y2={rows.length * ROW_H + 4} className="stroke-warn" strokeDasharray="3 3" />
      <text x={minX + 4} y={H - 4} className="fill-warn text-[11px]">
        {copy.chartMin}
      </text>
    </svg>
  );
}
