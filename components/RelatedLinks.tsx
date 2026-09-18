import Link from "next/link";
import type { Copy } from "@/lib/copy";
import type { RelatedLink } from "@/lib/seo/related";

export function RelatedLinks({ links, copy }: { links: RelatedLink[]; copy: Copy }) {
  if (links.length === 0) return null;
  const r = copy.charger.related;
  const groups: { kind: RelatedLink["kind"][]; label: string }[] = [
    { kind: ["sister", "same_make"], label: r.sisters },
    { kind: ["cost"], label: r.cost },
    { kind: ["rule"], label: r.rules },
  ];
  return (
    <section>
      <h2>{r.heading}</h2>
      {groups.map((g) => {
        const items = links.filter((l) => g.kind.includes(l.kind));
        if (items.length === 0) return null;
        return (
          <div key={g.label} className="mt-4">
            <h3 className="text-[15px] text-ink2">{g.label}</h3>
            <ul className="mt-1 space-y-1">
              {items.map((l) => (
                <li key={l.path}>
                  <Link href={l.path}>{l.kind === "rule" ? (copy.rulesPages[l.label] ?? l.label) : l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
