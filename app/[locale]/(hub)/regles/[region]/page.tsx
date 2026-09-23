import type { Metadata } from "next";
import { renderRuleIndex, ruleIndexMetadata, ruleIndexStaticParams } from "@/lib/pages/ruleIndexRoute";

const SECTION = "regles";
type P = { locale: string; region: string };

export const revalidate = 86400;

export function generateStaticParams() {
  return ruleIndexStaticParams(SECTION);
}

export async function generateMetadata({ params }: { params: Promise<P> }): Promise<Metadata> {
  const p = await params;
  return ruleIndexMetadata(SECTION, p.locale, p.region);
}

export default async function Page({ params }: { params: Promise<P> }) {
  const p = await params;
  return renderRuleIndex(SECTION, p.locale, p.region);
}
