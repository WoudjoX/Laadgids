import type { Repo } from "./repo";

export type { Repo, PageFilter, PageUpsert } from "./repo";
export * from "./types";

export function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let repo: Repo | null = null;

/** Supabase als de env gezet is, anders de lokale seed. Beslissing eenmalig per proces. */
export async function getRepo(): Promise<Repo> {
  if (repo) return repo;
  if (hasSupabase()) {
    repo = (await import("./supabase")).supabaseRepo;
  } else {
    repo = (await import("./local")).localRepo;
  }
  return repo;
}
