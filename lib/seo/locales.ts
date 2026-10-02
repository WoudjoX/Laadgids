// Locales met minstens één pagina op index. Een locale zonder zulke pagina's (nl-NL tot fase 3) krijgt geen hreflang
// en haar startpagina, sectie-index en statische pagina's staan op noindex.
import { LOCALES } from "@/lib/copy";
import { loadPages } from "@/lib/db/cached";
import type { Locale } from "@/lib/db/types";

export async function indexableLocales(): Promise<Locale[]> {
  const out: Locale[] = [];
  for (const l of LOCALES) {
    if ((await loadPages(l)).some((p) => p.status === "index")) out.push(l);
  }
  return out;
}
