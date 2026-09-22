// GET /{locale}/go?slug=... → 302 naar de modelpagina. Maakt de keuzelijst op de home werkend zonder JavaScript.
import { redirect } from "next/navigation";
import { LOCALE_CONFIG, chargerPath, localeFromSegment } from "@/lib/copy";
import { loadPages } from "@/lib/db/cached";

export async function GET(req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) redirect("/nl-be");
  const slug = new URL(req.url).searchParams.get("slug")?.trim() ?? "";
  const home = `/${LOCALE_CONFIG[locale].segment}`;
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) redirect(home);
  const path = chargerPath(locale, slug);
  const pages = await loadPages(locale, "charger_for_model");
  redirect(pages.some((p) => p.path === path && p.status !== "draft") ? path : home);
}
