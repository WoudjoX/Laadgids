// Lokale repo: leest data/seed/*.json, leidt `pages` af met hetzelfde indexatiebeleid als recalc-pages.
// Alleen voor ontwikkeling zonder Supabase. Leads gaan naar .local/leads.jsonl.
import { promises as fs } from "node:fs";
import path from "node:path";
import { LOCALES, chargerPath, rulePath } from "@/lib/copy";
import { RULES, ruleEntityId } from "@/lib/content/rules";
import { decidePageStatus } from "@/lib/pages/status";
import type { PageFilter, PageUpsert, Repo } from "./repo";
import type {
  Country,
  InstallerRow,
  LeadInsert,
  LeadRow,
  MakeRow,
  PageRow,
  Region,
  RuleRow,
  SourceRow,
  TariffRow,
  VehicleRow,
  VersionFull,
  VersionRow,
} from "./types";

const SEED_DIR = path.join(process.cwd(), "data", "seed");
const LOCAL_DIR = path.join(process.cwd(), ".local");

async function readJson<T>(name: string): Promise<T> {
  const raw = await fs.readFile(path.join(SEED_DIR, `${name}.json`), "utf8");
  return JSON.parse(raw) as T;
}

interface Store {
  makes: MakeRow[];
  vehicles: VehicleRow[];
  versions: VersionRow[];
  rules: RuleRow[];
  tariffs: TariffRow[];
  installers: InstallerRow[];
  sources: SourceRow[];
  pages: PageRow[];
}

let storePromise: Promise<Store> | null = null;

async function load(): Promise<Store> {
  if (!storePromise) {
    storePromise = (async () => {
      const [makes, vehicles, versions, rules, tariffs, installers, sources] = await Promise.all([
        readJson<MakeRow[]>("makes"),
        readJson<VehicleRow[]>("vehicles"),
        readJson<VersionRow[]>("versions"),
        readJson<RuleRow[]>("rules"),
        readJson<TariffRow[]>("tariffs"),
        readJson<InstallerRow[]>("installers"),
        readJson<SourceRow[]>("sources"),
      ]);
      const pages = derivePages(versions);
      return { makes, vehicles, versions, rules, tariffs, installers, sources, pages };
    })();
  }
  return storePromise;
}

/** Zelfde beslissing als scripts/recalc-pages.ts, maar in het geheugen. */
function derivePages(versions: VersionRow[]): PageRow[] {
  const now = new Date().toISOString();
  const pages: PageRow[] = [];
  let id = 1;
  for (const r of RULES) {
    pages.push({
      id: id++,
      locale: r.locale,
      template: "rule",
      entity_id: ruleEntityId(r.entity_key),
      secondary_id: null,
      path: rulePath(r.locale, r.region, r.topic),
      status: r.reviewed ? "index" : "noindex",
      completeness_score: 1,
      last_calculated_at: now,
      last_published_at: now,
    });
  }
  for (const v of versions) {
    for (const locale of LOCALES) {
      const d = decidePageStatus(v, locale, "charger_for_model");
      pages.push({
        id: id++,
        locale,
        template: "charger_for_model",
        entity_id: v.id,
        secondary_id: null,
        path: chargerPath(locale, v.slug),
        status: d.status,
        completeness_score: d.completeness_score,
        last_calculated_at: now,
        last_published_at: d.status === "index" ? now : null,
      });
    }
  }
  return pages;
}

function full(s: Store, v: VersionRow): VersionFull {
  const vehicle = s.vehicles.find((x) => x.id === v.vehicle_id);
  if (!vehicle) throw new Error(`vehicle ${v.vehicle_id} missing for version ${v.slug}`);
  const make = s.makes.find((x) => x.id === vehicle.make_id);
  if (!make) throw new Error(`make ${vehicle.make_id} missing for vehicle ${vehicle.slug}`);
  return { ...v, vehicle, make };
}

/** Leest .local/leads.jsonl: elke regel is een insert of een update op id; de laatste regel per id wint. */
async function readLeads(): Promise<LeadRow[]> {
  let raw = "";
  try {
    raw = await fs.readFile(path.join(LOCAL_DIR, "leads.jsonl"), "utf8");
  } catch {
    return [];
  }
  const byId = new Map<number, LeadRow>();
  for (const line of raw.split("\n").filter(Boolean)) {
    const rec = JSON.parse(line) as Partial<LeadRow> & { id: number };
    const prev = byId.get(rec.id);
    const defaults: Partial<LeadRow> = { created_at: new Date(rec.id).toISOString(), forwarded_to: [], status: "new" };
    const merged = { ...defaults, ...prev, ...rec } as LeadRow;
    if (rec.forwarded_to && rec.forwarded_to.length) merged.status = "forwarded";
    byId.set(rec.id, merged);
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

export const localRepo: Repo = {
  async listVersions() {
    const s = await load();
    return s.versions.map((v) => full(s, v));
  },
  async getVersionBySlug(slug) {
    const s = await load();
    const v = s.versions.find((x) => x.slug === slug);
    return v ? full(s, v) : null;
  },
  async upsertVersions(rows) {
    const s = await load();
    for (const r of rows) {
      const i = s.versions.findIndex((x) => x.slug === r.slug);
      if (i >= 0) s.versions[i] = { ...r, id: s.versions[i]!.id };
      else s.versions.push({ ...r, id: Math.max(0, ...s.versions.map((x) => x.id)) + 1 });
    }
    s.pages = derivePages(s.versions);
    return rows.length;
  },
  async listRules() {
    return (await load()).rules;
  },
  async listTariffs(country: Country, region: Region | null) {
    const s = await load();
    return s.tariffs.filter((t) => t.country === country && (t.region === null || t.region === region));
  },
  async listPages(filter: PageFilter = {}) {
    const s = await load();
    return s.pages.filter(
      (p) =>
        (!filter.locale || p.locale === filter.locale) &&
        (!filter.template || p.template === filter.template) &&
        (!filter.status || filter.status.includes(p.status)),
    );
  },
  async getPageByPath(p) {
    const s = await load();
    return s.pages.find((x) => x.path === p) ?? null;
  },
  async upsertPages(rows: PageUpsert[]) {
    const s = await load();
    for (const r of rows) {
      const i = s.pages.findIndex((x) => x.path === r.path);
      if (i >= 0) s.pages[i] = { ...r, id: s.pages[i]!.id };
      else s.pages.push({ ...r, id: Math.max(0, ...s.pages.map((x) => x.id)) + 1 });
    }
    return rows.length;
  },
  async insertLead(lead: LeadInsert) {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    const id = Date.now();
    await fs.appendFile(path.join(LOCAL_DIR, "leads.jsonl"), JSON.stringify({ id, ...lead }) + "\n", "utf8");
    return id;
  },
  async markLeadForwarded(leadId, installerIds) {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    await fs.appendFile(path.join(LOCAL_DIR, "leads.jsonl"), JSON.stringify({ id: leadId, forwarded_to: installerIds }) + "\n", "utf8");
  },
  async listPendingLeads() {
    return (await readLeads()).filter((l) => l.status === "new");
  },
  async updateLeadStatus(leadId, status) {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    await fs.appendFile(path.join(LOCAL_DIR, "leads.jsonl"), JSON.stringify({ id: leadId, status }) + "\n", "utf8");
  },
  async listActiveInstallers() {
    return (await load()).installers.filter((i) => i.active);
  },
  async listSources() {
    return (await load()).sources;
  },
  async updateSourceChecked(id, date) {
    const s = await load();
    const src = s.sources.find((x) => x.id === id);
    if (src) src.last_checked_at = date;
  },
};
