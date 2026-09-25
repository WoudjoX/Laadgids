// Proxy (Next 16, Node-runtime): locale-validatie en X-Robots-Tag voor noindex-pagina's (CLAUDE.md §7).
// Geen Accept-Language-redirects.
import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, LOCALE_CONFIG } from "@/lib/copy";
import { getRepo } from "@/lib/db";

const SEGMENTS = new Set(LOCALES.map((l) => LOCALE_CONFIG[l].segment));
const PSEO_SECTIONS = new Set(["laadpaal-voor", "borne-pour", "laadkosten", "cout-recharge", "vaa", "atn", "bijtelling", "tweedehands", "merk", "marque"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, seg, section] = pathname.split("/");
  if (!seg || !SEGMENTS.has(seg)) return NextResponse.next();

  const res = NextResponse.next();
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
