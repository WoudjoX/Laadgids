import Link from "next/link";
import type { Copy } from "@/lib/copy";

/** Alleen BE: CREG-tarief en MID-meter, twee zinnen + link (CLAUDE.md §4.2). */
export function CompanyCarBlock({ copy, href }: { copy: Copy; href: string | null }) {
  const c = copy.charger.companyCar;
  if (!c.heading) return null;
  return (
    <section className="rounded-card border-hair border-line bg-card px-5 py-4">
      <h2 className="text-[18px]">{c.heading}</h2>
      <p className="mt-1 max-w-prose text-[15px] text-ink2">{c.text}</p>
      {href && (
        <p className="mt-2 text-[15px]">
          <Link href={href}>{c.link}</Link>
        </p>
      )}
    </section>
  );
}
