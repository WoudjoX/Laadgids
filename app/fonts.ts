import { Inter } from "next/font/google";

// Inter: twee gewichten, latin, optional (DESIGN.md §2): geen wissel na de eerste weergave, dus geen late LCP;
// zonder webfont blijft de maatgelijke fallback staan (geen layoutverschuiving). Eén definitie voor alle root-layouts.
export const inter = Inter({ subsets: ["latin"], weight: ["400", "600"], display: "optional", variable: "--font-inter" });
