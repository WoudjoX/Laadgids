// EEA CO2-monitoring via de Discodata SQL-endpoint: inschrijvingen per variant voor BE en NL, geaggregeerd op de server.
// Gebruik: pnpm fetch-eea [--table co2cars_2025Pv31] [--min 5]
// Geen download nodig; de tabelnaam staat op de EEA Datahub-pagina onder "SQL Rest Endpoint".
import "@/lib/env";
import { toCandidates, type EeaAggregate } from "@/lib/specs/eea";
import { matchKey } from "@/lib/specs/normalize";
import { saveCandidates } from "@/lib/specs/store";

const ENDPOINT = "https://discodata.eea.europa.eu/sql";
const PAGE = 50_000;

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

interface Row {
  MS: string;
  Mk: string | null;
  Cn: string | null;
  Va: string | null;
  Ft: string;
  Year: number | null;
  co2: number | null;
  wh_km: number | null;
  n: number;
}

async function query(sql: string, page: number): Promise<Row[]> {
  const url = `${ENDPOINT}?query=${encodeURIComponent(sql)}&p=${page}&nrOfHits=${PAGE}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!res.ok) throw new Error(`EEA endpoint ${res.status}`);
  const body = (await res.json()) as { results?: Row[]; errors?: { error: string }[] };
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.error).join("; "));
  return body.results ?? [];
}

function title(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_m, p, c: string) => p + c.toUpperCase());
}

async function main() {
  const table = arg("table") ?? "co2cars_2025Pv31";
  const min = Number(arg("min") ?? 1);
  const year = /(\d{4})/.exec(table)?.[1] ?? "unknown";
  // Ft is kleine letters in de Discodata-tabel; Z (Wh/km) is het elektrisch verbruik, Ewltp de CO2.
  const sql =
    `SELECT MS, Mk, Cn, Va, Ft, Year, [Ewltp (g/km)] AS co2, [Z (Wh/km)] AS wh_km, COUNT(*) AS n ` +
    `FROM [CO2Emission].[latest].[${table}] ` +
    `WHERE MS IN ('BE','NL') AND Ft IN ('electric','petrol/electric','diesel/electric') ` +
    `GROUP BY MS, Mk, Cn, Va, Ft, Year, [Ewltp (g/km)], [Z (Wh/km)]`;
  const rows: Row[] = [];
  for (let p = 1; ; p++) {
    const chunk = await query(sql, p);
    rows.push(...chunk);
    console.log(`page ${p}: ${chunk.length} rows`);
    if (chunk.length < PAGE) break;
  }
  const map = new Map<string, EeaAggregate>();
  for (const r of rows) {
    const make = title(r.Mk ?? "");
    const model = title(r.Cn ?? "");
    if (!make || !model) continue;
    const variant = r.Va?.trim() || null;
    const key = `${matchKey(make, model, variant)}|${r.Ft}|${r.co2 ?? ""}|${r.wh_km ?? ""}`;
    let a = map.get(key);
    if (!a) {
      a = { key, make, model, variant, fuelType: r.Ft, year: r.Year, co2: r.co2, consumption_wh_per_km: r.wh_km == null ? null : Math.round(r.wh_km), range_km: null, be: 0, nl: 0 };
      map.set(key, a);
    }
    if (r.MS === "BE") a.be += r.n;
    else a.nl += r.n;
  }
  const aggs = [...map.values()].sort((a, b) => b.be + b.nl - (a.be + a.nl));
  const candidates = toCandidates(aggs, `EEA ${year} (${table})`, new Date().toISOString().slice(0, 10), min);
  const saved = await saveCandidates("eea", candidates);
  const be = aggs.reduce((s, a) => s + a.be, 0);
  const nl = aggs.reduce((s, a) => s + a.nl, 0);
  console.log(`${rows.length} server rows → ${aggs.length} variants (BE ${be.toLocaleString()}, NL ${nl.toLocaleString()}); ${saved.count} with ≥ ${min} registrations → ${saved.where}`);
  console.log("Top 20 BE (electric):");
  for (const a of aggs.filter((x) => x.fuelType === "electric").sort((x, y) => y.be - x.be).slice(0, 20)) console.log(`  ${String(a.be).padStart(6)}  ${a.make} ${a.model} ${a.variant ?? ""}`);
  console.log("Next: pnpm review-candidates");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
