// Bronaudit (CLAUDE.md §8): HEAD-request op alle sources.url; dode links rapporteren.
// Pagina's die van een dode bron afhangen gaan na 30 dagen zonder fix op noindex (handmatig via recalc na fix).
import { getRepo } from "@/lib/db";

async function head(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (res.status === 405) {
      const g = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000) });
      return g.status;
    }
    return res.status;
  } catch {
    return 0;
  }
}

async function main() {
  const repo = await getRepo();
  const sources = await repo.listSources();
  const today = new Date().toISOString().slice(0, 10);
  let dead = 0;
  let stale = 0;
  for (const s of sources) {
    const status = await head(s.url);
    const ok = status >= 200 && status < 400;
    const lastChecked = s.last_checked_at ? new Date(s.last_checked_at) : null;
    const ageDays = lastChecked ? Math.floor((Date.now() - lastChecked.getTime()) / 86_400_000) : Infinity;
    const isStale = ageDays > s.check_interval_days;
    if (!ok) dead++;
    if (isStale) stale++;
    console.log(`${ok ? "ok  " : "DEAD"} ${String(status).padStart(3)} ${isStale ? "STALE" : "     "} ${s.url}`);
    if (ok && process.argv.includes("--touch")) await repo.updateSourceChecked(s.id, today);
  }
  console.log(`\n${sources.length} sources, ${dead} dead, ${stale} stale (older than check_interval_days)`);
  if (dead > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
