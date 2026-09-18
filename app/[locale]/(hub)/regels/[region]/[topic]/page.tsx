import type { Metadata } from "next";
import { renderRule, ruleMetadata, ruleStaticParams, type RuleParams } from "@/lib/pages/ruleRoute";

const SECTION = "regels";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams(): RuleParams[] {
  return ruleStaticParams(SECTION);
}

export async function generateMetadata({ params }: { params: Promise<RuleParams> }): Promise<Metadata> {
  return ruleMetadata(SECTION, await params);
}

export default async function Page({ params }: { params: Promise<RuleParams> }) {
  return renderRule(SECTION, await params);
}
