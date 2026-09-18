import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { siteUrl } from "@/lib/seo/alternates";

// Inter: twee gewichten, latin, swap (DESIGN.md §2).
const inter = Inter({ subsets: ["latin"], weight: ["400", "600"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Laadgids",
  metadataBase: new URL(siteUrl()),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl-BE" className={inter.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
