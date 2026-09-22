// Herberekening (CLAUDE.md §8): completeness, status volgens 4.3, last_calculated_at, revalidate.
// Gebruik: pnpm recalc-pages [--dry]
import "@/lib/env";
import { LOCALES, chargerPath, rulePath } from "@/lib/copy";
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
    }
  }
  for (const r of RULES) {
    const path = rulePath(r.locale, r.region, r.topic);
    const prev = existing.find((p) => p.path === path);
    counts.index++;
    rows.push({
      locale: r.locale,
      template: "rule",
      entity_id: ruleEntityId(r.entity_key),
      secondary_id: null,
      path,
      status: "index",
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
        body: JSON.stringify({ tags: ["pages", "versions", "rules:BE", "rules:NL", "tariffs:BE", "tariffs:NL"] }),
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
