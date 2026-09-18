-- 0002_spec_candidates.up.sql — staging voor open specs (open-ev-data, RDW, EEA).
-- Open data landt hier, nooit rechtstreeks in versions. Promotie gaat via scripts/import-specs.ts met een fabrikantenbron.
create table if not exists spec_candidates (
  id serial primary key,
  source_kind text not null check (source_kind in ('open_ev_data','rdw','eea','vca')),
  source_url text not null,
  source_version text,                  -- bv. 'v1.24.0' of 'RDW 2026-09-10'
  source_date date not null,
  external_id text,                     -- id in de bron
  match_key text not null,              -- genormaliseerd 'make|model|variant'
  make_name text not null,
  model_name text not null,
  variant text,
  release_year int,
  battery_net_wh int,
  battery_gross_wh int,
  consumption_wh_per_km int,
  wltp_range_km int,
  ac_max_w int,
  ac_phases int,                        -- 1, 2 of 3 zoals de bron het geeft; 2 vereist review
  dc_max_w int,
  co2_wltp_g_km int,
  catalog_price_nl_cents int,
  registrations_be int,                 -- EEA
  registrations_nl int,                 -- EEA
  oem_source_url text,                  -- fabrikantenbron volgens de open dataset; suggestie, geen bewijs
  raw jsonb not null,
  matched_version_id int references versions(id),
  review_status text not null default 'new' check (review_status in ('new','matched','conflict','ignored','promoted')),
  review_notes text,
  imported_at timestamptz default now(),
  unique (source_kind, external_id)
);
create index if not exists spec_candidates_match_idx on spec_candidates (match_key);

alter table spec_candidates enable row level security;
-- Geen anon-policy: alleen service role leest en schrijft staging.
