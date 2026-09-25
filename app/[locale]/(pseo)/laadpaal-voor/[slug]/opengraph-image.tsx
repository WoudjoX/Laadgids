import { OG_SIZE, modelOgImage } from "@/lib/pages/ogModel";

export const alt = "Laadgids";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const p = await params;
  return modelOgImage("laadpaal-voor", p.locale, p.slug);
}
