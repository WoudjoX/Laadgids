// EEA CO2-monitoring → spec_candidates met inschrijvingen per variant voor BE en NL.
// Gebruik: pnpm import-eea <bestand.csv> [--year 2025] [--min 5]
// Download het jaarbestand via de EEA Datahub ("CO2 emissions from new passenger cars"). Het bestand is groot; dit script streamt.
import "@/lib/env";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { EeaAggregator, detectSeparator, splitCsvLine, toCandidates } from "@/lib/specs/eea";
import { saveCandidates } from "@/lib/specs/store";

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith("--")) throw new Error("usage: pnpm import-eea <file.csv> [--year 2025] [--min 5]");
  const year = arg("year") ?? path.basename(file).match(/20\d{2}/)?.[0] ?? "unknown";
  const min = Number(arg("min") ?? 1);
  const stat = await fs.stat(file);

  const rl = readline.createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  let agg: EeaAggregator | null = null;
  let sep = ",";
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!agg) {
      sep = detectSeparator(line);
      agg = new EeaAggregator(splitCsvLine(line, sep));
      continue;
    }
    agg.add(splitCsvLine(line, sep));
    if (agg.rowsSeen % 500_000 === 0) console.log(`${agg.rowsSeen.toLocaleString()} rows...`);
  }
  if (!agg) throw new Error("empty file");

  const aggs = agg.values();
  const rows = toCandidates(aggs, `EEA ${year}`, new Date(stat.mtime).toISOString().slice(0, 10), min);
  const res = await saveCandidates("eea", rows);
  const be = aggs.reduce((s, a) => s + a.be, 0);
  const nl = aggs.reduce((s, a) => s + a.nl, 0);
  console.log(`${agg.rowsSeen.toLocaleString()} rows read, ${agg.rowsKept.toLocaleString()} BE/NL electrified (BE ${be.toLocaleString()}, NL ${nl.toLocaleString()})`);
  console.log(`${aggs.length} variants, ${res.count} with at least ${min} registrations → ${res.where}`);
  console.log("Top 15 BE:");
  for (const a of [...aggs].sort((x, y) => y.be - x.be).slice(0, 15)) console.log(`  ${String(a.be).padStart(6)}  ${a.make} ${a.model} ${a.variant ?? ""} (${a.fuelType})`);
  console.log("Next: pnpm review-candidates");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
