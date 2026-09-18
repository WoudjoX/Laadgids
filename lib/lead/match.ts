// Installateurs matchen op postcode. installers.regions bevat postcode-prefixen ("9", "90") of gewestcodes ("VLA").
import type { InstallerRow, Region } from "@/lib/db/types";

/** Belgische postcode naar gewest. null voor niet-Belgische codes. */
export function regionForBePostal(postal: string): Region | null {
  const n = Number(postal);
  if (!Number.isInteger(n) || n < 1000 || n > 9999) return null;
  if (n <= 1299) return "BRU";
  if (n <= 1499) return "WAL"; // Waals-Brabant
  if (n <= 3999) return "VLA";
  if (n <= 7999) return "WAL";
  return "VLA";
}

export function matchInstallers(installers: InstallerRow[], postal: string, max = 3): InstallerRow[] {
  const digits = postal.replace(/\s+/g, "").slice(0, 4);
  const region = regionForBePostal(digits);
  const scored = installers
    .filter((i) => i.active)
    .map((i) => {
      let best = 0;
      for (const r of i.regions) {
        if (/^\d+$/.test(r) && digits.startsWith(r)) best = Math.max(best, r.length + 1);
        else if (region && r === region) best = Math.max(best, 1);
      }
      return { i, best };
    })
    .filter((x) => x.best > 0)
    .sort((a, b) => b.best - a.best || a.i.id - b.i.id);
  return scored.slice(0, max).map((x) => x.i);
}
