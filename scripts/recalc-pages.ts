// Herberekening (CLAUDE.md §8): completeness, status volgens 4.3, last_calculated_at, revalidate.
// Gebruik: pnpm recalc-pages [--dry]
import "@/lib/env";
import { LOCALES, LOCALE_CONFIG, chargerPath, costPath, makePath, rulePath } from "@/lib/copy";
import { RULES, ruleEntityId } from "@/lib/content/rules";
import { getRepo, type PageUpsert } from "@/lib/db";
import { decidePageStatus } from "@/lib/pages/status";

async function main() {
  const dry = process.argv.includes("--dry");
  const repo = await getRepo();
  const [versions, rules, tariffsBE, tariffsNL, existing] = await Promise.all([
    repo.listVersions(),
    repo.listRules(),
    repo.listTariffs("BE", null),
    repo.listTariffs("NL", null),
    repo.listPages(),
  ]);
  const unverified = (country: "BE" | "NL") =>
    [...rules.filter((r) => r.country === country), ...(country === "BE" ? tariffsBE : tariffsNL)].some((r) => /TODO\(verify/.test(r.notes ?? ""));
  const now = new Date().toISOString();
  const rows: PageUpsert[] = [];
  const counts = { index: 0, noindex: 0, draft: 0 };

  for (const v of versions) {
    for (const locale of LOCALES) {
      const country = locale.endsWith("NL") ? "NL" : "BE";
      const d = decidePageStatus(v, locale, "charger_for_model", { unverified: unverified(country) });
      const path = chargerPath(locale, v.slug);
      const prev = existing.find((p) => p.path === path);
      counts[d.status]++;
      rows.push({
        locale,
        template: "charger_for_model",
        entity_id: v.id,
        secondary_id: null,
        path,
        status: d.status,
        completeness_score: d.completeness_score,
        last_calculated_at: now,
        last_published_at: d.status === "index" ? (prev?.last_published_at ?? now) : (prev?.last_published_at ?? null),
      });
      if (d.status !== "index") console.log(`${d.status.padEnd(7)} ${path}  (${d.reasons.join("; ")})`);
      // charging_cost: één pagina per tarief van het land (en gewest) van de locale.
      const cfg = LOCALE_CONFIG[locale];
      const tariffs = (country === "BE" ? tariffsBE : tariffsNL).filter((t) => t.region === null || t.region === cfg.region);
      for (const t of tariffs) {
        const dc = decidePageStatus(v, locale, "charging_cost", { unverified: unverified(country) });
        const cpath = costPath(locale, v.slug, t.slug);
        const cprev = existing.find((p) => p.path === cpath);
        counts[dc.status]++;
        rows.push({
          locale,
          template: "charging_cost",
          entity_id: v.id,
          secondary_id: t.id,
          path: cpath,
          status: dc.status,
          completeness_score: dc.completeness_score,
          last_calculated_at: now,
          last_published_at: dc.status === "index" ? (cprev?.last_published_at ?? now) : (cprev?.last_published_at ?? null),
        });
      }
    }
  }
  // make_hub: één pagina per merk en locale; index zodra een modelpagina van dat merk op index staat.
  for (const locale of LOCALES) {
    const byMake = new Map<number, { make: (typeof versions)[number]["make"]; status: "index" | "noindex" }>();
    for (const v of versions) {
      const st = rows.find((p) => p.template === "charger_for_model" && p.locale === locale && p.entity_id === v.id)?.status;
      if (!st || st === "draft") continue;
      const prev = byMake.get(v.make.id);
      byMake.set(v.make.id, { make: v.make, status: st === "index" || prev?.status === "index" ? "index" : "noindex" });
    }
    for (const { make, status } of byMake.values()) {
      const path = makePath(locale, make.slug);
      const prev = existing.find((p) => p.path === path);
      counts[status]++;
      rows.push({ locale, template: "make_hub", entity_id: make.id, secondary_id: null, path, status, completeness_score: 1, last_calculated_at: now, last_published_at: status === "index" ? (prev?.last_published_at ?? now) : (prev?.last_published_at ?? null) });
    }
  }
  for (const r of RULES) {
    const path = rulePath(r.locale, r.region, r.topic);
    const prev = existing.find((p) => p.path === path);
    counts[r.reviewed ? "index" : "noindex"]++;
    if (!r.reviewed) console.log(`noindex ${path}  (translation not reviewed)`);
    rows.push({
      locale: r.locale,
      template: "rule",
      entity_id: ruleEntityId(r.entity_key),
      secondary_id: null,
      path,
      status: r.reviewed ? "index" : "noindex",
      completeness_score: 1,
      last_calculated_at: now,
      last_published_at: prev?.last_published_at ?? now,
    });
  }
  console.log(counts);
  if (dry) return;
  await repo.upsertPages(rows);

  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (site && secret) {
    try {
      const res = await fetch(`${site}/api/revalidate`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
        // Ook de tag per versie, anders blijft de modelpagina zelf tot 24 uur op de oude specs staan.
      body: JSON.stringify({ tags: ["pages", "versions", "rules:BE", "rules:NL", "tariffs:BE", "tariffs:NL", ...versions.map((v) => `version:${v.slug}`)] }),
      });
      console.log("revalidate:", res.status);
    } catch {
      console.log(`revalidate: ${site} not reachable, skipped (pages are updated; the site refreshes at the next ISR window)`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
