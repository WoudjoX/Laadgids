// Startpagina-overzicht: merken met aantallen en de uitvoeringen waarvan het laadadvies afwijkt. Pure functies, getest.
import { recommendedSeconds, type ModelCardItem } from "@/components/ModelCards";

export interface MakeTile {
  slug: string;
  name: string;
  count: number;
  minSeconds: number;
  maxSeconds: number;
}

/** Eén tegel per merk, alfabetisch, met het aantal uitvoeringen en de spreiding van de laadtijd (20 naar 80 %). */
export function makeTiles(items: ModelCardItem[]): MakeTile[] {
  const map = new Map<string, MakeTile>();
  for (const it of items) {
    const s = recommendedSeconds(it.v);
    const t = map.get(it.v.make.slug);
    if (t) {
      t.count++;
      t.minSeconds = Math.min(t.minSeconds, s);
      t.maxSeconds = Math.max(t.maxSeconds, s);
    } else map.set(it.v.make.slug, { slug: it.v.make.slug, name: it.v.make.name, count: 1, minSeconds: s, maxSeconds: s });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Waarom het advies voor een uitvoering afwijkt van de gewone 11 kW-driefasige auto. */
export type ExceptionKind = "one_phase" | "above_11" | "below_11";

export interface ModelException {
  item: ModelCardItem;
  kind: ExceptionKind;
}

/** Het standaardgeval: 11 kW, driefasig. Alles daarbuiten krijgt een eigen advies en verdient een vermelding. */
export const STANDARD_AC_W = 11000;

export function exceptionKind(v: ModelCardItem["v"]): ExceptionKind | null {
  if (v.ac_phases === 1) return "one_phase";
  if (v.ac_max_w > STANDARD_AC_W) return "above_11";
  if (v.ac_max_w < STANDARD_AC_W) return "below_11";
  return null;
}

const ORDER: ExceptionKind[] = ["one_phase", "above_11", "below_11"];

/** Afwijkende uitvoeringen, gegroepeerd op soort (eerst 1-fasig, dan boven en onder 11 kW), binnen de soort op naam. */
export function modelExceptions(items: ModelCardItem[]): ModelException[] {
  const out: ModelException[] = [];
  for (const item of items) {
    const kind = exceptionKind(item.v);
    if (kind) out.push({ item, kind });
  }
  const name = (e: ModelException) => `${e.item.v.make.name} ${e.item.v.vehicle.model} ${e.item.v.trim}`;
  return out.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || name(a).localeCompare(name(b)));
}
