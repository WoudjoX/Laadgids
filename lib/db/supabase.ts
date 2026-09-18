// Supabase-repo. Leest met de anon key (RLS), schrijft met de service role. Alleen server-side.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PageFilter, PageUpsert, Repo } from "./repo";
import type { Country, InstallerRow, LeadInsert, PageRow, Region, RuleRow, SourceRow, TariffRow, VersionFull, VersionRow } from "./types";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

let anon: SupabaseClient | null = null;
let service: SupabaseClient | null = null;

function readClient(): SupabaseClient {
  if (!anon) anon = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false } });
  return anon;
}

function writeClient(): SupabaseClient {
  if (!service) service = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  return service;
}

const VERSION_SELECT = "*, vehicle:vehicles!inner(*, make:makes!inner(*))";

type VersionJoined = VersionRow & { vehicle: VersionFull["vehicle"] & { make: VersionFull["make"] } };

function unjoin(row: VersionJoined): VersionFull {
  const { vehicle, ...rest } = row;
  const { make, ...veh } = vehicle;
  return { ...rest, vehicle: veh, make };
}

function throwIf<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const supabaseRepo: Repo = {
  async listVersions() {
    const res = await readClient().from("versions").select(VERSION_SELECT).order("slug");
    return throwIf<VersionJoined[]>(res).map(unjoin);
  },
  async getVersionBySlug(slug) {
    const res = await readClient().from("versions").select(VERSION_SELECT).eq("slug", slug).maybeSingle();
    const row = throwIf<VersionJoined | null>(res);
    return row ? unjoin(row) : null;
  },
  async upsertVersions(rows) {
    const res = await writeClient().from("versions").upsert(rows, { onConflict: "slug" }).select("id");
    return throwIf<{ id: number }[]>(res).length;
  },
  async listRules() {
    return throwIf<RuleRow[]>(await readClient().from("rules").select("*"));
  },
  async listTariffs(country: Country, region: Region | null) {
    const q = readClient().from("tariffs").select("*").eq("country", country);
    const res = region ? await q.or(`region.is.null,region.eq.${region}`) : await q.is("region", null);
    return throwIf<TariffRow[]>(res);
  },
  async listPages(filter: PageFilter = {}) {
    let q = readClient().from("pages").select("*");
    if (filter.locale) q = q.eq("locale", filter.locale);
    if (filter.template) q = q.eq("template", filter.template);
    if (filter.status) q = q.in("status", filter.status);
    return throwIf<PageRow[]>(await q.order("path"));
  },
  async getPageByPath(p) {
    return throwIf<PageRow | null>(await readClient().from("pages").select("*").eq("path", p).maybeSingle());
  },
  async upsertPages(rows: PageUpsert[]) {
    const res = await writeClient().from("pages").upsert(rows, { onConflict: "path" }).select("id");
    return throwIf<{ id: number }[]>(res).length;
  },
  async insertLead(lead: LeadInsert) {
    const res = await writeClient().from("leads").insert(lead).select("id").single();
    return throwIf<{ id: number }>(res).id;
  },
  async markLeadForwarded(leadId, installerIds) {
    throwIf(await writeClient().from("leads").update({ forwarded_to: installerIds, status: "forwarded" }).eq("id", leadId));
  },
  async listActiveInstallers() {
    return throwIf<InstallerRow[]>(await writeClient().from("installers").select("*").eq("active", true));
  },
  async listSources() {
    return throwIf<SourceRow[]>(await readClient().from("sources").select("*"));
  },
  async updateSourceChecked(id, date) {
    throwIf(await writeClient().from("sources").update({ last_checked_at: date }).eq("id", id));
  },
};
