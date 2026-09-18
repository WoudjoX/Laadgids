import type { FaqItem } from "@/lib/copy";

/** Geen accordeon: H3 + antwoord, volledig zichtbaar (DESIGN.md §3). */
export function Faq({ heading, items }: { heading: string; items: FaqItem[] }) {
  return (
    <section>
      <h2>{heading}</h2>
      <div className="mt-4 space-y-6">
        {items.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p className="mt-1 max-w-prose text-ink2">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
