/** Het belangrijkste element van de site (DESIGN.md §3): accentSoft, geen border, label in accent. */
export function AnswerBox({ label, text }: { label: string; text: string }) {
  return (
    <section className="rounded-card bg-accentSoft px-5 py-5 md:px-6" aria-label={label}>
      <p className="mb-2 text-[13px] font-semibold text-accent">{label}</p>
      <p className="max-w-prose text-[18px] leading-relaxed text-ink">{text}</p>
    </section>
  );
}
