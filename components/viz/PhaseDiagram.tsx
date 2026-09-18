// Lijndiagram 1-fasig vs 3-fasig (DESIGN.md §4): inline SVG, ink op paper, accent alleen voor de aanbevolen kant.
import type { Copy } from "@/lib/copy";

interface Props {
  acPhases: 1 | 3;
  recommendedPhases: 1 | 3;
  singleKw: string; // "7,4 kW"
  threeKw: string; // "11 kW" of "7,4 kW" bij een 1F-auto
  copy: Copy["charger"]["diagram"];
}

interface PanelProps {
  x: number;
  title: string;
  lines: 1 | 3;
  usedLines: 1 | 3;
  result: string;
  active: boolean;
  copy: Copy["charger"]["diagram"];
}

function Panel({ x, title, lines, usedLines, result, active, copy }: PanelProps) {
  const stroke = active ? "stroke-accent" : "stroke-ink3";
  const text = active ? "fill-ink" : "fill-ink3";
  const box = `${stroke} fill-card`;
  const ys = lines === 1 ? [110] : [96, 110, 124];
  return (
    <g transform={`translate(${x} 0)`}>
      <text x={0} y={22} className={`${text} text-[13px] font-semibold`}>
        {title}
      </text>
      {/* meter */}
      <rect x={0} y={80} width={64} height={60} rx={6} className={box} strokeWidth={1.5} />
      <text x={32} y={165} textAnchor="middle" className={`${text} text-[12px]`}>
        {copy.meter}
      </text>
      {/* charger */}
      <rect x={128} y={80} width={40} height={60} rx={6} className={box} strokeWidth={1.5} />
      <text x={148} y={165} textAnchor="middle" className={`${text} text-[12px]`}>
        {copy.charger}
      </text>
      {/* car */}
      <path d="M232 132 h72 v-22 l-14 -18 h-40 l-18 18 z" className={box} strokeWidth={1.5} />
      <circle cx={250} cy={134} r={6} className={box} strokeWidth={1.5} />
      <circle cx={288} cy={134} r={6} className={box} strokeWidth={1.5} />
      <text x={268} y={165} textAnchor="middle" className={`${text} text-[12px]`}>
        {copy.car}
      </text>
      {/* lijnen meter → laadpaal */}
      {ys.map((y, i) => (
        <line key={y} x1={64} y1={y} x2={128} y2={y} className={stroke} strokeWidth={i < usedLines ? 2 : 1.5} strokeDasharray={i < usedLines ? undefined : "3 3"} />
      ))}
      {/* laadpaal → auto: alleen gebruikte fasen */}
      {ys.slice(0, usedLines).map((y) => (
        <line key={`c${y}`} x1={168} y1={y} x2={232} y2={y} className={stroke} strokeWidth={2} />
      ))}
      <text x={148} y={62} textAnchor="middle" className={`${text} tnum text-[15px] font-semibold`}>
        {result}
      </text>
    </g>
  );
}

export function PhaseDiagram({ acPhases, recommendedPhases, singleKw, threeKw, copy }: Props) {
  return (
    <figure className="rounded-card border-hair border-line bg-card px-4 py-4">
      <svg viewBox="0 0 640 176" role="img" aria-label={copy.title} className="h-auto w-full font-sans">
        <Panel x={8} title={copy.single} lines={1} usedLines={1} result={singleKw} active={recommendedPhases === 1} copy={copy} />
        <Panel x={330} title={copy.three} lines={3} usedLines={acPhases} result={threeKw} active={recommendedPhases === 3} copy={copy} />
      </svg>
    </figure>
  );
}
