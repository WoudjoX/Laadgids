// Wachtrij doorsturen: leads met status 'new' matchen op de (nieuwe) installateurs en versturen.
// Gebruik: pnpm forward-leads [--dry] [--max-age-days 42]
// Leads ouder dan --max-age-days krijgen status 'expired' en worden niet meer doorgestuurd.
import "@/lib/env";
import { getRepo } from "@/lib/db";
import { matchInstallers } from "@/lib/lead/match";
import { notifyInstallers } from "@/lib/lead/mail";

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

async function main() {
  const dry = process.argv.includes("--dry");
  const maxAgeDays = Number(arg("max-age-days") ?? 42);
  const repo = await getRepo();
  const [pending, installers] = await Promise.all([repo.listPendingLeads(), repo.listActiveInstallers()]);
  const now = Date.now();
  const counts = { forwarded: 0, waiting: 0, expired: 0 };

  for (const lead of pending) {
    const ageDays = Math.floor((now - new Date(lead.created_at).getTime()) / 86_400_000);
    if (ageDays > maxAgeDays) {
      counts.expired++;
      console.log(`expired  #${lead.id} ${lead.postal_code} (${ageDays} d)`);
      if (!dry) await repo.updateLeadStatus(lead.id, "expired");
      continue;
    }
    const matched = matchInstallers(installers, lead.postal_code);
    if (matched.length === 0) {
      counts.waiting++;
      console.log(`waiting  #${lead.id} ${lead.postal_code} (${ageDays} d) — geen installateur`);
      continue;
    }
    counts.forwarded++;
    console.log(`forward  #${lead.id} ${lead.postal_code} → ${matched.map((i) => i.name).join(", ")}`);
    if (!dry) {
      await notifyInstallers(lead, lead.id, matched);
      await repo.markLeadForwarded(
        lead.id,
        matched.map((i) => i.id),
      );
    }
  }
  console.log(`${pending.length} pending: ${counts.forwarded} forwarded, ${counts.waiting} waiting, ${counts.expired} expired${dry ? " (dry run, nothing changed)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
