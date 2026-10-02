import { Inter } from "next/font/google";

// Inter: twee gewichten, latin, swap (DESIGN.md §2). Eén definitie voor alle root-layouts.
export const inter = Inter({ subsets: ["latin"], weight: ["400", "600"], display: "swap", variable: "--font-inter" });
