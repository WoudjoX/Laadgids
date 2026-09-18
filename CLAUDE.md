# Laadgids — pSEO product voor thuisladen en EV-fiscaliteit in de Benelux

> Dit bestand is de bron van waarheid voor Claude Code. Lees het volledig voor je iets bouwt.
> Werktaal: Nederlands. Code, commits en identifiers: Engels.
> Eigenaar: Erwin (SaasSolutions BV). Datum spec: 9 september 2026.

---

## 0. In één alinea

We bouwen een programmatische SEO-site die per EV-model, per tarief en per gewest berekende antwoorden geeft over thuisladen en de fiscaliteit van elektrisch rijden, in drie locales (nl-BE, fr-BE, nl-NL). De site verdient geld met installateursleads voor thuisladers, energiecontract-switches (dynamisch tarief) en in tweede instantie zonnepanelen/thuisbatterij en private lease. Het product is geen contentblog en geen specs-database: elke pagina bestaat omdat er een berekening op staat die elders niet in die vorm bestaat. Pagina's zonder eigen berekening of zonder zoekvraag worden niet geïndexeerd.

---

## 1. Marktcontext (onderzoek september 2026)

Dit is waarom de keuzes hieronder zijn wat ze zijn. Niet herbespreken, wel actualiseren als de feiten veranderen.

### België
- BEV-aandeel nieuwe inschrijvingen H1 2026: ~36%. Bijna 7 van de 10 nieuwe EV's worden door bedrijven ingeschreven; particulieren zitten op ~10% EV. **De bedrijfswagenrijder is het hoofdpubliek**, niet de particuliere koper.
- Tweedehands-BEV groeit hard (+42% in H1 2026), helft komt uit leasevloten. Ex-lease EV's zijn een komende golf (fase 3).
- **Geen premies meer** voor particuliere thuisladers in 2026: federale belastingvermindering gestopt 31/08/2024, geen Vlaamse Fluvius-premie, geen Waalse of Brusselse premie. Wat rest: 6% btw (woning >10 jaar, professionele installatie, in/aan de woning), sporadische gemeentelijke premies, bedrijfsfiscaliteit (investeringsaftrek). Meldingsplicht bij netbeheerder (Fluvius / ORES / RESA / Sibelga).
- **Veel concurrenten publiceren foute premie-info** (oude belastingvermindering, niet-bestaande Waalse premie van €1.500). Correctheid is een concurrentievoordeel; elke fiscale claim krijgt een bron en een datum.
- **Capaciteitstarief Vlaanderen**: 52–60 €/kW/jaar op basis van de hoogste kwartierpiek per maand, minimum 2,5 kW. Een 11 kW-lader die samenvalt met kookplaat/warmtepomp verhoogt de piek. Dit is het belangrijkste rekenpunt dat concurrenten niet per model uitwerken.
- **Dynamische contracten**: aanbod verdubbeld naar ~30 producten in 2026, marktaandeel nog ~0,4%. Digitale meter is voorwaarde. Leveranciers o.a. Engie, Luminus, Eneco, Bolt, DATS 24, Mega, Frank Energie, Octa+. Luminus geeft €130 cashback op nieuwe dynamische contracten: er is acquisitiebudget, dus affiliate-deals zijn haalbaar.
- CREG-tarief voor terugbetaling thuisladen bij bedrijfswagens (sinds 2025): relevant voor het bedrijfswagenpubliek.
- EV-aftrekbaarheid voor vennootschappen bouwt af voor aankopen vanaf 2027 (richting 67,5% in 2031). **Exacte percentages per jaar verifiëren bij FOD Financiën** en als versioneerde data opslaan, nooit hardcoden.

### Nederland
- Bijtelling EV: 2026 18% over de eerste €30.000 (22% erboven), 2027 20%, vanaf 2028 uniform 22%. Percentage staat 60 maanden vast vanaf eerste registratie. Rekenpagina's per model per registratiejaar zijn dus zinvol.
- Salderingsregeling stopt in 2027. Dat maakt "laadpaal + thuisbatterij + slim laden" de geldvraag in NL.
- ISDE-subsidie thuislader 2026: max €200 voor slimme/bidirectionele laadpaal (verifiëren).
- **Markt is bezet**: ev-subsidie.nl, energiefinder.nl, laadpaal-gids.nl, trustoo.nl doen al installateurs-leadgen. NL-NL is daarom locale nummer 3, niet 1.

### EREV
- Segment is klein (Leapmotor C10 REEV, B10 REEV, enkele aankondigingen). Geen zoekvolume van betekenis in 2026. **Geen eigen pSEO-as.** Wel: één hubgids + fiscale vergelijking EREV vs PHEV vs BEV per land. Doel is positie in de twijfelaarsvraag ("ik moet trekken / lang rijden"), niet omzet.

### Concurrentie die al bestaat (niet kopiëren, wel monitoren)
- nl-BE: laadthuis.be, laadpaalkiezen.be, bobex.be, evme.be, zen-zonne-energie.be, dieterenenergy.be
- fr-BE: lisaenergie.be, neocompare.be, 300000km.be
- nl-NL: laadpaal-gids.nl, energiefinder.nl, ev-subsidie.nl
- energie: selectra.be, mijndynamischtarief.be, test-aankoop.be

Geen van deze heeft **per model** berekende laadadviezen, en geen enkele combineert model + tarief + gewest. Dat is het gat.

---

## 2. Positionering en scope

- **Publiek**: bestuurders van (elektrische) bedrijfswagens en particuliere EV-kopers die thuis willen laden; secundair HR/fleet-verantwoordelijken die car policy en laadvergoeding opstellen.
- **Belofte**: "Het juiste laadadvies voor jouw auto, jouw meter en jouw gewest, met de cijfers erbij."
- **Locales**, in volgorde van bouw: `nl-BE` → `fr-BE` → `nl-NL`. Elke locale heeft eigen regels, eigen tarieven en eigen copy; het is geen vertaling maar een aparte regelset op dezelfde motor.
- **Buiten scope** (nu): publieke laadpalen zoeken, specs-vergelijkingen model vs model, autoverzekering, occasionadvertenties, EREV als volwaardige as.

---

## 3. Businessmodel en conversiepunten

Volgorde van waarde per bezoeker. Elke geldpagina heeft minstens punt 1 en 2.

| # | Stroom | Mechanisme | Waar op de pagina |
|---|--------|-----------|-------------------|
| 1 | Installateurslead thuislader | Eigen leadformulier (postcode + vermogen + fase), lead doorgestuurd naar 2–3 installateurs uit eigen bestand; directe deal per lead, niet via CPL-netwerk | Onder het laadadvies |
| 2 | Energiecontract (dynamisch) | Affiliate via Daisycon / directe deal met leverancier; CTA na de kostenvergelijking | Onder de laadkosten |
| 3 | Zonnepanelen / thuisbatterij | Lead-gen partner; alleen op pagina's met NL-saldering of BE-injectie-context | Fase 2 |
| 4 | Private lease / zakelijke lease | Affiliate (NL vooral); op fiscale rekenpagina's | Fase 2 |
| 5 | Laadpaal-hardware | Affiliate (bol, Coolblue, fabrikant); ondergeschikt aan lead | Fase 2 |

**Niet doen**: generieke CPL-campagnes van €5–10 per lead als hoofdinkomen; display-ads voor je >50k sessies/maand hebt; verzekering.

Leadkwaliteit boven volume: het formulier vraagt postcode, huidig aansluitingstype (1F/3F, ampèrage indien bekend), gewenst vermogen, woningleeftijd (voor 6% btw) en of het een bedrijfswagen is. Die velden zijn ook de reden dat installateurs meer betalen.

---

## 4. Content-architectuur

### 4.1 Templates (geldpagina's eerst)

| Prioriteit | Template | URL-patroon (nl-BE) | Berekening die de pagina uniek maakt | Conversie |
|-----------|----------|---------------------|--------------------------------------|-----------|
| P1 | Laadpaal per model | `/laadpaal-voor/{make}-{model}[-{trim}]` | Max AC-vermogen auto vs 1F/3F/vermogen paal; laadtijd per aansluiting; piekimpact capaciteitstarief; advies "welk vermogen wel/niet" | Lead + energie |
| P1 | Laadkosten per model per tarief | `/laadkosten/{make}-{model}/{tarief-slug}` | €/100 km en €/volle lading per tariefscenario incl. laadverlies en capaciteitstarief; jaarbesparing dynamisch vs vast | Energie + lead |
| P2 | Fiscaal per model per jaar (BE: VAA; NL: bijtelling) | `/vaa/{make}-{model}/{jaar}` en `/bijtelling/{make}-{model}/{jaar}` | Berekening uit catalogusprijs + regeljaar; netto maandimpact | Lease + autoriteit |
| P2 | Gewest-/regelpagina's | `/regels/{gewest}/{onderwerp}` (btw-6, melding-netbeheerder, appartement-vme, capaciteitstarief, creg-tarief) | Geen berekening; wel hub met bronnen + datum; linkt naar alle P1's | Autoriteit |
| P3 | Tweedehands-EV batterij | `/tweedehands/{make}-{model}/batterij` | Verwachte SoH per leeftijd/km-range; garantiedrempel; wat te checken | Batterijcheck-affiliate |
| P3 | Installateurs per gemeente | `/laadpaal-installateur/{gemeente}` | **Alleen bouwen als er ≥3 gecontracteerde installateurs in de regio zijn**; anders niet publiceren | Lead |
| hub | EREV | `/erev/` + `/erev/fiscaal-{land}` | Handgeschreven; 3–5 pagina's | Autoriteit |

Locale-specifieke slugs: `fr-BE` gebruikt `/borne-pour/`, `/cout-recharge/`, `/atn/` (avantage de toute nature), `/regles/`. `nl-NL` gebruikt `/laadpaal-voor/`, `/laadkosten/`, `/bijtelling/`, `/regels/`.

### 4.2 Pagina-anatomie van een P1-pagina (vaste volgorde)

1. Breadcrumb
2. H1 als vraag ("Welke laadpaal voor een {model}?")
3. Datum bijgewerkt + gewest-indicator
4. **Kort antwoord** (2–4 zinnen, gegenereerd uit de rekenlogica, bevat de conclusie en de belangrijkste waarschuwing)
5. 3 metric cards (max AC-vermogen, batterij, laadtijd op aanbevolen aansluiting)
6. Laadtijdtabel per aansluiting, met de rij "aanbevolen" en de rij "geen winst" waar van toepassing
7. Kostenblok (vast dag / vast nacht / dynamisch slim) + jaarverschil bij 12.000 km → energie-CTA
8. Piekblok (alleen Vlaanderen): impact op capaciteitstarief bij 7,4 / 11 kW met en zonder load balancing
9. Leadblok installateur (postcode-formulier)
10. Bedrijfswagenblok (alleen BE): CREG-tarief en MID-meter, 2 zinnen + link naar regelpagina
11. FAQ (3–5 vragen, gegenereerd uit dezelfde data, geen boilerplate)
12. Interne links: zustermodellen (zelfde segment), laadkosten-pagina van dit model, 2 regelpagina's van het gewest
13. Bronnenblok met datum per bron

Wat een pagina **nooit** bevat: WLTP-marketingtekst, herschreven fabrikantenproza, "in dit artikel bespreken we", generieke uitleg over wat een laadpaal is.

### 4.3 Indexatiebeleid (kwaliteitspoort)

Een pagina krijgt `index` alleen als:
- alle vereiste velden voor de berekening aanwezig zijn (zie `pages.completeness_score` = 1.0);
- de berekende output afwijkt van de "default" (bv. een auto met 11 kW AC krijgt een ander advies dan een auto met 7,4 kW; als alle velden op de default staan, is de pagina niet onderscheidend);
- het model in de locale verkocht wordt of werd (veld `versions.sold_in`).

Anders: `noindex,follow` en wel in de interne linking, niet in de sitemap. Dit is bewust: bij pSEO is niet-publiceren even belangrijk als publiceren.

---

## 5. Datamodel (Supabase / Postgres)

Alle tabellen in schema `public`. RLS aan; anon heeft alleen `select` op gepubliceerde rijen. Alle geldbedragen in eurocent (`integer`), alle vermogens in watt (`integer`), energie in Wh (`integer`). Nooit floats voor geld.

```sql
-- Voertuigen
create table makes (
  id serial primary key,
  slug text unique not null,
  name text not null
);

create table vehicles (
  id serial primary key,
  make_id int references makes(id),
  slug text unique not null,            -- "tesla-model-3"
  model text not null,
  generation text,
  powertrain text not null check (powertrain in ('bev','phev','erev')),
  segment text,                          -- "d-suv", "c-hatch"
  created_at timestamptz default now()
);

create table versions (
  id serial primary key,
  vehicle_id int references vehicles(id),
  slug text unique not null,            -- "tesla-model-3-rwd-2025"
  trim text not null,
  model_year int,
  battery_gross_wh int,
  battery_net_wh int not null,
  wltp_range_km int,
  consumption_wh_per_km int not null,   -- WLTP gecombineerd
  ac_max_w int not null,                -- bv. 11000
  ac_phases int not null check (ac_phases in (1,3)),
  dc_max_w int,
  towing_kg int,
  catalog_price_be_cents int,
  catalog_price_nl_cents int,
  co2_wltp_g_km int default 0,
  sold_in text[] default '{}',          -- '{BE,NL}'
  spec_source_url text not null,
  spec_source_date date not null,
  created_at timestamptz default now()
);

-- Regels, versioneerd per land/gewest/jaar. NOOIT hardcoden in code.
create table rules (
  id serial primary key,
  country text not null,                -- 'BE' | 'NL'
  region text,                          -- 'VLA' | 'WAL' | 'BRU' | null
  rule_type text not null,              -- 'vaa','deductibility','bijtelling','vat_reduced','capacity_tariff','isde','creg_tariff'
  valid_from date not null,
  valid_to date,
  params jsonb not null,                -- vrije parameters, zie 6.x
  source_url text not null,
  source_checked_at date not null,
  notes text
);

-- Tariefscenario's voor laadkosten
create table tariffs (
  id serial primary key,
  country text not null,
  region text,
  slug text not null,                   -- 'vast-dag','vast-nacht','dynamisch-slim','zonnepanelen'
  label jsonb not null,                 -- {"nl":"...","fr":"..."}
  price_cents_per_kwh int not null,     -- all-in, gemiddeld
  charging_loss_pct numeric default 10,
  source_url text not null,
  source_checked_at date not null,
  unique (country, region, slug)
);

-- Gepubliceerde pagina's: de sturingslaag
create table pages (
  id serial primary key,
  locale text not null,                 -- 'nl-BE','fr-BE','nl-NL'
  template text not null,               -- 'charger_for_model','charging_cost','vaa','bijtelling','rule','used_battery','installer_city'
  entity_id int,                        -- versions.id / tariffs.id / ...
  secondary_id int,
  path text unique not null,
  status text not null default 'draft' check (status in ('draft','noindex','index')),
  completeness_score numeric not null default 0,
  last_calculated_at timestamptz,
  last_published_at timestamptz
);

-- Leads
create table leads (
  id bigserial primary key,
  created_at timestamptz default now(),
  locale text not null,
  page_path text,
  postal_code text not null,
  connection_type text,                 -- '1F','3F','unknown'
  ampere int,
  desired_power_w int,
  home_older_than_10y boolean,
  company_car boolean,
  email text not null,
  phone text,
  consent_at timestamptz not null,
  forwarded_to int[] default '{}',      -- installers.id
  status text default 'new'
);

create table installers (
  id serial primary key,
  name text not null,
  regions text[] not null,              -- postcode-prefixen of gewesten
  contact_email text not null,
  price_per_lead_cents int,
  active boolean default true
);

-- Bronnen en freshness
create table sources (
  id serial primary key,
  url text unique not null,
  title text,
  last_checked_at date,
  check_interval_days int default 90
);
```

Regels voor het datamodel:
- **Elke feitelijke rij heeft een `source_url` en een datum.** Geen bron → geen rij.
- Specs komen uit fabrikantenprijslijsten/brochures (publiek). **Niet scrapen van EV Database of vergelijkbare databases.**
- `rules.params` is vrij, maar elk `rule_type` heeft een gedocumenteerd JSON-schema in `lib/rules/schemas.ts` met Zod-validatie.

---

## 6. Rekenlogica (`lib/calc/`)

Pure functies, geen I/O, 100% unit-tested. Input = rijen uit het datamodel, output = getypeerde objecten die de templates renderen. Alle outputs afgerond op het moment van renderen, niet in de berekening.

### 6.1 `chargeTime(version, connection)`
```
effective_w = min(version.ac_max_w, connection.max_w)
if connection.phases == 1 and version.ac_phases == 3: effective_w = min(effective_w, 7400)
if connection.phases == 3 and version.ac_phases == 1: effective_w = min(effective_w, 7400)  -- 1F-auto op 3F-paal laadt alsnog 1F
energy_needed_wh = version.battery_net_wh * (to_pct - from_pct) / 100 / (1 - charging_loss)
seconds = energy_needed_wh / effective_w * 3600
```
Connecties: `socket_2300`, `1f_16a_3700`, `1f_32a_7400`, `3f_16a_11000`, `3f_32a_22000`. Markeer een connectie als `no_gain: true` als `effective_w` gelijk is aan die van de vorige, goedkopere connectie.

### 6.2 `advice(version, region)`
Beslisboom die het "Kort antwoord" en de aanbevolen rij bepaalt:
1. Aanbevolen vermogen = kleinste connectie waarbij `effective_w == version.ac_max_w`.
2. Als `version.ac_phases == 1` (bv. 7,4 kW-auto's): waarschuw dat 3F-paal geen tijdwinst geeft maar wel toekomstvast is.
3. Als `version.ac_max_w >= 11000` en `region == 'VLA'`: voeg piekwaarschuwing toe en bereken `capacityImpact` (6.3).
4. Als batterij < 45 kWh: noem expliciet dat 7,4 kW meestal volstaat voor een nacht.
5. Output: `{ recommended_connection, reasons: string[], warnings: string[] }`. Copy komt uit `lib/copy/{locale}.ts` met placeholders; nooit vrije tekst genereren in de calc-laag.

### 6.3 `capacityImpact(version, rule:capacity_tariff, household_baseline_w)`
```
peak_without = household_baseline_w                      -- default 3500 W, param
peak_with = household_baseline_w + charger_w             -- charger_w = 7400 of 11000
peak_with_lb = max(household_baseline_w, charger_w)      -- load balancing: laden past zich aan
cost = (peak_kw - min_kw) * eur_per_kw_year   (nooit < 0; min_kw uit rule, 2.5)
```
Output per scenario (zonder / met load balancing) in €/jaar. Dit blok alleen renderen voor `region == 'VLA'` zolang alleen Vlaanderen een capaciteitstarief heeft; controleer `rules` voor WAL/BRU.

### 6.4 `chargingCost(version, tariff, km_per_year)`
```
wh_per_km_real = consumption_wh_per_km * 1.15              -- realiteitsfactor, param
wh_charged = wh_per_km_real * km / (1 - charging_loss_pct/100)
cost_cents = wh_charged / 1000 * price_cents_per_kwh
full_charge_cents = battery_net_wh / 1000 / (1 - loss) * price
```
Render als €/100 km, €/volle lading, €/jaar; verschil t.o.v. `vast-dag` als besparing.

### 6.5 `vaaBE(version, rule:vaa, year)` — België, voordeel alle aard
Structuur (parameters uit `rules.params`, **verifiëren bij FOD Financiën per aanslagjaar**):
```
co2_pct = max(rule.min_pct, rule.base_pct + (co2 - rule.ref_co2) * rule.step_pct)   -- EV: co2=0 → min_pct (4%)
age_coeff = per leeftijdsjaar van de wagen (rule.age_table)
vaa_year = max(catalog_price * 6/7 * co2_pct * age_coeff, rule.min_vaa_cents)
```
Output: VAA bruto per jaar en per maand + indicatieve netto-impact bij marginale voet (param, default 50%).

### 6.6 `bijtellingNL(version, rule:bijtelling, registration_year)`
```
capped = min(catalog_price, rule.cap_cents)                -- 3.000.000 cent
bijtelling = capped * rule.low_pct + (catalog_price - capped) * rule.high_pct
```
2026: low 18%, 2027: 20%, 2028+: 22% flat (uit `rules`, niet uit code). Toon netto per maand bij 37% en 49,5% (params).

### 6.7 `deductibilityBE(version, rule:deductibility, purchase_year)`
Percentage aftrekbaarheid voor vennootschappen op basis van aankoopjaar en powertrain. Alleen tonen op VAA-pagina's en bedrijfswagenblok. Waarden uit `rules`.

### 6.8 `completeness(version, template)`
Geeft 0–1: fractie van de vereiste velden voor dat template dat ingevuld is. Sturend voor `pages.status`.

---

## 7. Technische architectuur

- **Stack**: Next.js 15+ App Router, TypeScript strict, Tailwind, Supabase (Postgres + RLS), Vercel, Resend (leadmails), n8n (data-pipelines), Zod overal aan de randen.
- **Rendering**: alle pSEO-pagina's via `generateStaticParams` + ISR (`revalidate: 86400`). Bij een wijziging in `rules` of `tariffs` een on-demand revalidate van alle afhankelijke paden (tag-based: `revalidateTag('rule:BE:VLA:capacity_tariff')`).
- **Routing en i18n**: `app/[locale]/...` met `locale ∈ {nl-BE, fr-BE, nl-NL}`. Middleware zet locale op basis van pad, nooit op basis van Accept-Language redirect (SEO-gif). Domeinstrategie: één domein met locale-prefix (`/nl-be/`, `/fr-be/`, `/nl-nl/`). Geen aparte ccTLD's in fase 1.
- **hreflang**: centrale helper `lib/seo/alternates.ts` die voor elk pad de equivalente paden in de andere locales opzoekt via `pages` (zelfde `template` + `entity_id`). Genereert `<link rel="alternate" hreflang="nl-BE|fr-BE|nl-NL|x-default">`. **Unit-test verplicht**: geen pagina mag naar een niet-bestaande locale-variant verwijzen; `nl-BE` en `nl-NL` moeten met regio-code, nooit als kaal `nl`. `og:locale` volgt dezelfde helper. Dit was het probleem op autovalet.be; het mag hier niet opnieuw gebeuren.
- **Sitemaps**: `app/sitemap.ts` genereert een index met één sitemap per `(locale, template)`, alleen `status='index'`, max 5.000 URL's per bestand. `lastmod` = `pages.last_calculated_at`.
- **Robots**: `noindex` via `<meta>` én `X-Robots-Tag` voor `status='noindex'`. Draft-pagina's zijn 404 in productie.
- **Structured data**: `FAQPage` op elke pagina met FAQ-blok; `BreadcrumbList` overal; `Product`/`Vehicle` niet gebruiken (geen aanbod). Geen `AggregateRating`.
- **Interne linking**: `lib/seo/related.ts` levert per pagina deterministisch 4–8 links (zelfde segment, zelfde make, laadkosten-tegenhanger, 2 regelpagina's). Geen random.
- **Leadflow**: server action → Zod → insert `leads` → match `installers` op postcode → Resend naar installateurs + bevestiging naar lead → status update. Rate-limit op IP. Honeypot-veld. Dubbele opt-in niet nodig (transactioneel), wel expliciete consent-checkbox met timestamp.
- **Analytics**: Plausible of Umami (privacy, geen cookiebanner nodig). Events: `lead_submitted`, `energy_cta_click`, `calc_interaction`. Search Console per locale-prefix als aparte property.
- **Performance**: geen client-JS op pSEO-pagina's behalve het leadformulier en de optionele km-slider. LCP-doel < 1,5 s op mobiel.

Mappenstructuur:
```
app/[locale]/(pseo)/laadpaal-voor/[slug]/page.tsx
app/[locale]/(pseo)/laadkosten/[slug]/[tariff]/page.tsx
app/[locale]/(pseo)/vaa/[slug]/[year]/page.tsx
app/[locale]/(hub)/regels/[region]/[topic]/page.tsx
app/[locale]/(hub)/erev/...
app/api/revalidate/route.ts
lib/calc/            -- pure functies + tests
lib/rules/           -- Zod-schema's per rule_type, loaders
lib/copy/            -- locale-copy met placeholders
lib/seo/             -- alternates, related, sitemap-helpers
lib/db/              -- typed Supabase queries
supabase/migrations/
scripts/             -- import-specs, recalc-pages, audit-sources
```

---

## 8. Data-pipelines

- **Specs import** (`scripts/import-specs.ts`): leest een handmatig samengestelde CSV per make (uit prijslijsten/brochures), valideert met Zod, upsert in `versions`. Elke rij vereist `spec_source_url` en `spec_source_date`. Bij twijfel over een veld: veld leeg laten, niet raden; `completeness` regelt de rest.
- **Regels** worden **handmatig** ingevoerd via een migratie of seed-script, nooit door een LLM gegenereerd. Elke regel heeft `source_checked_at`. Een n8n-flow herinnert 30 dagen voor `valid_to` of 90 dagen na `source_checked_at`.
- **Tarieven** kwartaallijks bijwerken uit CREG-boordtabel (BE) en ACM/CBS of leveranciersgemiddelde (NL). Datum in de pagina tonen.
- **Herberekening** (`scripts/recalc-pages.ts`): draait na elke data-wijziging, zet `completeness_score`, bepaalt `status` volgens 4.3, zet `last_calculated_at`, triggert revalidate.
- **Bronaudit** (`scripts/audit-sources.ts`): HEAD-request op alle `sources.url`; dode links rapporteren, pagina's die van die bron afhangen op `noindex` na 30 dagen zonder fix.

LLM-gebruik in pipelines is toegestaan voor **extractie** van specs uit brochures (met verplichte menselijke steekproef van 10%), **niet** voor het schrijven van pagina-copy en **niet** voor regels of tarieven.

---

## 9. Fasering en acceptatiecriteria

### Fase 0 — Validatie (voor er code is)
- [ ] 3 installateurs in Oost-Vlaanderen gebeld: wat betalen ze per gekwalificeerde lead? Doel ≥ €40. Zo niet: energiecontract wordt hoofdinkomen en template P1 verschuift naar laadkosten.
- [ ] Zoekvolume-check nl-BE en fr-BE op 20 modelnamen × {laadpaal, laadkosten, borne, coût recharge}. Doel: aantoonbaar volume op ≥ 50% van de combinaties.
- [ ] Affiliate-aanmelding Daisycon (energie) en contact met 2 leveranciers voor directe deal.
- [ ] Regels-tabel gevuld voor BE (VLA/WAL/BRU) en NL voor 2026, elk met bron en datum.

### Fase 1 — nl-BE, template P1 (6 weken)
- [ ] 120–200 `versions` met `completeness = 1.0` voor `charger_for_model`.
- [ ] 6 regelpagina's (btw-6, melding, appartement, capaciteitstarief, CREG-tarief, 1F-vs-3F).
- [ ] Leadflow live, minstens 3 installateurs gecontracteerd in ≥ 2 provincies.
- [ ] hreflang-tests groen, sitemap gesegmenteerd, Search Console gekoppeld.
- **Stopcriterium na 8 weken indexatie**: < 60% van de `index`-pagina's geïndexeerd → eerst uitzoeken waarom, niet meer pagina's bijbouwen.

### Fase 2 — laadkosten + fr-BE (6 weken)
- [ ] Template `charging_cost` voor alle P1-modellen × 4 tarieven.
- [ ] fr-BE volledig voor P1 + regels, met Waalse/Brusselse netbeheerders en regels.
- [ ] Energie-CTA met tracking; eerste affiliate-omzet.
- [ ] VAA-pagina's voor top-50 modellen.

### Fase 3 — nl-NL + tweedehands (8 weken)
- [ ] nl-NL met bijtelling, ISDE, saldering-context; thuisbatterij-partner.
- [ ] `used_battery`-template voor de 30 meest verhandelde ex-lease-modellen.
- [ ] Installateurspagina's per gemeente waar ≥ 3 installateurs actief zijn.

### Fase 4 — product
- Interactieve rekenmodule (km, meter, gewest, zonnepanelen) als lead magnet en mogelijk B2B-widget voor installateurs/leasemaatschappijen. Pas na aantoonbare leadomzet.

---

## 10. Werkinstructies voor Claude Code

### Altijd
- Begin elke taak met het lezen van dit bestand en van `lib/calc/README.md` als die bestaat.
- Werk per epic uit sectie 9, in volgorde. Eén PR per afgebakende taak. Commitboodschappen in het Engels, conventional commits.
- Elke calc-functie krijgt tests met minstens: een 7,4 kW-auto, een 11 kW-auto, een 22 kW-auto, een 1F-auto op een 3F-paal, en een randgeval met ontbrekende velden.
- Elke migratie is idempotent en heeft een down-migratie.
- Copy komt uit `lib/copy/{locale}.ts`. Geen hardcoded strings in components. Franse copy schrijven in Belgisch Frans (borne, avantage de toute nature, gestionnaire de réseau), niet in Frans-Frans.
- Bij twijfel over een fiscaal of tariefgetal: **niet invullen**, een `TODO(verify: <bron>)` plaatsen en de rij uit de berekening houden. Een lege waarde is beter dan een verzonnen waarde.
- Rond af bij renderen, niet in de calc-laag. Geld als eurocent-integers.

### Nooit
- Geen regels, percentages of tarieven hardcoden in TypeScript. Alles uit `rules` en `tariffs`.
- Geen LLM-gegenereerde pagina-copy in productie. Templates + placeholders + data.
- Geen scraping van EV Database, ANWB, Autoblog of andere spec-aggregators.
- Geen `Accept-Language`-redirects. Geen kale `hreflang="nl"`.
- Geen pagina's publiceren met `completeness < 1.0` of zonder eigen berekening.
- Geen installateurspagina per gemeente zonder gecontracteerde installateurs.
- Geen `AggregateRating` of andere schema-markup die we niet kunnen onderbouwen.
- Geen client-side data-fetching op pSEO-pagina's.

### Definition of done voor een template
1. Calc-functies getest en gedocumenteerd.
2. Pagina rendert correct in alle drie locales (of expliciet uitgesloten per locale in `pages`).
3. hreflang-, sitemap- en related-tests groen.
4. Lighthouse mobiel: Performance ≥ 90, SEO 100.
5. Eén voorbeeldpagina handmatig nagekeken op feitelijke juistheid door Erwin voor `status='index'`.

### Aanbevolen startvolgorde
1. Supabase-migraties + Zod-schema's voor `rules.params`.
2. `lib/calc/chargeTime`, `advice`, `capacityImpact` met tests.
3. Seed: 10 modellen, VLA-regels 2026, 4 BE-tarieven.
4. Template `charger_for_model` nl-BE, één pagina end-to-end incl. leadformulier.
5. hreflang/sitemap/related-laag.
6. Pas dan: opschalen naar 120+ modellen.

---

## 11. Te verifiëren voor livegang (bronnenlijst)

| Onderwerp | Waar | Frequentie |
|-----------|------|-----------|
| VAA-formule, referentie-CO2, minimum-VAA per aanslagjaar | FOD Financiën / Fisconetplus | Jaarlijks (december) |
| Aftrekbaarheid per aankoopjaar en powertrain | FOD Financiën | Jaarlijks |
| Capaciteitstarief €/kW per netbeheerder | VREG / Fluvius | Jaarlijks (januari) |
| 6% btw voorwaarden laadpaal | FOD Financiën circulaire | Bij wijziging |
| CREG-tarief terugbetaling thuisladen | CREG | Kwartaallijks |
| Gemiddelde all-in elektriciteitsprijs BE | CREG boordtabel | Maandelijks/kwartaallijks |
| Meldingsplicht per netbeheerder | Fluvius, ORES, RESA, Sibelga | Bij wijziging |
| Bijtelling NL per registratiejaar | Belastingdienst | Jaarlijks |
| ISDE laadpaal | RVO | Jaarlijks |
| Einde saldering en terugleververgoedingen NL | Rijksoverheid / ACM | Bij wijziging |
| Specs per versie | Fabrikantenprijslijst (datum) | Bij modeljaarwissel |

Elke rij hierboven correspondeert met een `sources`-record en een n8n-herinnering.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
