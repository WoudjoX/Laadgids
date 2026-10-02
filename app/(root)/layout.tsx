import type { Metadata } from "next";
import "../globals.css";
import { RootDocument } from "@/components/RootDocument";
import { siteUrl } from "@/lib/seo/alternates";

export const metadata: Metadata = {
  title: "Laadgids",
  metadataBase: new URL(siteUrl()),
};

/** Root-layout voor de routes buiten een locale: de doorverwijzing op / en het design-lab. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="nl-BE">{children}</RootDocument>;
}
