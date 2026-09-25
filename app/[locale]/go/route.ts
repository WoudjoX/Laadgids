// GET /{locale}/go?q=... (of ?slug=...) → 302 naar de modelpagina. Zonder unieke match: naar de sectiepagina met ?q= voor de kandidaten.
import { redirect } from "next/navigation";
import { pickLabel } from "@/components/ModelPicker";
import { LOCALE_CONFIG, chargerPath, getCopy, localeFromSegment } from "@/lib/copy";
import { loadPages } from "@/lib/db/cached";
import { modelIndex } from "@/lib/pages/modelIndex";
import { resolvePick } from "@/lib/pages/pick";

export async function GET(req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) redirect("/nl-be");
  const url = new URL(req.url);
  const home = `/${LOCALE_CONFIG[locale].segment}`;
  const section = `${home}/${getCopy(locale).charger.sectionSlug}`;

  const slug = url.searchParams.get("slug")?.trim() ?? "";
  if (slug) {
    if (!/^[a-z0-9-]{3,80}$/.test(slug)) redirect(home);
    const pages = await loadPages(locale, "charger_for_model");
    const path = chargerPath(locale, slug);
    redirect(pages.some((p) => p.path === path && p.status !== "draft") ? path : home);
  }

  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!q) redirect(section);
  const items = await modelIndex(locale);
  const hit = resolvePick(q, items.map((i) => ({ slug: i.v.slug, label: pickLabel(i) })));
  redirect(hit ? chargerPath(locale, hit.slug) : `${section}?q=${encodeURIComponent(q)}`);
}
