// Verificatiepijplijn, stap 3: uitgetrokken uitvoeringen naast de rijen in `versions` leggen. Pure functies, getest.
// Uitkomst per uitvoering: nieuw (geen rij), bevestigd (binnen 3 %), afwijking (buiten 3 % of andere fasen) of onduidelijk.
import { createHash } from "node:crypto";
import type { VersionFull } from "@/lib/db/types";
import { CONFLICT_THRESHOLD, diffCandidate, matchKey, modelKey, norm, relDiff, variantScore, type FieldDiff } from "@/lib/specs/normalize";
import type { SpecCandidate } from "@/lib/specs/types";
import type { DocumentState, OemDocument } from "./documents";
import type { ExtractedVariant, Extraction } from "./extract";

export type BatteryLabelKind = "net" | "gross" | "mixed" | "unlabeled";

const NET_RE = /\b(netto|net|bruikbaar|bruikbare|usable|useable|utilisable|nutzbar)\b/;
const GROSS_RE = /\b(bruto|brut|gross|nominaal|nominale|nominal)\b/;

/**
 * "Netto capaciteit", "Battery Size - usable" → net; "Bruto", "nominaal", "nominal" → gross; een label met beide woorden
 * ("nominal / useable") → mixed (twee cijfers onder één label: het grootste is bruto, het kleinste netto); anders ongelabeld.
 */
export function classifyBatteryLabel(label: string): BatteryLabelKind {
  const l = norm(label);
  const net = NET_RE.test(l);
  const gross = GROSS_RE.test(l);
  if (net && gross) return "mixed";
  if (net) return "net";
  if (gross) return "gross";
  return "unlabeled";
}

export interface CandidateNotes {
  candidate: SpecCandidate;
  notes: string[];
}

/** Van een uitgetrokken uitvoering naar de kandidaatvorm die de matching kent, met notities over wat niet eenduidig was. */
export function toCandidate(doc: OemDocument, docState: Pick<DocumentState, "sha256"> | undefined, v: ExtractedVariant): CandidateNotes {
  const notes: string[] = [];
  let net: number | null = null;
  let gross: number | null = null;
  const unlabeled: number[] = [];
  const mixed: number[] = [];
  for (const b of v.battery) {
    const kind = classifyBatteryLabel(b.label);
    const wh = Math.round(b.kwh * 1000);
    if (kind === "net") net = net ?? wh;
    else if (kind === "gross") gross = gross ?? wh;
    else if (kind === "mixed") mixed.push(wh);
    else unlabeled.push(wh);
  }
  if (mixed.length >= 2) {
    const uniq = [...new Set(mixed)].sort((a, b) => a - b);
    if (uniq.length >= 2) {
      net = net ?? uniq[0]!;
      gross = gross ?? uniq[uniq.length - 1]!;
      notes.push(`label noemt nominaal en bruikbaar samen; ${uniq[uniq.length - 1]! / 1000} kWh als bruto en ${uniq[0]! / 1000} kWh als netto gelezen`);
    } else unlabeled.push(uniq[0]!);
  } else if (mixed.length === 1) unlabeled.push(mixed[0]!);
  if (net == null && gross == null && unlabeled.length === 1) {
    net = unlabeled[0]!;
    notes.push(`batterij ${unlabeled[0]! / 1000} kWh zonder label netto/bruto (enig gepubliceerd cijfer)`);
  } else if (unlabeled.length > 0) {
    notes.push(`ongelabelde batterijcijfers: ${unlabeled.map((w) => w / 1000).join(", ")} kWh`);
  }
  if (net == null && gross != null) notes.push(`alleen nominale/bruto capaciteit gepubliceerd (${gross / 1000} kWh)`);

  let consumption: number | null = null;
  if (v.consumption_kwh_100km) {
    const { min, max } = v.consumption_kwh_100km;
    if (max != null && max !== min) {
      consumption = Math.round(((min + max) / 2) * 10);
      notes.push(`verbruik is een bereik ${min} tot ${max} kWh/100 km; gerekend met het midden`);
    } else consumption = Math.round(min * 10);
  }
  const phases = v.ac_charging?.phases ?? null;
  const ac = v.ac_charging ? Math.round(v.ac_charging.kw * 1000) : null;
  if (v.ac_charging && v.ac_charging.standard === false) notes.push(`AC ${v.ac_charging.kw} kW is een optie volgens het document`);
  if (v.ac_option_kw) notes.push(`optionele boordlader ${v.ac_option_kw} kW`);
  if (v.notes.trim()) notes.push(`document: ${v.notes.trim()}`);

  const candidate: SpecCandidate = {
    source_kind: "oem",
    source_url: doc.url,
    source_version: docState?.sha256 ? `${doc.id}@${docState.sha256.slice(0, 12)}` : doc.id,
    source_date: new Date().toISOString().slice(0, 10),
    external_id: `${doc.id}:${norm(v.model)}:${norm(v.variant)}`,
    match_key: matchKey(doc.make, v.model, v.variant),
    make_name: doc.make,
    model_name: v.model,
    variant: v.variant,
    release_year: v.model_year,
    battery_net_wh: net,
    battery_gross_wh: gross,
    consumption_wh_per_km: consumption,
    wltp_range_km: v.range_km ? Math.round(v.range_km.max ?? v.range_km.min) : null,
    ac_max_w: ac,
    ac_phases: phases,
    dc_max_w: v.dc_max_kw ? Math.round(v.dc_max_kw * 1000) : null,
    co2_wltp_g_km: 0,
    catalog_price_nl_cents: null,
    registrations_be: null,
    registrations_nl: null,
    oem_source_url: doc.url,
    raw: v,
    matched_version_id: null,
    review_status: "new",
    review_notes: null,
  };
  return { candidate, notes };
}

/**
 * Strenger dan de algemene matcher uit lib/specs: fabrikantendocumenten schrijven de uitvoering precies, dus een rij telt
 * alleen als de uitvoeringsnaam exact overeenkomt, of minstens de helft van de woorden deelt én de batterij binnen 3 % ligt.
 * Zo wordt "Twin Motor Performance" nooit aan "Single Motor Extended Range" gekoppeld.
 */
const TOKEN_CLASSES: string[][] = [
  ["rwd", "awd", "fwd", "4matic", "xdrive", "sdrive", "4x4", "4x2", "quattro", "4motion", "achterwielaandrijving", "vierwielaandrijving", "voorwielaandrijving"],
  ["single", "dual", "twin"],
];

/** Twee uitvoeringsnamen spreken elkaar tegen als ze verschillende getallen of een verschillende aandrijving noemen. */
export function conflictingVariantTokens(a: string, b: string): boolean {
  const ta = norm(a).split(" ").filter(Boolean);
  const tb = norm(b).split(" ").filter(Boolean);
  const na = ta.filter((t) => /^\d+$/.test(t));
  const nb = tb.filter((t) => /^\d+$/.test(t));
  if (na.length && nb.length && !na.some((n) => nb.includes(n))) return true;
  for (const cls of TOKEN_CLASSES) {
    const ca = ta.filter((t) => cls.includes(t));
    const cb = tb.filter((t) => cls.includes(t));
    if (ca.length && cb.length && !ca.some((t) => cb.includes(t))) return true;
    // Het document noemt een aandrijving ("Pro 4MOTION") die de rij niet noemt ("Pro"): een rij zonder dat woord is de basisaandrijving.
    if (ca.length && !cb.length) return true;
  }
  return false;
}

export function matchVersion(c: SpecCandidate, versions: VersionFull[]): VersionFull | null {
  const key = modelKey(c.make_name, c.model_name);
  const same = versions.filter((v) => modelKey(v.make.name, v.vehicle.model) === key);
  const scored = same.filter((v) => !conflictingVariantTokens(c.variant ?? "", v.trim)).map((v) => ({ v, score: variantScore(c.variant, v.trim) }));
  const exact = scored.filter((s) => s.score === 1).map((s) => s.v);
  if (exact.length > 0) {
    return exact.find((v) => c.release_year != null && v.model_year === c.release_year) ?? exact[0]!;
  }
  const bat = c.battery_net_wh ?? c.battery_gross_wh;
  const close = scored
    .filter((s) => s.score >= 0.5)
    .filter((s) => {
      const vb = s.v.battery_net_wh ?? s.v.battery_gross_wh;
      const rel = relDiff(vb, bat);
      return rel != null && rel <= CONFLICT_THRESHOLD;
    })
    .sort((a, b) => b.score - a.score);
  return close[0]?.v ?? null;
}

const FIELD_LABEL: Record<FieldDiff["field"], string> = {
  battery_net_wh: "batterij",
  consumption_wh_per_km: "verbruik",
  ac_max_w: "AC-vermogen",
  ac_phases: "fasen",
  wltp_range_km: "rijbereik",
  dc_max_w: "DC-vermogen",
};

export type FindingKind = "nieuw" | "bevestigd" | "afwijking" | "onvolledig";

export interface Finding {
  kind: FindingKind;
  doc: OemDocument;
  variant: ExtractedVariant;
  candidate: SpecCandidate;
  version: VersionFull | null;
  diffs: FieldDiff[];
  notes: string[];
  /** Paginaverwijzingen uit het document, voor de reviewer. */
  pages: number[];
}

function pagesOf(v: ExtractedVariant): number[] {
  const p = new Set<number>();
  for (const b of v.battery) if (b.page != null) p.add(b.page);
  if (v.consumption_kwh_100km?.page != null) p.add(v.consumption_kwh_100km.page);
  if (v.ac_charging?.page != null) p.add(v.ac_charging.page);
  return [...p].sort((a, b) => a - b);
}

/** Velden die een laadpaalpagina nodig heeft; zonder die is een nieuwe rij nog niet importeerbaar. */
function complete(c: SpecCandidate): boolean {
  return (c.battery_net_wh != null || c.battery_gross_wh != null) && c.consumption_wh_per_km != null && c.ac_max_w != null;
}

export interface VariantAlias {
  document_id: string;
  /** Uitvoering zoals het document ze noemt, of "*" voor alle uitvoeringen van dat document. */
  variant: string;
  version_slug?: string;
  ignore?: string;
}

export interface AcceptedDiff {
  version_slug: string;
  field: FieldDiff["field"];
  document_id: string;
  reason: string;
}

export function compareExtraction(
  doc: OemDocument,
  docState: Pick<DocumentState, "sha256"> | undefined,
  extraction: Extraction,
  versions: VersionFull[],
  accepted: AcceptedDiff[] = [],
  aliases: VariantAlias[] = [],
): Finding[] {
  const out: Finding[] = [];
  for (const variant of extraction.variants) {
    const alias = aliases.find((a) => a.document_id === doc.id && (a.variant === "*" || norm(a.variant) === norm(variant.variant)));
    if (alias?.ignore) continue;
    const { candidate, notes } = toCandidate(doc, docState, variant);
    const aliased = alias?.version_slug ? (versions.find((v) => v.slug === alias.version_slug) ?? null) : null;
    if (alias?.version_slug && !aliased) notes.push(`alias wijst naar ${alias.version_slug}, maar die rij bestaat niet`);
    const matched = aliased ?? matchVersion(candidate, versions);
    const pages = pagesOf(variant);
    if (!matched) {
      out.push({ kind: complete(candidate) ? "nieuw" : "onvolledig", doc, variant, candidate, version: null, diffs: [], notes, pages });
      continue;
    }
    const diffs = diffCandidate(matched, candidate);
    // Alleen nominale capaciteit in de rij: vergelijk die met het bruto-cijfer van het document.
    if (matched.battery_net_wh == null && matched.battery_gross_wh != null && candidate.battery_gross_wh != null) {
      const rel = Math.abs(matched.battery_gross_wh - candidate.battery_gross_wh) / matched.battery_gross_wh;
      const i = diffs.findIndex((d) => d.field === "battery_net_wh");
      diffs[i] = { field: "battery_net_wh", version: matched.battery_gross_wh, candidate: candidate.battery_gross_wh, rel, conflict: rel > 0.03 };
    }
    for (const d of diffs) {
      const ok = accepted.find((a) => a.version_slug === matched.slug && a.field === d.field && a.document_id === doc.id);
      if (ok && d.conflict) {
        d.conflict = false;
        notes.push(`aanvaard verschil in ${FIELD_LABEL[d.field]}: ${ok.reason}`);
      }
    }
    const conflict = diffs.some((d) => d.conflict && ["battery_net_wh", "consumption_wh_per_km", "ac_max_w", "ac_phases"].includes(d.field));
    out.push({ kind: conflict ? "afwijking" : "bevestigd", doc, variant, candidate, version: matched, diffs, notes, pages });
  }
  return out;
}

/** Deterministische steekproef van ongeveer `fraction` (minstens één): dezelfde invoer geeft dezelfde keuze. */
export function sampleForHumanCheck<T extends { candidate: SpecCandidate }>(findings: T[], fraction = 0.1): T[] {
  if (findings.length === 0) return [];
  const n = Math.max(1, Math.round(findings.length * fraction));
  const ranked = findings
    .map((f) => ({ f, h: createHash("sha1").update(`${f.candidate.source_version}|${f.candidate.external_id}`).digest("hex") }))
    .sort((a, b) => (a.h < b.h ? -1 : 1));
  return ranked.slice(0, n).map((x) => x.f);
}



function fmt(field: FieldDiff["field"], v: number | null): string {
  if (v == null) return "–";
  if (field === "battery_net_wh") return `${(v / 1000).toLocaleString("nl-BE")} kWh`;
  if (field === "consumption_wh_per_km") return `${(v / 10).toLocaleString("nl-BE")} kWh/100 km`;
  if (field === "ac_max_w" || field === "dc_max_w") return `${(v / 1000).toLocaleString("nl-BE")} kW`;
  if (field === "wltp_range_km") return `${v} km`;
  return String(v);
}

export interface ReportInput {
  date: string;
  documents: { doc: OemDocument; state: DocumentState | undefined }[];
  findings: Finding[];
  /** Versies waarvan het brondocument onbereikbaar is, of dat niet in de registry staat. */
  orphanVersions: { version: VersionFull; reason: string }[];
  sample: Finding[];
}

export function renderReport(r: ReportInput): string {
  const L: string[] = [`# Verificatierapport ${r.date}`, ""];
  const by = (k: FindingKind) => r.findings.filter((f) => f.kind === k);
  L.push(`Documenten: ${r.documents.length} · nieuw: ${by("nieuw").length} · afwijkingen: ${by("afwijking").length} · bevestigd: ${by("bevestigd").length} · onvolledig: ${by("onvolledig").length} · bronnen met probleem: ${r.orphanVersions.length}`, "");

  L.push("## Documenten", "", "| Document | Markt | Status | Laatst gewijzigd | Opmerking |", "|---|---|---|---|---|");
  for (const { doc, state } of r.documents) {
    L.push(`| ${doc.id} | ${doc.market} | ${state?.status ?? "niet opgehaald"}${state?.http && state.status === "unreachable" ? ` (HTTP ${state.http})` : ""} | ${state?.changed_at ?? "–"} | ${state?.error ?? doc.note ?? ""} |`);
  }
  L.push("");

  const sec = (title: string, items: Finding[], body: (f: Finding) => string[]) => {
    L.push(`## ${title} (${items.length})`, "");
    if (items.length === 0) L.push("Geen.", "");
    for (const f of items) {
      L.push(...body(f), "");
    }
  };
  const head = (f: Finding) => `### ${f.doc.make} ${f.variant.model} ${f.variant.variant}${f.variant.model_year ? ` (${f.variant.model_year})` : ""} · ${f.doc.id}${f.pages.length ? ` p. ${f.pages.join(", ")}` : ""}`;
  const values = (f: Finding) => {
    const c = f.candidate;
    const parts = [
      c.battery_net_wh != null ? `netto ${c.battery_net_wh / 1000} kWh` : null,
      c.battery_gross_wh != null ? `bruto/nominaal ${c.battery_gross_wh / 1000} kWh` : null,
      c.consumption_wh_per_km != null ? `verbruik ${c.consumption_wh_per_km / 10} kWh/100 km` : "verbruik ontbreekt",
      c.ac_max_w != null ? `AC ${c.ac_max_w / 1000} kW${c.ac_phases ? ` ${c.ac_phases}-fasig` : ""}` : "AC ontbreekt",
    ].filter(Boolean);
    return `- Document: ${parts.join(", ")}`;
  };
  const quotes = (f: Finding) => {
    const q: string[] = [];
    for (const b of f.variant.battery) q.push(`  - "${b.label || "(geen label)"}": ${b.kwh} kWh${b.page ? ` (p. ${b.page})` : ""} — "${b.quote}"`);
    if (f.variant.consumption_kwh_100km) q.push(`  - verbruik${f.variant.consumption_kwh_100km.page ? ` (p. ${f.variant.consumption_kwh_100km.page})` : ""} — "${f.variant.consumption_kwh_100km.quote}"`);
    if (f.variant.ac_charging) q.push(`  - AC${f.variant.ac_charging.page ? ` (p. ${f.variant.ac_charging.page})` : ""} — "${f.variant.ac_charging.quote}"`);
    return q;
  };

  sec("Nieuwe uitvoeringen, klaar voor import", by("nieuw"), (f) => [head(f), values(f), ...f.notes.map((n) => `- ${n}`), "- Citaten:", ...quotes(f)]);
  sec("Afwijkingen tegenover de site", by("afwijking"), (f) => [
    head(f),
    `- Rij op de site: ${f.version!.slug}`,
    ...f.diffs.filter((d) => d.conflict).map((d) => `- ${FIELD_LABEL[d.field]}: site ${fmt(d.field, d.version)}, document ${fmt(d.field, d.candidate)}`),
    ...f.notes.map((n) => `- ${n}`),
    "- Citaten:",
    ...quotes(f),
  ]);
  sec("Onvolledig (document geeft niet alle vereiste cijfers)", by("onvolledig"), (f) => [head(f), values(f), ...f.notes.map((n) => `- ${n}`)]);
  sec("Bevestigd (binnen 3 %)", by("bevestigd"), (f) => [`- ${f.doc.make} ${f.variant.model} ${f.variant.variant} → ${f.version!.slug}${f.notes.length ? ` (${f.notes.join("; ")})` : ""}`]);

  L.push(`## Bronnen met een probleem (${r.orphanVersions.length})`, "");
  if (r.orphanVersions.length === 0) L.push("Geen.", "");
  for (const o of r.orphanVersions) L.push(`- ${o.version.slug}: ${o.reason}`);
  L.push("");

  L.push(`## Steekproef voor menselijke controle (${r.sample.length}, CLAUDE.md §8: 10 %)`, "", "Open het document op de vermelde pagina en vergelijk met wat de pijplijn las:", "");
  for (const f of r.sample) {
    L.push(`### ${f.doc.make} ${f.variant.model} ${f.variant.variant} · ${f.doc.id}${f.pages.length ? ` p. ${f.pages.join(", ")}` : ""}`, `- Bron: ${f.doc.file ?? f.doc.url}`, values(f).replace("- Document:", "- Gelezen:"), "- Citaten:", ...quotes(f), "");
  }
  return L.join("\n");
}

function csvField(s: string): string {
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV in het formaat van data/import/verificatie-batch-*.csv: één rij per nieuwe of afwijkende uitvoering. */
export function renderVerificationCsv(findings: Finding[]): string {
  const rows = ["model;batterij_netto_kwh;batterij_bruto_kwh;wltp_kwh_100km;ac_kw_standaard;ac_kw_optie;ac_fasen;officieel_bevestigd;bron_url;opmerking"];
  for (const f of findings) {
    const c = f.candidate;
    const slug = f.version?.slug ?? `${norm(f.doc.make)} ${norm(f.variant.model)} ${norm(f.variant.variant)}${f.variant.model_year ? ` ${f.variant.model_year}` : ""}`.replace(/\s+/g, "-");
    const kwh = (wh: number | null) => (wh == null ? "" : (wh / 1000).toFixed(1));
    const opt = f.variant.ac_option_kw ? f.variant.ac_option_kw.toFixed(1) : "";
    const note = [
      f.kind === "nieuw" ? "nieuw uit de pijplijn" : f.kind === "afwijking" ? `afwijking: ${f.diffs.filter((d) => d.conflict).map((d) => `${FIELD_LABEL[d.field]} site ${fmt(d.field, d.version)} vs document ${fmt(d.field, d.candidate)}`).join("; ")}` : f.kind,
      f.pages.length ? `p. ${f.pages.join(", ")}` : "",
      ...f.notes,
    ]
      .filter(Boolean)
      .join("; ");
    rows.push([slug, kwh(c.battery_net_wh), kwh(c.battery_gross_wh), c.consumption_wh_per_km != null ? (c.consumption_wh_per_km / 10).toFixed(2).replace(/0$/, "") : "", c.ac_max_w != null ? (c.ac_max_w / 1000).toFixed(1) : "", opt, c.ac_phases?.toString() ?? "", "nee", f.doc.url, note].map(csvField).join(";"));
  }
  return rows.join("\n") + "\n";
}
