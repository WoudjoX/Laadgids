import type { Metadata } from "next";
import { chargerMetadata, chargerStaticParams, renderCharger, type ChargerParams } from "@/lib/pages/chargerRoute";

const SECTION = "laadpaal-voor";

// ISR: dagelijks; on-demand via /api/revalidate (CLAUDE.md §7).
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<ChargerParams[]> {
  return chargerStaticParams(SECTION);
}

export async function generateMetadata({ params }: { params: Promise<ChargerParams> }): Promise<Metadata> {
  return chargerMetadata(SECTION, await params);
}

export default async function Page({ params }: { params: Promise<ChargerParams> }) {
  return renderCharger(SECTION, await params);
}
