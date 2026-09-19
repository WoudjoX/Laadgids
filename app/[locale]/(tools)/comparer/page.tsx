import type { Metadata } from "next";
import { compareMetadata, compareStaticParams, renderCompare, type CompareSearch } from "@/lib/pages/compareRoute";

const SECTION = "comparer";

export function generateStaticParams() {
  return compareStaticParams(SECTION);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return compareMetadata(SECTION, (await params).locale);
}

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<CompareSearch> }) {
  return renderCompare(SECTION, (await params).locale, await searchParams);
}
