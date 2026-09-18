// Staging-rijen voor open specs (supabase/migrations/0002_spec_candidates.up.sql).
export type SourceKind = "open_ev_data" | "rdw" | "eea" | "vca";
export type ReviewStatus = "new" | "matched" | "conflict" | "ignored" | "promoted";

export interface SpecCandidate {
  source_kind: SourceKind;
  source_url: string;
  source_version: string | null;
  source_date: string;
  external_id: string | null;
  match_key: string;
  make_name: string;
  model_name: string;
  variant: string | null;
  release_year: number | null;
  battery_net_wh: number | null;
  battery_gross_wh: number | null;
  consumption_wh_per_km: number | null;
  wltp_range_km: number | null;
  ac_max_w: number | null;
  ac_phases: number | null;
  dc_max_w: number | null;
  co2_wltp_g_km: number | null;
  catalog_price_nl_cents: number | null;
  registrations_be: number | null;
  registrations_nl: number | null;
  /** Fabrikantenbron zoals de open dataset die opgeeft; suggestie voor spec_source_url, nooit automatisch overgenomen. */
  oem_source_url: string | null;
  raw: unknown;
  matched_version_id: number | null;
  review_status: ReviewStatus;
  review_notes: string | null;
}
