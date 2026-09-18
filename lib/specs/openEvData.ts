// Mapping van open-ev-data-dataset (github.com/open-ev-data/open-ev-data-dataset, schema 1.0.0) naar spec_candidates.
// Pure functies. De dataset kent geen WLTP-verbruik; dat veld blijft leeg.
import { z } from "zod";
import { matchKey } from "./normalize";
import type { SpecCandidate } from "./types";

export const OPEN_EV_DATA_URL = "https://github.com/open-ev-data/open-ev-data-dataset";

const named = z.object({ slug: z.string().optional(), name: z.string() });
const num = z.number().nullable().optional();

const vehicle = z.object({
  unique_code: z.string().optional(),
  make: named,
  model: named,
  trim: named.optional(),
  variant: z.object({ name: z.string().optional(), kind: z.string().optional() }).optional(),
  year: z.number().int().optional(),
  vehicle_type: z.string().optional(),
  battery: z.object({ pack_capacity_kwh_gross: num, pack_capacity_kwh_net: num }).optional(),
  charging: z
    .object({
      ac: z.object({ max_power_kw: num, phases: z.number().int().nullable().optional() }).optional(),
      dc: z.object({ max_power_kw: num }).optional(),
    })
    .optional(),
  range: z.object({ rated: z.array(z.object({ cycle: z.string(), range_km: z.number() })).optional() }).optional(),
  sources: z.array(z.object({ type: z.string().optional(), url: z.string().optional(), accessed_at: z.string().optional() })).optional(),
  markets: z.array(z.string()).optional(),
  availability: z.object({ status: z.string().optional() }).optional(),
});

export const openEvDataFile = z.object({
  schema_version: z.string().optional(),
  generated_at: z.string(),
  vehicle_count: z.number().optional(),
  vehicles: z.array(z.record(z.string(), z.unknown())),
});

export type OpenEvVehicle = z.infer<typeof vehicle>;

const CAR_TYPES = new Set(["passenger_car", "suv", "pickup", "van"]);

function wh(kwh: number | null | undefined): number | null {
  return kwh == null ? null : Math.round(kwh * 1000);
}

/** Eén record naar een kandidaat. null voor niet-auto's of onbruikbare records. */
export function toCandidate(raw: unknown, sourceVersion: string, sourceDate: string): SpecCandidate | null {
  const p = vehicle.safeParse(raw);
  if (!p.success) return null;
  const v = p.data;
  if (v.vehicle_type && !CAR_TYPES.has(v.vehicle_type)) return null;

  const trim = v.trim?.name?.trim() || null;
  const variantName = v.variant?.name?.trim() || null;
  const variant = [trim, variantName && variantName !== trim ? variantName : null].filter(Boolean).join(" ") || null;
  const phases = v.charging?.ac?.phases ?? null;
  const wltp = v.range?.rated?.find((r) => r.cycle === "wltp")?.range_km ?? null;
  const oem = v.sources?.find((s) => s.type === "oem" && s.url);

  const notes: string[] = [];
  if (phases == null) notes.push("geen fasen in bron");
  if (v.battery?.pack_capacity_kwh_net == null) notes.push("geen netto batterij");
  if (v.charging?.ac?.max_power_kw == null) notes.push("geen AC-vermogen");
  if (v.availability?.status === "announced") notes.push("aangekondigd, nog niet in productie");
  if (v.markets?.length && !v.markets.some((m) => ["BE", "NL", "DE", "FR"].includes(m))) notes.push(`markten: ${v.markets.join(",")}`);

  return {
    source_kind: "open_ev_data",
    source_url: OPEN_EV_DATA_URL,
    source_version: sourceVersion,
    source_date: sourceDate,
    external_id: v.unique_code ?? matchKey(v.make.name, v.model.name, `${variant ?? ""} ${v.year ?? ""}`),
    match_key: matchKey(v.make.name, v.model.name, variant),
    make_name: v.make.name.trim(),
    model_name: v.model.name.trim(),
    variant,
    release_year: v.year ?? null,
    battery_net_wh: wh(v.battery?.pack_capacity_kwh_net),
    battery_gross_wh: wh(v.battery?.pack_capacity_kwh_gross),
    consumption_wh_per_km: null,
    wltp_range_km: wltp,
    ac_max_w: wh(v.charging?.ac?.max_power_kw),
    ac_phases: phases,
    dc_max_w: wh(v.charging?.dc?.max_power_kw),
    co2_wltp_g_km: 0,
    catalog_price_nl_cents: null,
    registrations_be: null,
    registrations_nl: null,
    oem_source_url: oem?.url ?? null,
    raw,
    matched_version_id: null,
    review_status: "new",
    review_notes: notes.length ? notes.join("; ") : null,
  };
}

/** Versie uit een bestandsnaam als "open-ev-data-v1.24.0.json"; anders null. */
export function versionFromFilename(name: string): string | null {
  const m = /v(\d+\.\d+\.\d+)/.exec(name);
  return m ? `v${m[1]}` : null;
}
