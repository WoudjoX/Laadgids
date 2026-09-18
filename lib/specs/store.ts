// Opslag van spec_candidates: Supabase (service role) als de env gezet is, anders data/import/candidates/<kind>.json.
import { promises as fs } from "node:fs";
import path from "node:path";
import { hasSupabase } from "@/lib/db";
import type { SourceKind, SpecCandidate } from "./types";

const LOCAL_DIR = path.join(process.cwd(), "data", "import", "candidates");

export async function saveCandidates(kind: SourceKind, rows: SpecCandidate[]): Promise<{ where: string; count: number }> {
  if (hasSupabase()) {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db.from("spec_candidates").upsert(rows.slice(i, i + 500), { onConflict: "source_kind,external_id" });
      if (error) throw new Error(error.message);
    }
    return { where: "supabase:spec_candidates", count: rows.length };
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const file = path.join(LOCAL_DIR, `${kind}.json`);
  await fs.writeFile(file, JSON.stringify(rows, null, 1), "utf8");
  return { where: path.relative(process.cwd(), file), count: rows.length };
}

export async function loadCandidates(kind?: SourceKind): Promise<SpecCandidate[]> {
  if (hasSupabase()) {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    // PostgREST geeft maximaal 1000 rijen per aanroep: pagineren.
    const out: SpecCandidate[] = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
      let q = db.from("spec_candidates").select("*").order("id").range(from, from + page - 1);
      if (kind) q = q.eq("source_kind", kind);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      out.push(...(data as SpecCandidate[]));
      if (!data || data.length < page) break;
    }
    return out;
  }
  const kinds: SourceKind[] = kind ? [kind] : ["open_ev_data", "rdw", "eea", "vca"];
  const out: SpecCandidate[] = [];
  for (const k of kinds) {
    try {
      out.push(...(JSON.parse(await fs.readFile(path.join(LOCAL_DIR, `${k}.json`), "utf8")) as SpecCandidate[]));
    } catch {
      // geen bestand voor deze bron
    }
  }
  return out;
}
