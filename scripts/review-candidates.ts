// Vergelijkt spec_candidates met versions en schrijft een reviewrapport plus een CSV in het formaat van import-specs.
// Gebruik: pnpm review-candidates [--make tesla] [--out data/import/review]
// De CSV bevat GEEN spec_source_url: die vul je in vanuit de prijslijst voor je pnpm import-specs draait.
import "@/lib/env";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getRepo } from "@/lib/db";
import { bestMatch, diffCandidate, eeaModelMatches, modelKey } from "@/lib/specs/normalize";
import { loadCandidates } from "@/lib/specs/store";
import type { SpecCandidate } from "@/lib/specs/types";

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const makeFilter = arg("make");
  const outDir = arg("out") ?? path.join("data", "import", "review");
  const repo = await getRepo();
  const versions = await repo.listVersions();
  let candidates = await loadCandidates();
  if (makeFilter) candidates = candidates.filter((c) => slugify(c.make_name) === slugify(makeFilter));
  if (candidates.length === 0) throw new Error("no candidates found; run pnpm import-open-ev-data first");

  // EEA-inschrijvingen per merk+model, als prioriteit voor de spec-kandidaten van andere bronnen.
  // De EEA schrijft merk en uitvoering in de modelnaam ("Bmw Ix1 Edrive20"); eeaModelMatches vangt dat op.
  const eeaAggs = candidates.filter((x) => x.source_kind === "eea");
  const hasEea = eeaAggs.length > 0;
  const regCache = new Map<string, { be: number; nl: number }>();
  const regs = (c: SpecCandidate) => {
    const k = modelKey(c.make_name, c.model_name);
    let r = regCache.get(k);
    if (!r) {
      r = { be: 0, nl: 0 };
      for (const e of eeaAggs) {
        if (eeaModelMatches(c.make_name, c.model_name, e.make_name, e.model_name)) {
          r.be += e.registrations_be ?? 0;
          r.nl += e.registrations_nl ?? 0;
        }
      }
      regCache.set(k, r);
    }
    return r;
  };
  candidates = candidates.filter((c) => c.source_kind !== "eea");
  candidates.sort((a, b) => (hasEea ? regs(b).be + regs(b).nl - (regs(a).be + regs(a).nl) : 0) || a.match_key.localeCompare(b.match_key));

  const report: string[] = [];
  const csv: string[] = [
    "vehicle_slug,version_slug,trim,model_year,battery_gross_wh,battery_net_wh,wltp_range_km,consumption_wh_per_km,ac_max_w,ac_phases,dc_max_w,towing_kg,catalog_price_be_cents,catalog_price_nl_cents,co2_wltp_g_km,sold_in,spec_source_url,spec_source_date,oem_source_url_suggested,candidate_source,registrations_be,registrations_nl,review_notes",
  ];
  const counts = { matched: 0, conflict: 0, unmatched: 0 };

  for (const c of candidates) {
    const m = bestMatch(c, versions);
    if (m) {
      const diffs = diffCandidate(m.version, c);
      const conflicts = diffs.filter((d) => d.conflict);
      if (conflicts.length) {
        counts.conflict++;
        report.push(
          `CONFLICT ${m.version.slug} ← ${c.make_name} ${c.model_name} ${c.variant ?? ""} (${c.source_kind} ${c.source_version ?? ""})`,
          ...conflicts.map((d) => `    ${d.field}: versions=${d.version ?? "-"} candidate=${d.candidate ?? "-"}${d.rel != null ? ` (${(d.rel * 100).toFixed(1)} %)` : ""}`),
        );
      } else {
        counts.matched++;
        const info = diffs.filter((d) => !d.conflict && d.rel != null && d.rel > 0.03).map((d) => `${d.field} ${d.version}→${d.candidate}`);
        report.push(`ok       ${m.version.slug} ← ${c.make_name} ${c.model_name} ${c.variant ?? ""}${info.length ? `  [info: ${info.join(", ")}]` : ""}`);
      }
      continue;
    }
    counts.unmatched++;
    csv.push(candidateRow(c, regs(c)));
  }
  if (!hasEea) report.unshift("(geen EEA-inschrijvingen geladen: nieuwe versies zijn alfabetisch, niet op volume; draai pnpm import-eea)", "");

  await fs.mkdir(outDir, { recursive: true });
  const reportFile = path.join(outDir, "report.txt");
  const csvFile = path.join(outDir, "new-versions.csv");
  await fs.writeFile(reportFile, report.join("\n") + "\n", "utf8");
  await fs.writeFile(csvFile, csv.join("\n") + "\n", "utf8");
  console.log(`${candidates.length} candidates: ${counts.matched} ok, ${counts.conflict} conflicts, ${counts.unmatched} new`);
  console.log(`report: ${reportFile}`);
  console.log(`new versions (fill spec_source_url before import-specs): ${csvFile}`);
  const conflictLines = report.filter((l) => l.startsWith("CONFLICT") || l.startsWith("    "));
  if (conflictLines.length) console.log("\n" + conflictLines.slice(0, 40).join("\n") + (conflictLines.length > 40 ? "\n..." : ""));
}

function candidateRow(c: SpecCandidate, regs: { be: number; nl: number }): string {
  const vehicleSlug = slugify(`${c.make_name} ${c.model_name}`);
  const versionSlug = slugify(`${c.make_name} ${c.model_name} ${c.variant ?? ""} ${c.release_year ?? ""}`);
  const phases = c.ac_phases === 1 || c.ac_phases === 3 ? c.ac_phases : "";
  return [
    vehicleSlug,
    versionSlug,
    c.variant ?? "",
    c.release_year ?? "",
    c.battery_gross_wh ?? "",
    c.battery_net_wh ?? "",
    c.wltp_range_km ?? "",
    c.consumption_wh_per_km ?? "",
    c.ac_max_w ?? "",
    phases,
    c.dc_max_w ?? "",
    "",
    "",
    c.catalog_price_nl_cents ?? "",
    c.co2_wltp_g_km ?? 0,
    "",
    "",
    "",
    c.oem_source_url ?? "",
    `${c.source_kind} ${c.source_version ?? ""}`.trim(),
    regs.be || "",
    regs.nl || "",
    c.review_notes ?? "",
  ]
    .map(csvCell)
    .join(",");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
