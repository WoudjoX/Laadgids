// EEA CO2-monitoring personenwagens (verordening 2019/631): inschrijvingen per variant, per land.
// Pure aggregatie over CSV-rijen. Kolomnamen zijn configureerbaar omdat ze per jaargang verschillen.
import { matchKey } from "./normalize";
import type { SpecCandidate } from "./types";

export const EEA_URL = "https://www.eea.europa.eu/en/datahub";

export interface EeaColumns {
  country: string; // "Country"
  make: string; // "Mk"
  commercialName: string; // "Cn"
  variant: string; // "Va" of "Ve"
  fuelType: string; // "Ft"
  co2Wltp: string; // "Ewltp"
  consumptionWhKm: string; // "z (Wh/km)"
  electricRangeKm: string; // "Electric range (km)" of "Er"
  year: string; // "year"
}

export const EEA_DEFAULT_COLUMNS: EeaColumns = {
  country: "Country",
  make: "Mk",
  commercialName: "Cn",
  variant: "Va",
  fuelType: "Ft",
  co2Wltp: "Ewltp",
  consumptionWhKm: "z (Wh/km)",
  electricRangeKm: "Electric range (km)",
  year: "year",
};

/** Brandstoftypes die we meenemen: BEV en (plug-in/REEV) hybrides. Hoofdletterongevoelig. */
export const EEA_FUEL_TYPES = new Set(["electric", "petrol/electric", "diesel/electric"]);
export const EEA_COUNTRIES = new Set(["BE", "NL"]);

export interface EeaAggregate {
  key: string;
  make: string;
  model: string;
  variant: string | null;
  fuelType: string;
  year: number | null;
  co2: number | null;
  consumption_wh_per_km: number | null;
  range_km: number | null;
  be: number;
  nl: number;
}

function num(s: string | undefined): number | null {
  if (s == null) return null;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) && s.trim() !== "" ? n : null;
}

function title(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_m, p, c: string) => p + c.toUpperCase());
}

/** Splitst één CSV-regel; EEA gebruikt komma's, soms puntkomma's. Aanhalingstekens worden gerespecteerd. */
export function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (ch === sep && !q) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function detectSeparator(headerLine: string): string {
  return (headerLine.match(/;/g) ?? []).length > (headerLine.match(/,/g) ?? []).length ? ";" : ",";
}

/** Aggregator: voer rijen in, lees daarna `values()`. */
export class EeaAggregator {
  private map = new Map<string, EeaAggregate>();
  private idx: Record<keyof EeaColumns, number> = {} as Record<keyof EeaColumns, number>;
  rowsSeen = 0;
  rowsKept = 0;

  constructor(
    header: string[],
    private cols: EeaColumns = EEA_DEFAULT_COLUMNS,
  ) {
    const lower = header.map((h) => h.trim().toLowerCase());
    for (const k of Object.keys(cols) as (keyof EeaColumns)[]) {
      const i = lower.indexOf(cols[k].toLowerCase());
      this.idx[k] = i;
    }
    for (const k of ["country", "make", "commercialName", "fuelType"] as const) {
      if (this.idx[k] < 0) throw new Error(`EEA column "${cols[k]}" not found in header`);
    }
  }

  private cell(row: string[], k: keyof EeaColumns): string | undefined {
    const i = this.idx[k];
    return i >= 0 ? row[i] : undefined;
  }

  add(row: string[]): void {
    this.rowsSeen++;
    const country = (this.cell(row, "country") ?? "").trim().toUpperCase();
    if (!EEA_COUNTRIES.has(country)) return;
    const ft = (this.cell(row, "fuelType") ?? "").trim().toLowerCase();
    if (!EEA_FUEL_TYPES.has(ft)) return;
    const make = title(this.cell(row, "make") ?? "");
    const model = title(this.cell(row, "commercialName") ?? "");
    if (!make || !model) return;
    const variant = (this.cell(row, "variant") ?? "").trim() || null;
    const co2 = num(this.cell(row, "co2Wltp"));
    const cons = num(this.cell(row, "consumptionWhKm"));
    const range = num(this.cell(row, "electricRangeKm"));
    const year = num(this.cell(row, "year"));
    const key = `${matchKey(make, model, variant)}|${ft}|${co2 ?? ""}|${cons ?? ""}|${range ?? ""}`;
    let agg = this.map.get(key);
    if (!agg) {
      agg = { key, make, model, variant, fuelType: ft, year: year == null ? null : Math.round(year), co2, consumption_wh_per_km: cons == null ? null : Math.round(cons), range_km: range == null ? null : Math.round(range), be: 0, nl: 0 };
      this.map.set(key, agg);
    }
    if (country === "BE") agg.be++;
    else agg.nl++;
    this.rowsKept++;
  }

  values(): EeaAggregate[] {
    return [...this.map.values()].sort((a, b) => b.be + b.nl - (a.be + a.nl));
  }
}

export function toCandidates(aggs: EeaAggregate[], sourceVersion: string, sourceDate: string, minRegistrations = 1): SpecCandidate[] {
  return aggs
    .filter((a) => a.be + a.nl >= minRegistrations)
    .map((a) => ({
      source_kind: "eea" as const,
      source_url: EEA_URL,
      source_version: sourceVersion,
      source_date: sourceDate,
      external_id: a.key,
      match_key: matchKey(a.make, a.model, a.variant),
      make_name: a.make,
      model_name: a.model,
      variant: a.variant,
      release_year: a.year,
      battery_net_wh: null,
      battery_gross_wh: null,
      consumption_wh_per_km: a.consumption_wh_per_km,
      wltp_range_km: a.range_km,
      ac_max_w: null,
      ac_phases: null,
      dc_max_w: null,
      co2_wltp_g_km: a.co2 == null ? null : Math.round(a.co2),
      catalog_price_nl_cents: null,
      registrations_be: a.be,
      registrations_nl: a.nl,
      oem_source_url: null,
      raw: a,
      matched_version_id: null,
      review_status: "new" as const,
      review_notes: a.fuelType === "electric" ? null : `powertrain ${a.fuelType}: phev of erev, handmatig bevestigen`,
    }));
}
