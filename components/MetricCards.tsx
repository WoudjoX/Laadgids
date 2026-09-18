export interface Metric {
  label: string;
  value: string;
  unit?: string;
}

/** Drie kaarten naast elkaar, ook op mobiel (DESIGN.md §3). */
export function MetricCards({ items }: { items: Metric[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((m) => (
        <div key={m.label} className="rounded-card border-hair border-line bg-card p-4">
          <p className="text-[13px] leading-snug text-ink2">{m.label}</p>
          <p className="tnum mt-1 text-[28px] font-medium leading-none text-ink">
            {m.value}
            {m.unit && <span className="ml-1 text-[14px] font-normal text-ink2">{m.unit}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}
