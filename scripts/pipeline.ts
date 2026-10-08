// Verificatiepijplijn (CLAUDE.md §8): fabrikantendocumenten ophalen → cijfers uittrekken → vergelijken met versions → rapport voor Erwin.
// Gebruik:
//   pnpm verify fetch                        alle documenten uit data/sources/oem-documents.json ophalen, vingerafdruk bijwerken
//   pnpm verify extract [--doc id] [--force]     gewijzigde (of alle met --force) documenten uitlezen met Claude (ANTHROPIC_API_KEY)
//   pnpm verify review                       rapport + CSV in data/import/review/
//   pnpm verify run                          de drie stappen na elkaar
// Niets gaat automatisch naar versions: de CSV gaat door Erwin, daarna pnpm import-specs en pnpm recalc-pages.
import "@/lib/env";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getRepo } from "@/lib/db";
import type { VersionFull } from "@/lib/db/types";
import { compareExtraction, renderReport, renderVerificationCsv, sampleForHumanCheck, type AcceptedDiff, type Finding, type VariantAlias } from "@/lib/pipeline/compare";
import { fetchDocument, loadRegistry, loadState, readCachedText, saveState, type DocumentState, type OemDocument } from "@/lib/pipeline/documents";
import { extractFromText, type Extraction } from "@/lib/pipeline/extract";

const EXTRACT_DIR = path.join("data", "pipeline", "extracted");
const REVIEW_DIR = path.join("data", "import", "review");

interface StoredExtraction {
  doc_id: string;
  sha256: string | null;
  extracted_at: string;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  extraction: Extraction;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}
function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

async function cmdFetch(): Promise<void> {
  const docs = await loadRegistry();
  const state = await loadState();
  const counts: Record<string, number> = {};
  for (const doc of docs) {
    const r = await fetchDocument(doc, state[doc.id]);
    state[doc.id] = r.state;
    counts[r.state.status] = (counts[r.state.status] ?? 0) + 1;
    console.log(`${r.state.status.padEnd(11)} ${doc.id}${r.state.pages ? ` (${r.state.pages} p.)` : ""}${r.state.error ? ` — ${r.state.error}` : ""}`);
  }
  // Netwerkguard: is meer dan de helft van de online documenten onbereikbaar, dan ligt het aan dit netwerk, niet aan de bronnen.
  // De toestand wordt dan niet overschreven (anders zou elke rij een valse 'onbereikbaar sinds' krijgen).
  const online = docs.filter((d) => !d.file).length;
  const failed = (counts.unreachable ?? 0) + (counts.blocked ?? 0);
  if (online > 0 && failed > online / 2) {
    throw new Error(`fetch: ${failed} of ${online} online documents unreachable or blocked; this looks like a network restriction, state not saved`);
  }
  await saveState(state);
  console.log("fetch:", counts);
}

async function loadStored(): Promise<Map<string, StoredExtraction>> {
  const out = new Map<string, StoredExtraction>();
  try {
    for (const f of await fs.readdir(EXTRACT_DIR)) {
      if (!f.endsWith(".json")) continue;
      const s = JSON.parse(await fs.readFile(path.join(EXTRACT_DIR, f), "utf8")) as StoredExtraction;
      out.set(s.doc_id, s);
    }
  } catch {
    // nog geen uittreksels
  }
  return out;
}

async function cmdExtract(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error("ANTHROPIC_API_KEY ontbreekt (zet hem in .env.local of in de omgeving); de uittrekstap gebruikt de Claude API");
  }
  const docs = await loadRegistry();
  const state = await loadState();
  const stored = await loadStored();
  const only = arg("doc");
  await fs.mkdir(EXTRACT_DIR, { recursive: true });
  let done = 0;
  let skipped = 0;
  let tokens = { input_tokens: 0, output_tokens: 0 };
  for (const doc of docs) {
    if (only && doc.id !== only) continue;
    const st = state[doc.id];
    if (!st || !st.sha256 || st.status === "unreachable" || st.status === "unsupported") {
      skipped++;
      continue;
    }
    const prev = stored.get(doc.id);
    if (!flag("force") && prev && prev.sha256 === st.sha256) {
      skipped++;
      continue;
    }
    const text = await readCachedText(doc.id);
    if (!text) {
      console.warn(`no cached text for ${doc.id}; run fetch first`);
      continue;
    }
    process.stdout.write(`extract ${doc.id} (${text.length} chars) … `);
    try {
      const r = await extractFromText(doc, text);
      const rec: StoredExtraction = { doc_id: doc.id, sha256: st.sha256, extracted_at: new Date().toISOString(), model: r.model, usage: r.usage, extraction: r.extraction };
      await fs.writeFile(path.join(EXTRACT_DIR, `${doc.id}.json`), JSON.stringify(rec, null, 2), "utf8");
      tokens = { input_tokens: tokens.input_tokens + r.usage.input_tokens, output_tokens: tokens.output_tokens + r.usage.output_tokens };
      done++;
      console.log(`${r.extraction.variants.length} uitvoeringen`);
    } catch (e) {
      console.log(`FOUT: ${(e as Error).message}`);
    }
  }
  console.log(`extract: ${done} documenten gelezen, ${skipped} overgeslagen (ongewijzigd of onbereikbaar), tokens`, tokens);
}

async function loadAccepted(): Promise<AcceptedDiff[]> {
  try {
    return (JSON.parse(await fs.readFile(path.join("data", "sources", "accepted-diffs.json"), "utf8")) as { accepted: AcceptedDiff[] }).accepted;
  } catch {
    return [];
  }
}

async function loadAliases(): Promise<VariantAlias[]> {
  try {
    return (JSON.parse(await fs.readFile(path.join("data", "sources", "variant-aliases.json"), "utf8")) as { aliases: VariantAlias[] }).aliases;
  } catch {
    return [];
  }
}

async function cmdReview(): Promise<void> {
  const docs = await loadRegistry();
  const state = await loadState();
  const stored = await loadStored();
  const repo = await getRepo();
  const versions = (await repo.listVersions()) as VersionFull[];
  const accepted = await loadAccepted();
  const aliases = await loadAliases();
  const findings: Finding[] = [];
  for (const doc of docs) {
    const s = stored.get(doc.id);
    if (!s) continue;
    findings.push(...compareExtraction(doc, state[doc.id], s.extraction, versions, accepted, aliases));
  }
  // Rijen waarvan de bron onbereikbaar is of buiten de registry valt.
  const byUrl = new Map<string, { doc: OemDocument; state: DocumentState | undefined }>();
  for (const doc of docs) byUrl.set(doc.url, { doc, state: state[doc.id] });
  const orphanVersions: { version: VersionFull; reason: string }[] = [];
  for (const v of versions) {
    const hit = byUrl.get(v.spec_source_url);
    if (!hit) orphanVersions.push({ version: v, reason: `bron staat niet in data/sources/oem-documents.json (${v.spec_source_url})` });
    else if (hit.state?.status === "blocked") orphanVersions.push({ version: v, reason: `bron blokkeert geautomatiseerd ophalen (HTTP ${hit.state.http ?? "?"}); geen termijn, wel in de browser nakijken bij de volgende verificatie` });
    else if (hit.state?.status === "unreachable") {
      const since = hit.state.unreachable_since ?? hit.state.fetched_at.slice(0, 10);
      const days = Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000);
      orphanVersions.push({ version: v, reason: `bron onbereikbaar sinds ${since} (${days} dagen, ${hit.state.error ?? "?"}); na 30 dagen noindex (CLAUDE.md §8)${hit.doc.note ? ` — ${hit.doc.note}` : ""}` });
    }
  }
  const actionable = findings.filter((f) => f.kind === "nieuw" || f.kind === "afwijking");
  const date = new Date().toISOString().slice(0, 10);
  const report = renderReport({ date, documents: docs.map((doc) => ({ doc, state: state[doc.id] })), findings, orphanVersions, sample: sampleForHumanCheck(findings.filter((f) => f.kind !== "onvolledig")) });
  await fs.mkdir(REVIEW_DIR, { recursive: true });
  const md = path.join(REVIEW_DIR, `pipeline-${date}.md`);
  const csv = path.join(REVIEW_DIR, `pipeline-${date}.csv`);
  await fs.writeFile(md, report, "utf8");
  await fs.writeFile(csv, renderVerificationCsv(actionable), "utf8");
  const by = (k: Finding["kind"]) => findings.filter((f) => f.kind === k).length;
  console.log(`review: nieuw ${by("nieuw")}, afwijking ${by("afwijking")}, bevestigd ${by("bevestigd")}, onvolledig ${by("onvolledig")}, bronproblemen ${orphanVersions.length}`);
  console.log(`rapport: ${md}\ncsv:     ${csv}`);
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "fetch") await cmdFetch();
  else if (cmd === "extract") await cmdExtract();
  else if (cmd === "review") await cmdReview();
  else if (cmd === "run") {
    await cmdFetch();
    await cmdExtract();
    await cmdReview();
  } else {
    console.error("usage: pnpm verify <fetch|extract|review|run> [--doc id] [--force]");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
