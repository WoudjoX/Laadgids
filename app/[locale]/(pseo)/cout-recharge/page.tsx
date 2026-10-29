import type { Metadata } from "next";
import { costIndexMetadata, costIndexStaticParams, renderCostIndex } from "@/lib/pages/costIndexRoute";

const SECTION = "cout-recharge";

export const revalidate = 86400;

export function generateStaticParams() {
  return costIndexStaticParams(SECTION);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return costIndexMetadata(SECTION, (await params).locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return renderCostIndex(SECTION, (await params).locale);
}
