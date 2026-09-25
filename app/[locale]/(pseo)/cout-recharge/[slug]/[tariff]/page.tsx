import type { Metadata } from "next";
import { costMetadata, costStaticParams, renderCost, type CostParams } from "@/lib/pages/costRoute";

const SECTION = "cout-recharge";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<CostParams[]> {
  return costStaticParams(SECTION);
}

export async function generateMetadata({ params }: { params: Promise<CostParams> }): Promise<Metadata> {
  return costMetadata(SECTION, await params);
}

export default async function Page({ params }: { params: Promise<CostParams> }) {
  return renderCost(SECTION, await params);
}
