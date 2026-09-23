// Minimale markdown-renderer voor de regelpagina's: koppen, alinea's, lijsten, tabellen, vet, cursief, links.
// Bewust geen dependency: de kennisbank gebruikt alleen deze constructies. Alles server-side, geen HTML-injectie.
import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  md: string;
  /** Vertaalt interne links ("/regels/slug") naar echte paden. Externe links blijven zoals ze zijn. */
  resolveHref?: (href: string) => string;
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string, resolve: (h: string) => string, keyBase: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>;
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (m) {
      const href = resolve(m[2]!);
      const external = /^https?:\/\//.test(href);
      return external ? (
        <a key={key} href={href} rel="noopener" target="_blank">
          {m[1]}
        </a>
      ) : (
        <Link key={key} href={href}>
          {m[1]}
        </Link>
      );
    }
    return part;
  });
}

type Block =
  | { t: "h2" | "h3" | "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "table"; header: string[]; rows: string[][] };

function parse(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const out: Block[] = [];
  let i = 0;
  const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  while (i < lines.length) {
    const s = lines[i]!.trim();
    if (!s) {
      i++;
      continue;
    }
    if (s.startsWith("### ")) out.push({ t: "h3", text: s.slice(4) });
    else if (s.startsWith("## ")) out.push({ t: "h2", text: s.slice(3) });
    else if (s.startsWith("# ")) out.push({ t: "h2", text: s.slice(2) });
    else if (/^[-*] /.test(s)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i]!.trim())) items.push(lines[i++]!.trim().slice(2));
      out.push({ t: "ul", items });
      continue;
    } else if (/^\d+\. /.test(s)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i]!.trim())) items.push(lines[i++]!.trim().replace(/^\d+\. /, ""));
      out.push({ t: "ol", items });
      continue;
    } else if (s.startsWith("|")) {
      const header = cells(s);
      i++;
      if (i < lines.length && /^\|?\s*:?-+/.test(lines[i]!.trim())) i++; // scheidingsregel
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("|")) rows.push(cells(lines[i++]!));
      out.push({ t: "table", header, rows });
      continue;
    } else {
      const para: string[] = [s];
      i++;
      while (i < lines.length && lines[i]!.trim() && !/^(#|[-*] |\d+\. |\|)/.test(lines[i]!.trim())) para.push(lines[i++]!.trim());
      out.push({ t: "p", text: para.join(" ") });
      continue;
    }
    i++;
  }
  return out;
}

export function Markdown({ md, resolveHref = (h) => h }: Props) {
  const blocks = parse(md);
  return (
    <div className="max-w-prose space-y-4 text-ink [&_h2]:mt-10 [&_h3]:mt-6">
      {blocks.map((b, i) => {
        const k = `b${i}`;
        switch (b.t) {
          case "h2":
            return <h2 key={k}>{inline(b.text, resolveHref, k)}</h2>;
          case "h3":
            return <h3 key={k}>{inline(b.text, resolveHref, k)}</h3>;
          case "p":
            return <p key={k}>{inline(b.text, resolveHref, k)}</p>;
          case "ul":
            return (
              <ul key={k} className="list-disc space-y-1 pl-5">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, resolveHref, `${k}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={k} className="list-decimal space-y-1 pl-5">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, resolveHref, `${k}-${j}`)}</li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={k} className="overflow-x-auto rounded-card border-hair border-line bg-card">
                <table className="tnum w-full border-collapse text-[15px]">
                  <thead>
                    <tr className="bg-paper text-left text-[13px] text-ink2">
                      {b.header.map((h, j) => (
                        <th key={j} className="px-4 py-2 font-normal">
                          {inline(h, resolveHref, `${k}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-t-hair border-line">
                        {r.map((c, m) => (
                          <td key={m} className="px-4 py-2 align-top">
                            {inline(c, resolveHref, `${k}-${j}-${m}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
