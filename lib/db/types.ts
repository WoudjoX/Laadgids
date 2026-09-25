// Rijtypes, 1-op-1 met supabase/migrations/0001_init.up.sql.
// Geld in eurocent, vermogen in watt, energie in Wh.

export type Country = "BE" | "NL";
export type Region = "VLA" | "WAL" | "BRU";
export type Locale = "nl-BE" | "fr-BE" | "nl-NL";
export type Powertrain = "bev" | "phev" | "erev";
export type PageStatus = "draft" | "noindex" | "index";
export type Template =
  | "charger_for_model"
  | "charging_cost"
  | "vaa"
  | "bijtelling"
  | "rule"
  | "used_battery"
  | "installer_city"
  | "make_hub";

export type RuleType =
  | "vaa"
  | "deductibility"
  | "bijtelling"
  | "vat_reduced"
  | "capacity_tariff"
  | "isde"
  | "creg_tariff";

export interface MakeRow {
  id: number;
  slug: string;
  name: string;
}

export interface VehicleRow {
  id: number;
  make_id: number;
  slug: string;
  model: string;
  generation: string | null;
  powertrain: Powertrain;
  segment: string | null;
}

export interface VersionRow {
  id: number;
  vehicle_id: number;
  slug: string;
  trim: string;
  model_year: number | null;
  battery_gross_wh: number | null;
  battery_net_wh: number;
  wltp_range_km: number | null;
  consumption_wh_per_km: number;
  ac_max_w: number;
  ac_phases: 1 | 3;
  dc_max_w: number | null;
  towing_kg: number | null;
  catalog_price_be_cents: number | null;
  catalog_price_nl_cents: number | null;
  co2_wltp_g_km: number;
  sold_in: Country[];
  spec_source_url: string;
  spec_source_date: string; // ISO date
  /** Datum waarop Erwin de specs tegen de fabrikantenbron gelegd heeft. null = nog niet: pagina blijft noindex. */
  verified_at?: string | null;
  /** Voetnoot op de pagina, bv. een bekende afwijking tussen fabrikantencijfer en praktijk. */
  spec_notes?: string | null;
  /** true als de netto batterijcapaciteit een schatting is omdat de fabrikant ze niet publiceert; de pagina toont dat zichtbaar. */
  battery_estimated?: boolean | null;
}

export interface RuleRow<P = unknown> {
  id: number;
  country: Country;
  region: Region | null;
  rule_type: RuleType;
  valid_from: string;
  valid_to: string | null;
  params: P;
  source_url: string;
  source_checked_at: string;
  notes: string | null;
}

export interface TariffRow {
  id: number;
  country: Country;
  region: Region | null;
  slug: string;
  label: Record<string, string>;
  /** Eurocent per kWh, all-in; mag decimalen hebben (numeric in de database). */
  price_cents_per_kwh: number;
  charging_loss_pct: number;
  source_url: string;
  source_checked_at: string;
  notes: string | null;
}

export interface PageRow {
  id: number;
  locale: Locale;
  template: Template;
  entity_id: number | null;
  secondary_id: number | null;
  path: string;
  status: PageStatus;
  completeness_score: number;
  last_calculated_at: string | null;
  last_published_at: string | null;
}

export interface LeadInsert {
  locale: Locale;
  page_path: string | null;
  postal_code: string;
  connection_type: "1F" | "3F" | "unknown" | null;
  ampere: number | null;
  desired_power_w: number | null;
  home_older_than_10y: boolean | null;
  company_car: boolean | null;
  email: string;
  phone: string | null;
  consent_at: string;
}

export interface LeadRow extends LeadInsert {
  id: number;
  created_at: string;
  forwarded_to: number[];
  status: "new" | "forwarded" | "expired" | "spam";
}

export interface InstallerRow {
  id: number;
  name: string;
  regions: string[];
  contact_email: string;
  price_per_lead_cents: number | null;
  active: boolean;
}

export interface SourceRow {
  id: number;
  url: string;
  title: string | null;
  last_checked_at: string | null;
  check_interval_days: number;
}

/** Versie met make/vehicle erbij, zoals de templates ze nodig hebben. */
export interface VersionFull extends VersionRow {
  vehicle: VehicleRow;
  make: MakeRow;
}
