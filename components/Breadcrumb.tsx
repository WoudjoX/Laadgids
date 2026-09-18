import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" className="text-[13px] text-ink2">
      <ol className="flex flex-wrap gap-x-2">
        {items.map((c, i) => (
          <li key={i} className="flex gap-x-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
