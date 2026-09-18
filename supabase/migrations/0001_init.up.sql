-- 0001_init.up.sql — datamodel uit CLAUDE.md §5. Idempotent.
-- Geld in eurocent, vermogen in watt, energie in Wh. Nooit floats voor geld.

create table if not exists makes (
  id serial primary key,
  slug text unique not null,
  name text not null
);

create table if not exists vehicles (
  id serial primary key,
  make_id int references makes(id),
  slug text unique not null,
  model text not null,
  generation text,
  powertrain text not null check (powertrain in ('bev','phev','erev')),
  segment text,
  created_at timestamptz default now()
);

create table if not exists versions (
  id serial primary key,
  vehicle_id int references vehicles(id),
  slug text unique not null,
  trim text not null,
  model_year int,
  battery_gross_wh int,
  battery_net_wh int not null,
  wltp_range_km int,
  consumption_wh_per_km int not null,
  ac_max_w int not null,
  ac_phases int not null check (ac_phases in (1,3)),
  dc_max_w int,
  towing_kg int,
  catalog_price_be_cents int,
  catalog_price_nl_cents int,
  co2_wltp_g_km int default 0,
  sold_in text[] default '{}',
  spec_source_url text not null,
  spec_source_date date not null,
  created_at timestamptz default now()
);

create table if not exists rules (
  id serial primary key,
  country text not null,
  region text,
  rule_type text not null,
  valid_from date not null,
  valid_to date,
  params jsonb not null,
  source_url text not null,
  source_checked_at date not null,
  notes text
);
create index if not exists rules_lookup_idx on rules (country, region, rule_type, valid_from);

create table if not exists tariffs (
  id serial primary key,
  country text not null,
  region text,
  slug text not null,
  label jsonb not null,
  price_cents_per_kwh int not null,
  charging_loss_pct numeric default 10,
  source_url text not null,
  source_checked_at date not null,
  notes text,
  unique (country, region, slug)
);

create table if not exists pages (
  id serial primary key,
  locale text not null,
  template text not null,
  entity_id int,
  secondary_id int,
  path text unique not null,
  status text not null default 'draft' check (status in ('draft','noindex','index')),
  completeness_score numeric not null default 0,
  last_calculated_at timestamptz,
  last_published_at timestamptz
);
create index if not exists pages_locale_template_idx on pages (locale, template, status);
create index if not exists pages_entity_idx on pages (template, entity_id, secondary_id);

create table if not exists leads (
  id bigserial primary key,
  created_at timestamptz default now(),
  locale text not null,
  page_path text,
  postal_code text not null,
  connection_type text,
  ampere int,
  desired_power_w int,
  home_older_than_10y boolean,
  company_car boolean,
  email text not null,
  phone text,
  consent_at timestamptz not null,
  forwarded_to int[] default '{}',
  status text default 'new'
);

create table if not exists installers (
  id serial primary key,
  name text not null,
  regions text[] not null,
  contact_email text not null,
  price_per_lead_cents int,
  active boolean default true
);

create table if not exists sources (
  id serial primary key,
  url text unique not null,
  title text,
  last_checked_at date,
  check_interval_days int default 90
);

-- RLS: anon leest alleen wat gepubliceerd is; schrijven gaat via service role.
alter table makes enable row level security;
alter table vehicles enable row level security;
alter table versions enable row level security;
alter table rules enable row level security;
alter table tariffs enable row level security;
alter table pages enable row level security;
alter table leads enable row level security;
alter table installers enable row level security;
alter table sources enable row level security;

drop policy if exists anon_read_makes on makes;
create policy anon_read_makes on makes for select to anon using (true);
drop policy if exists anon_read_vehicles on vehicles;
create policy anon_read_vehicles on vehicles for select to anon using (true);
drop policy if exists anon_read_versions on versions;
create policy anon_read_versions on versions for select to anon using (true);
drop policy if exists anon_read_rules on rules;
create policy anon_read_rules on rules for select to anon using (true);
drop policy if exists anon_read_tariffs on tariffs;
create policy anon_read_tariffs on tariffs for select to anon using (true);
drop policy if exists anon_read_pages on pages;
create policy anon_read_pages on pages for select to anon using (status in ('index','noindex'));
drop policy if exists anon_read_sources on sources;
create policy anon_read_sources on sources for select to anon using (true);
-- leads en installers: geen anon-policy → alleen service role.
