// open-ev-data-dataset → spec_candidates. Gebruik: pnpm import-open-ev-data data/import/open-ev-data-v1.24.0.json
// Bron: https://github.com/open-ev-data/open-ev-data-dataset (releases). Nooit rechtstreeks naar versions (CLAUDE.md §8).
// Download van de laatste release: pnpm fetch-open-ev-data
import { promises as fs } from "node:fs";
import path from "node:path";
import { openEvDataFile, toCandidate, versionFromFilename } from "@/lib/specs/openEvData";
import { saveCandidates } from "@/lib/specs/store";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: pnpm import-open-ev-data <open-ev-data-vX.Y.Z.json>");
  const parsed = openEvDataFile.parse(JSON.parse(await fs.readFile(file, "utf8")));
  const version = versionFromFilename(path.basename(file)) ?? "unknown";
  const date = parsed.generated_at.slice(0, 10);

  // Ontdubbelen op external_id, zoals de unique-constraint in spec_candidates dat ook doet.
  const byId = new Map<string, ReturnType<typeof toCandidate>>();
  let skipped = 0;
  for (const raw of parsed.vehicles) {
    const c = toCandidate(raw, version, date);
    if (c) byId.set(c.external_id ?? c.match_key, c);
    else skipped++;
  }
  const rows = [...byId.values()].filter((c) => c !== null);
  const duplicates = parsed.vehicles.length - skipped - rows.length;
  if (duplicates > 0) console.log(`${duplicates} duplicate unique_codes collapsed`);
  const res = await saveCandidates("open_ev_data", rows);
  const flagged = rows.filter((r) => r.review_notes).length;
  console.log(`${version} (${date}): ${res.count} candidates → ${res.where}; ${skipped} skipped (no car / invalid); ${flagged} with review notes`);
  console.log("Next: pnpm review-candidates");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
