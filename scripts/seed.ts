// Seed data/seed/*.json naar Supabase (service role). Idempotent via upsert op de natuurlijke sleutel.
// Gebruik: pnpm seed
import "@/lib/env";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "seed", `${name}.json`), "utf8")) as T;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const steps: { table: string; file: string; onConflict: string }[] = [
    { table: "makes", file: "makes", onConflict: "slug" },
    { table: "vehicles", file: "vehicles", onConflict: "slug" },
    { table: "versions", file: "versions", onConflict: "slug" },
    { table: "rules", file: "rules", onConflict: "id" },
    { table: "tariffs", file: "tariffs", onConflict: "country,region,slug" },
    { table: "installers", file: "installers", onConflict: "id" },
    { table: "sources", file: "sources", onConflict: "url" },
  ];
  for (const s of steps) {
    const rows = await readJson<Record<string, unknown>[]>(s.file);
    const { error } = await db.from(s.table).upsert(rows, { onConflict: s.onConflict });
    if (error) throw new Error(`${s.table}: ${error.message}`);
    console.log(`${s.table}: ${rows.length} rows`);
  }
  console.log("Run `pnpm recalc-pages` next.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
