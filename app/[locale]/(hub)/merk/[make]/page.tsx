import type { Metadata } from "next";
import { makeMetadata, makeStaticParams, renderMake, type MakeParams } from "@/lib/pages/makeRoute";

const SECTION = "merk";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<MakeParams[]> {
  return makeStaticParams(SECTION);
}

export async function generateMetadata({ params }: { params: Promise<MakeParams> }): Promise<Metadata> {
  return makeMetadata(SECTION, await params);
}

export default async function Page({ params }: { params: Promise<MakeParams> }) {
  return renderMake(SECTION, await params);
}
