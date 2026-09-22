// Specs-import (CLAUDE.md §8): CSV per make uit prijslijsten/brochures → Zod → upsert versions.
// Gebruik: pnpm import-specs data/import/<make>.csv
// Kolommen: vehicle_slug,version_slug,trim,model_year,battery_gross_wh,battery_net_wh,wltp_range_km,
//   consumption_wh_per_km,ac_max_w,ac_phases,dc_max_w,towing_kg,catalog_price_be_cents,catalog_price_nl_cents,
//   co2_wltp_g_km,sold_in,spec_source_url,spec_source_date
// Lege cellen blijven leeg (null). Niet raden; completeness regelt de rest.
import "@/lib/env";
import { promises as fs } from "node:fs";
import { z } from "zod";
import { getRepo } from "@/lib/db";

const optInt = z
  .string()
  .trim()
  .transform((s) => (s === "" ? null : Number(s)))
  .pipe(z.number().int().nonnegative().nullable());

const row = z.object({
  vehicle_slug: z.string().min(1),
  version_slug: z.string().min(1),
  trim: z.string().min(1),
  model_year: optInt,
  battery_gross_wh: optInt,
  battery_net_wh: z.coerce.number().int().positive(),
  wltp_range_km: optInt,
  consumption_wh_per_km: z.coerce.number().int().positive(),
  ac_max_w: z.coerce.number().int().positive(),
  ac_phases: z.coerce.number().pipe(z.union([z.literal(1), z.literal(3)])),
  dc_max_w: optInt,
  towing_kg: optInt,
  catalog_price_be_cents: optInt,
  catalog_price_nl_cents: optInt,
  co2_wltp_g_km: z.coerce.number().int().nonnegative().default(0),
  sold_in: z
    .string()
    .transform((s) => s.split("|").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.enum(["BE", "NL"]))),
  spec_source_url: z.url(),
  spec_source_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: pnpm import-specs <file.csv>");
  const repo = await getRepo();
  const vehicles = new Map((await repo.listVersions()).map((v) => [v.vehicle.slug, v.vehicle.id]));
  const parsed = parseCsv(await fs.readFile(file, "utf8")).map((r, i) => {
    const res = row.safeParse(r);
    if (!res.success) throw new Error(`row ${i + 2}: ${res.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
    return res.data;
  });
  const rows = parsed.map((r) => {
    const vehicle_id = vehicles.get(r.vehicle_slug);
    if (!vehicle_id) throw new Error(`unknown vehicle_slug ${r.vehicle_slug}; add it to vehicles first`);
    const { vehicle_slug: _v, version_slug, ...rest } = r;
    void _v;
    return { ...rest, slug: version_slug, vehicle_id };
  });
  const n = await repo.upsertVersions(rows);
  console.log(`upserted ${n} versions. Run pnpm recalc-pages.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
