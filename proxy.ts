// Proxy (Next 16, Node-runtime): locale-validatie en X-Robots-Tag voor noindex-pagina's (CLAUDE.md §7).
// Geen Accept-Language-redirects.
import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, LOCALE_CONFIG, getCopy } from "@/lib/copy";
import { METHOD_REVIEWED } from "@/lib/content/method";
import { STATIC_PAGES } from "@/lib/content/static";
import { getRepo } from "@/lib/db";

const SEGMENTS = new Set(LOCALES.map((l) => LOCALE_CONFIG[l].segment));
// Vaste noindex-pagina's buiten `pages` (privacy, vergelijken, methode zolang niet nagekeken): ook daar de header.
const STATIC_NOINDEX = new Set(
  LOCALES.flatMap((l) => {
    const seg = LOCALE_CONFIG[l].segment;
    const method = getCopy(l).method.slug && !METHOD_REVIEWED[l] ? [`/${seg}/${getCopy(l).method.slug}`] : [];
    return [...Object.values(STATIC_PAGES[l]).filter((p) => p.noindex).map((p) => `/${seg}/${p.slug}`), `/${seg}/${getCopy(l).compare.sectionSlug}`, ...method];
  }),
);
const PSEO_SECTIONS = new Set(["laadpaal-voor", "borne-pour", "laadkosten", "cout-recharge", "vaa", "atn", "bijtelling", "tweedehands", "merk", "marque"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, seg, section] = pathname.split("/");
  if (!seg || !SEGMENTS.has(seg)) return NextResponse.next();

  const res = NextResponse.next();
  if (STATIC_NOINDEX.has(pathname)) res.headers.set("X-Robots-Tag", "noindex, follow");
  if (section && PSEO_SECTIONS.has(section)) {
    try {
      const page = await (await getRepo()).getPageByPath(pathname);
      if (page?.status === "noindex") res.headers.set("X-Robots-Tag", "noindex, follow");
    } catch {
      // Geen header bij een DB-fout; de <meta robots> in de pagina blijft leidend.
    }
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap).*)"],
};
