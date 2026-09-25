// Vertaalt wat een bezoeker typt in het keuzeveld naar een versie. Pure functies, getest.
import { norm } from "@/lib/specs/normalize";

export interface PickItem {
  slug: string;
  label: string; // "Tesla Model 3 RWD (2025)"
}

/** Exacte label-match, anders alle woorden van de zoekterm in het label, anders null. */
export function resolvePick(q: string, items: PickItem[]): { slug: string; exact: boolean } | null {
  const nq = norm(q);
  if (!nq) return null;
  const exact = items.find((i) => norm(i.label) === nq);
  if (exact) return { slug: exact.slug, exact: true };
  const words = nq.split(" ");
  const hits = items.filter((i) => {
    const nl = norm(i.label);
    return words.every((w) => nl.includes(w));
  });
  return hits.length === 1 ? { slug: hits[0]!.slug, exact: false } : null;
}

/** Kandidaten voor een zoekterm, voor de resultatenlijst als er geen unieke match is. */
export function matchPicks<T extends PickItem>(q: string, items: T[]): T[] {
  const words = norm(q).split(" ").filter(Boolean);
  if (!words.length) return [];
  return items.filter((i) => {
    const nl = norm(i.label);
    return words.every((w) => nl.includes(w));
  });
}
