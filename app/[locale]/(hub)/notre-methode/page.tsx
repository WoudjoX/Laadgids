import type { Metadata } from "next";
import { methodMetadata, methodStaticParams, renderMethod } from "@/lib/pages/methodRoute";

const SLUG = "notre-methode";

export const revalidate = 86400;

export function generateStaticParams() {
  return methodStaticParams(SLUG);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return methodMetadata(SLUG, (await params).locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return renderMethod(SLUG, (await params).locale);
}
