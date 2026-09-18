// Repository-interface. Twee implementaties: Supabase (productie) en lokale seed-JSON (dev zonder env).
import type {
  Country,
  InstallerRow,
  LeadInsert,
  Locale,
  PageRow,
  PageStatus,
  Region,
  RuleRow,
  SourceRow,
  TariffRow,
  Template,
  VersionFull,
  VersionRow,
} from "./types";

export interface PageFilter {
  locale?: Locale;
  template?: Template;
  status?: PageStatus[];
}

export type PageUpsert = Omit<PageRow, "id">;

export interface Repo {
  listVersions(): Promise<VersionFull[]>;
  getVersionBySlug(slug: string): Promise<VersionFull | null>;
  upsertVersions(rows: Omit<VersionRow, "id">[]): Promise<number>;

  listRules(): Promise<RuleRow[]>;
  listTariffs(country: Country, region: Region | null): Promise<TariffRow[]>;

  listPages(filter?: PageFilter): Promise<PageRow[]>;
  getPageByPath(path: string): Promise<PageRow | null>;
  upsertPages(rows: PageUpsert[]): Promise<number>;

  insertLead(lead: LeadInsert): Promise<number>;
  markLeadForwarded(leadId: number, installerIds: number[]): Promise<void>;
  listActiveInstallers(): Promise<InstallerRow[]>;

  listSources(): Promise<SourceRow[]>;
  updateSourceChecked(id: number, date: string): Promise<void>;
}
