// Startpagina-overzicht: merken met aantallen en de uitvoeringen waarvan het laadadvies afwijkt. Pure functies, getest.
import { recommendedSeconds, type ModelCardItem } from "@/components/ModelCards";

export interface MakeTile {
  slug: string;
  name: string;
  count: number;
  minSeconds: number;
  maxSeconds: number;
  /** Modelnamen van het merk, uniek en alfabetisch ("i4", "iX1", ...). */
  models: string[];
  /** Etiket alleen als het merk een uitvoering heeft die eenfasig of boven 11 kW laadt; hoogste AC-vermogen voor dat laatste. */
  badge: { kind: "one_phase" } | { kind: "above_11"; ac_max_w: number } | null;
}

/** Eén tegel per merk, alfabetisch, met het aantal uitvoeringen en de spreiding van de laadtijd (20 naar 80 %). */
export function makeTiles(items: ModelCardItem[]): MakeTile[] {
  const map = new Map<string, MakeTile & { modelSet: Set<string> }>();
  for (const it of items) {
    const s = recommendedSeconds(it.v);
    let t = map.get(it.v.make.slug);
    if (!t) {
      t = { slug: it.v.make.slug, name: it.v.make.name, count: 0, minSeconds: s, maxSeconds: s, models: [], badge: null, modelSet: new Set() };
      map.set(it.v.make.slug, t);
    }
    t.count++;
    t.minSeconds = Math.min(t.minSeconds, s);
    t.maxSeconds = Math.max(t.maxSeconds, s);
    t.modelSet.add(it.v.vehicle.model);
    const kind = exceptionKind(it.v);
    if (kind === "one_phase") t.badge = { kind: "one_phase" };
    else if (kind === "above_11" && t.badge?.kind !== "one_phase") {
      const cur = t.badge?.kind === "above_11" ? t.badge.ac_max_w : 0;
      t.badge = { kind: "above_11", ac_max_w: Math.max(cur, it.v.ac_max_w) };
    }
  }
  return [...map.values()]
    .map(({ modelSet, ...t }) => ({ ...t, models: [...modelSet].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
