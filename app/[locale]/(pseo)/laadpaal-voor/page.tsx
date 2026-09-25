import type { Metadata } from "next";
import { chargerIndexMetadata, chargerIndexStaticParams, renderChargerIndex } from "@/lib/pages/chargerIndexRoute";

const SECTION = "laadpaal-voor";

export const revalidate = 86400;

export function generateStaticParams() {
  return chargerIndexStaticParams(SECTION);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return chargerIndexMetadata(SECTION, (await params).locale);
}

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  return renderChargerIndex(SECTION, (await params).locale, (await searchParams).q);
}
