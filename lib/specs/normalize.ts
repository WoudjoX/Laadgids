// Normalisatie en matching van spec-kandidaten. Pure functies, getest.
import type { VersionFull } from "@/lib/db/types";
import type { SpecCandidate } from "./types";

/** "Škoda" → "skoda", "ID.3 Pro" → "id3 pro", "Model 3 (Highland)" → "model 3 highland". */
export function norm(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Losse sleutel: merk en model. Varianten matchen daarna op tokens. */
export function modelKey(make: string, model: string): string {
  return `${norm(make)}|${norm(model)}`;
}

export function matchKey(make: string, model: string, variant: string | null | undefined): string {
  return `${modelKey(make, model)}|${norm(variant)}`;
}

/** Vergelijking van twee getallen als relatieve afwijking; null als een van beide ontbreekt. */
export function relDiff(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || a === 0) return null;
  return Math.abs(a - b) / Math.abs(a);
}

export interface FieldDiff {
  field: "battery_net_wh" | "consumption_wh_per_km" | "ac_max_w" | "ac_phases" | "wltp_range_km" | "dc_max_w";
  version: number | null;
  candidate: number | null;
  rel: number | null;
  conflict: boolean;
}

export const CONFLICT_THRESHOLD = 0.03;

/** Bronnen waarvan het verbruik een praktijkgemiddelde is, geen WLTP: verschil is informatief, geen conflict. */
const NON_WLTP_CONSUMPTION: SpecCandidate["source_kind"][] = ["open_ev_data"];

/** Verschillen per veld tussen een bestaande versie en een kandidaat. Conflict boven 3 %, fasen exact. */
export function diffCandidate(version: VersionFull, c: SpecCandidate): FieldDiff[] {
  const fields: FieldDiff["field"][] = ["battery_net_wh", "consumption_wh_per_km", "ac_max_w", "ac_phases", "wltp_range_km", "dc_max_w"];
  return fields.map((field) => {
    const v = version[field] ?? null;
    const k = c[field] ?? null;
    if (field === "ac_phases") return { field, version: v, candidate: k, rel: null, conflict: v != null && k != null && v !== k };
    const rel = relDiff(v, k);
    const informative = field === "consumption_wh_per_km" && NON_WLTP_CONSUMPTION.includes(c.source_kind);
    return { field, version: v, candidate: k, rel, conflict: !informative && rel != null && rel > CONFLICT_THRESHOLD };
  });
}

/** Token-overlap tussen variantnamen, 0 tot 1. "RWD" vs "RWD 2025" → 1; "Pro" vs "Pro S" → 0.5. */
export function variantScore(a: string | null | undefined, b: string | null | undefined): number {
  const ta = new Set(norm(a).split(" ").filter(Boolean));
  const tb = new Set(norm(b).split(" ").filter(Boolean));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit++;
  return hit / Math.max(ta.size, tb.size);
}

export interface Match {
  version: VersionFull;
  score: number; // variantScore + bonus voor batterij binnen 3 %
}

/**
 * Beste versie voor een kandidaat: zelfde merk en model, dan variant en batterij. null onder 0.3.
 * Als beide kanten een variantnaam hebben zonder enige overlap, is het een andere uitvoering: geen match.
 */
export function bestMatch(c: SpecCandidate, versions: VersionFull[]): Match | null {
  const key = modelKey(c.make_name, c.model_name);
  let best: Match | null = null;
  for (const v of versions) {
    if (modelKey(v.make.name, v.vehicle.model) !== key) continue;
    let score = variantScore(c.variant, v.trim);
    if (score === 0 && norm(c.variant) && norm(v.trim)) continue;
    const rb = relDiff(v.battery_net_wh, c.battery_net_wh);
    if (rb != null && rb <= CONFLICT_THRESHOLD) score += 0.5;
    if (c.release_year && v.model_year && Math.abs(c.release_year - v.model_year) <= 1) score += 0.1;
    if (!best || score > best.score) best = { version: v, score };
  }
  return best && best.score >= 0.3 ? best : null;
}

/** Merknamen zoals de EEA ze schrijft, naast de fabrikantennaam. Kleine letters, genormaliseerd. */
const MAKE_ALIASES: Record<string, string[]> = {
  volkswagen: ["vw", "volkswagen vw"],
  "mercedes benz": ["mercedes"],
  citroen: ["citroën"],
  skoda: ["škoda"],
  "bmw i": ["bmw"],
  cupra: ["seat cupra"],
  "ds": ["ds automobiles"],
  polestar: ["polestar"],
};

function makeTokens(make: string): Set<string> {
  const base = norm(make);
  const out = new Set(base.split(" ").filter(Boolean));
  for (const [k, aliases] of Object.entries(MAKE_ALIASES)) {
    if (k === base || aliases.includes(base)) for (const a of [k, ...aliases]) a.split(" ").forEach((t) => out.add(t));
  }
  return out;
}

/**
 * Koppelt een fabrikantenmodel ("BMW", "iX1") aan een EEA-handelsnaam ("Bmw", "Ix1 Edrive20" of "Volkswagen, Vw Id.4 Pro 210kw").
 * De EEA plakt merk, model en uitvoering in één veld; we halen de merktokens weg en eisen dat de modelnaam
 * het begin vormt van wat overblijft (zonder spaties vergeleken, zodat "id 4" en "id4" gelijk zijn).
 */
export function eeaModelMatches(candMake: string, candModel: string, eeaMake: string, eeaModel: string): boolean {
  const cm = makeTokens(candMake);
  const em = makeTokens(eeaMake);
  if (![...cm].some((t) => em.has(t))) return false;
  const strip = (s: string) => norm(s).split(" ").filter((t) => t && !cm.has(t) && !em.has(t));
  const ct = strip(candModel);
  const et = strip(eeaModel);
  if (!ct.length || !et.length) return false;
  const n = Math.min(ct.length, et.length);
  const prefixEqual = ct.slice(0, n).every((t, i) => t === et[i]);
  // "id 4" in "id 4 pro 210kw": de modelnaam is het begin van de EEA-naam, token voor token.
  if (prefixEqual && ct.length <= et.length) return true;
  // "kona" tegenover "kona electric": de EEA-naam is korter maar volledig gelijk aan het begin.
  if (prefixEqual && et.length < ct.length) return et.some((t) => t.length >= 3);
  // "500" tegenover "500e": één token, hoogstens één teken verschil.
  return ct.length === 1 && et.length === 1 && et[0]!.length >= 3 && ct[0]!.startsWith(et[0]!) && ct[0]!.length - et[0]!.length <= 1;
}
